import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { getCard, updateCard, deleteCard, addGroceryItem } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { TimelineBadge } from '@/components/TimelineBadge';
import { CommentsSection } from '@/components/CommentsSection';
import { ReactionsSection } from '@/components/ReactionsSection';
import { SubtasksSection } from '@/components/SubtasksSection';
import { getSocket, EVENTS } from '@/lib/socket';
import { PRESET_TAGS } from '@/types';
import type { Card } from '@/types';

const PRIORITY_LABEL: Record<string, string> = {
  urgent: '🔴 Urgent',
  normal: '⚪ Normal',
  low: '🟢 Low',
};

const ASSIGNED_LABEL: Record<string, string> = {
  either: 'Either of us',
  juli: 'Juli',
  gino: 'Gino',
  together: 'Together',
};

const FREQ_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

function getTagDisplay(tag: string | null | undefined): string {
  if (!tag) return '';
  const preset = PRESET_TAGS.find((t) => t.name === tag);
  return preset ? `${preset.emoji} ${preset.name}` : `🏷️ ${tag}`;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingNote, setWaitingNote] = useState('');
  const [showWaitingInput, setShowWaitingInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [groceryItem, setGroceryItem] = useState('');
  const [showGroceryAdd, setShowGroceryAdd] = useState(false);
  const [groceryAdding, setGroceryAdding] = useState(false);
  const [groceryConfirm, setGroceryConfirm] = useState(false);

  const fetchCard = useCallback(async () => {
    try {
      const { data } = await getCard(id);
      setCard(data);
    } catch {
      Alert.alert('Error', 'Could not load this task.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCard();
    const socket = getSocket();
    const onUpdate = (updated: Card) => {
      if (updated.id === id) setCard(updated);
    };
    const onDelete = ({ id: deletedId }: { id: string }) => {
      if (deletedId === id) router.back();
    };
    socket.on(EVENTS.CARD_UPDATED, onUpdate);
    socket.on(EVENTS.CARD_DELETED, onDelete);
    socket.on(EVENTS.COMMENT_ADDED, () => fetchCard());
    socket.on(EVENTS.REACTION_UPDATED, () => fetchCard());
    return () => {
      socket.off(EVENTS.CARD_UPDATED, onUpdate);
      socket.off(EVENTS.CARD_DELETED, onDelete);
      socket.off(EVENTS.COMMENT_ADDED);
      socket.off(EVENTS.REACTION_UPDATED);
    };
  }, [id, fetchCard]);

  const doUpdate = async (patch: object) => {
    if (!card) return;
    setActionLoading(true);
    try {
      await updateCard(card.id, { ...patch, current_user_id: userId });
      await fetchCard();
    } catch {
      Alert.alert('Error', 'Could not update task. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = () => {
    if (!card) return;
    const isOwner = card.status === 'on_it' && card.status_user_id === userId;
    doUpdate({ status: isOwner ? 'pending' : 'on_it' });
  };

  const handleDone = () => {
    const isRecurring = card?.is_recurring;
    const message = isRecurring
      ? `"${card?.title}" will be marked done and a new instance created for next time. 🔁`
      : `"${card?.title}"`;
    Alert.alert('Mark as done?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Done! 🎉', onPress: () => doUpdate({ status: 'done' }) },
    ]);
  };

  const handleWaiting = () => {
    if (showWaitingInput) {
      doUpdate({ status: 'waiting', status_note: waitingNote.trim() });
      setShowWaitingInput(false);
    } else {
      setWaitingNote(card?.status_note ?? '');
      setShowWaitingInput(true);
    }
  };

  const handleSnooze = () => {
    if (!card) return;
    const count = card.snooze_count ?? 0;
    const message =
      count >= 2
        ? 'This has been snoozed a few times — want to tackle it together or reassign it?'
        : 'This task will be pushed forward by 7 days.';
    Alert.alert('Snooze task?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Snooze 😴', onPress: () => doUpdate({ status: 'snoozed' }) },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCard(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C6FCD" />
        </View>
      </SafeAreaView>
    );
  }

  if (!card) return null;

  const isOnItByMe = card.status === 'on_it' && card.status_user_id === userId;
  const isOnItByOther = card.status === 'on_it' && card.status_user_id !== userId;
  const statusUserName = card.status_user_id === 'juli' ? 'Juli' : 'Gino';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => router.push(`/card/edit?id=${id}`)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.cardHeader}>
          <TimelineBadge card={card} />
          {card.priority !== 'normal' && (
            <Text style={styles.priorityLabel}>{PRIORITY_LABEL[card.priority]}</Text>
          )}
          {card.snooze_count > 0 && (
            <Text style={styles.snoozeCount}>Snoozed {card.snooze_count}×</Text>
          )}
        </View>

        <Text style={styles.title}>{card.title}</Text>

        {/* Status banners */}
        {card.status === 'on_it' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>
              {statusUserName} is on it 💪{'  '}
              <Text style={styles.statusTimestamp}>· {formatTimestamp(card.status_updated_at)}</Text>
            </Text>
          </View>
        )}
        {card.status === 'waiting' && (
          <View style={[styles.statusBanner, styles.waitingBanner]}>
            <Text style={styles.statusBannerText}>
              ⏳ Waiting on...{card.status_note ? ` "${card.status_note}"` : ''}
            </Text>
          </View>
        )}
        {card.status === 'snoozed' && (
          <View style={[styles.statusBanner, styles.snoozeBanner]}>
            <Text style={styles.statusBannerText}>
              😴 Snoozed until {card.snoozed_until ?? 'next week'}
              {card.original_timeline ? ` (was: ${card.original_timeline.replace('_', ' ')})` : ''}
            </Text>
          </View>
        )}

        {/* Fields */}
        <View style={styles.fields}>
          {card.assigned_to !== 'either' && (
            <Row label="Who" value={`👤 ${ASSIGNED_LABEL[card.assigned_to]}`} />
          )}
          {card.tag && <Row label="Category" value={getTagDisplay(card.tag)} />}
          {card.is_recurring && card.recurring_frequency && (
            <Row label="Recurring" value={`🔁 ${FREQ_LABEL[card.recurring_frequency]}`} />
          )}
          {card.notes && <Row label="Notes" value={card.notes} />}
          <Row label="Added by" value={card.created_by === 'juli' ? 'Juli' : 'Gino'} />
          <Row label="Created" value={formatTimestamp(card.created_at)} />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {showWaitingInput && (
            <TextInput
              style={styles.waitingInput}
              value={waitingNote}
              onChangeText={setWaitingNote}
              placeholder="What are you waiting on?"
              placeholderTextColor="#B8B4CC"
              autoFocus
            />
          )}

          <View style={styles.actionsGrid}>
            <ActionButton
              label={isOnItByMe ? 'Unclaim' : isOnItByOther ? `${statusUserName} is on it` : "I'm on it"}
              emoji={isOnItByMe ? '↩️' : '💪'}
              onPress={handleClaim}
              disabled={actionLoading}
              highlight={isOnItByMe}
            />
            <ActionButton
              label="Mark as Done"
              emoji="✅"
              onPress={handleDone}
              disabled={actionLoading || card.status === 'done'}
              primary
            />
            <ActionButton
              label={showWaitingInput ? 'Confirm' : 'Waiting on...'}
              emoji="⏳"
              onPress={handleWaiting}
              disabled={actionLoading}
              highlight={card.status === 'waiting'}
            />
            <ActionButton
              label="Snooze"
              emoji="😴"
              onPress={handleSnooze}
              disabled={actionLoading}
            />
          </View>
        </View>

        {/* Subtasks / Steps */}
        <SubtasksSection
          cardId={card.id}
          subtasks={card.subtasks ?? []}
          currentUserId={userId!}
          onUpdate={fetchCard}
        />

        {/* Reactions */}
        <ReactionsSection
          cardId={card.id}
          reactions={card.reactions ?? []}
          currentUserId={userId!}
          onUpdate={fetchCard}
        />

        {/* Comments */}
        <CommentsSection
          cardId={card.id}
          comments={card.comments ?? []}
          currentUserId={userId!}
          onUpdate={fetchCard}
        />

        {/* Grocery shortcut — only for Groceries-tagged cards */}
        {card.tag === 'Groceries' && (
          <View style={styles.grocerySection}>
            <View style={styles.grocerySectionHeader}>
              <Text style={styles.sectionTitle}>Add to grocery list</Text>
              <TouchableOpacity onPress={() => setShowGroceryAdd((v) => !v)}>
                <Text style={styles.groceryToggle}>{showGroceryAdd ? 'Cancel' : '+ Add item'}</Text>
              </TouchableOpacity>
            </View>

            {showGroceryAdd && (
              <View style={styles.groceryInputRow}>
                <TextInput
                  style={styles.groceryInput}
                  value={groceryItem}
                  onChangeText={setGroceryItem}
                  placeholder="Item name..."
                  placeholderTextColor="#B8B4CC"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.groceryAddBtn, (!groceryItem.trim() || groceryAdding) && styles.groceryAddBtnDisabled]}
                  disabled={!groceryItem.trim() || groceryAdding}
                  onPress={async () => {
                    if (!groceryItem.trim()) return;
                    setGroceryAdding(true);
                    try {
                      await addGroceryItem({ name: groceryItem.trim(), added_by: userId });
                      setGroceryItem('');
                      setGroceryConfirm(true);
                      setTimeout(() => setGroceryConfirm(false), 2000);
                    } catch {
                      Alert.alert('Error', 'Could not add to grocery list.');
                    } finally {
                      setGroceryAdding(false);
                    }
                  }}
                >
                  <Text style={styles.groceryAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}

            {groceryConfirm && (
              <Text style={styles.groceryConfirm}>✓ Added to grocery list!</Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label, emoji, onPress, disabled, primary, highlight,
}: {
  label: string; emoji: string; onPress: () => void;
  disabled?: boolean; primary?: boolean; highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        primary && styles.actionBtnPrimary,
        highlight && styles.actionBtnHighlight,
        disabled && styles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={styles.actionBtnEmoji}>{emoji}</Text>
      <Text style={[styles.actionBtnLabel, primary && styles.actionBtnLabelPrimary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFF',
  },
  back: { fontSize: 17, color: '#7C6FCD', fontWeight: '500' },
  navRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  editText: { fontSize: 15, color: '#7C6FCD', fontWeight: '500' },
  deleteText: { fontSize: 15, color: '#F06565' },
  scroll: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  priorityLabel: { fontSize: 13, color: '#9B96B0', fontWeight: '500' },
  snoozeCount: { fontSize: 13, color: '#9B96B0', fontWeight: '500' },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1826',
    paddingHorizontal: 20,
    lineHeight: 34,
    marginBottom: 12,
  },
  statusBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#E0F5F3',
    borderRadius: 10,
    padding: 12,
  },
  waitingBanner: { backgroundColor: '#FFF5E0' },
  snoozeBanner: { backgroundColor: '#ECEAFF' },
  statusBannerText: { fontSize: 14, color: '#2DA89A', fontWeight: '500' },
  statusTimestamp: { color: '#9B96B0', fontWeight: '400', fontSize: 13 },
  fields: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECEAFF',
  },
  fieldRow: {
    flexDirection: 'row',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldLabel: { fontSize: 14, color: '#9B96B0', fontWeight: '500', flex: 1 },
  fieldValue: { fontSize: 14, color: '#1A1826', fontWeight: '500', flex: 2, textAlign: 'right' },
  actionsSection: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9B96B0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  waitingInput: {
    borderWidth: 1.5,
    borderColor: '#7C6FCD',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A1826',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  actionBtnPrimary: { backgroundColor: '#7C6FCD', borderColor: '#7C6FCD' },
  actionBtnHighlight: { borderColor: '#7C6FCD', backgroundColor: '#EDE9FF' },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnEmoji: { fontSize: 22 },
  actionBtnLabel: { fontSize: 13, fontWeight: '600', color: '#1A1826', textAlign: 'center' },
  actionBtnLabelPrimary: { color: '#fff' },
  // Grocery shortcut
  grocerySection: { paddingHorizontal: 20, marginBottom: 24 },
  grocerySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  groceryToggle: { fontSize: 14, color: '#7C6FCD', fontWeight: '600' },
  groceryInputRow: { flexDirection: 'row', gap: 8 },
  groceryInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1826',
    backgroundColor: '#fff',
    height: 42,
  },
  groceryAddBtn: {
    backgroundColor: '#7C6FCD',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    justifyContent: 'center',
  },
  groceryAddBtnDisabled: { opacity: 0.4 },
  groceryAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  groceryConfirm: { marginTop: 8, fontSize: 13, color: '#5CC8BD', fontWeight: '600' },
});
