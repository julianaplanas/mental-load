import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TimelineBadge } from './TimelineBadge';
import { PRESET_TAGS } from '@/types';
import type { Card } from '@/types';

const PRIORITY_DOT: Record<string, string> = {
  urgent: '🔴',
  normal: '⚪',
  low: '🟢',
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: '#F06565',
  normal: '#7C6FCD',
  low: '#5CC8BD',
};

const ASSIGNED_LABEL: Record<string, string> = {
  juli: 'Juli',
  gino: 'Gino',
  together: 'Together',
  either: '',
};

function getTagEmoji(tag: string | null | undefined): string {
  if (!tag) return '';
  const preset = PRESET_TAGS.find((t) => t.name === tag);
  return preset?.emoji ?? '🏷️';
}

interface Props {
  card: Card;
}

export function CardItem({ card }: Props) {
  const router = useRouter();
  const visibleReactions = (card.reactions ?? []).slice(0, 3);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: PRIORITY_BORDER[card.priority] ?? '#7C6FCD' }]}
      onPress={() => router.push(`/card/${card.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {card.tag && (
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>
                {getTagEmoji(card.tag)} {card.tag}
              </Text>
            </View>
          )}
          {card.priority !== 'normal' && (
            <Text style={styles.priorityDot}>{PRIORITY_DOT[card.priority]}</Text>
          )}
        </View>
        <TimelineBadge card={card} small />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {card.title}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          {card.assigned_to !== 'either' && (
            <Text style={styles.assignedText}>
              👤 {ASSIGNED_LABEL[card.assigned_to]}
            </Text>
          )}
          {card.status === 'on_it' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} is on it 💪
              </Text>
            </View>
          )}
          {card.status === 'waiting' && (
            <View style={[styles.statusBadge, styles.waitingBadge]}>
              <Text style={styles.statusText}>Waiting on...</Text>
            </View>
          )}
          {card.is_recurring && (
            <Text style={styles.recurringText}>🔁</Text>
          )}
        </View>

        <View style={styles.bottomRight}>
          {(card.subtask_count ?? 0) > 0 && (
            <View style={[
              styles.subtaskPill,
              card.subtask_done_count === card.subtask_count && styles.subtaskPillDone,
            ]}>
              <Text style={[
                styles.subtaskPillText,
                card.subtask_done_count === card.subtask_count && styles.subtaskPillTextDone,
              ]}>
                {card.subtask_done_count}/{card.subtask_count} ✓
              </Text>
            </View>
          )}
          {visibleReactions.length > 0 && (
            <View style={styles.reactions}>
              {visibleReactions.map((r) => (
                <Text key={r.id} style={styles.reactionEmoji}>{r.emoji}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#1A1826',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
    borderLeftWidth: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tagPill: {
    backgroundColor: '#EDE9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#6B6585',
    fontWeight: '500',
  },
  priorityDot: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1826',
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  assignedText: {
    fontSize: 12,
    color: '#9B96B0',
  },
  statusBadge: {
    backgroundColor: '#E0F5F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  waitingBadge: {
    backgroundColor: '#FFF5E0',
  },
  statusText: {
    fontSize: 11,
    color: '#5CC8BD',
    fontWeight: '500',
  },
  recurringText: {
    fontSize: 12,
    color: '#9B96B0',
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskPill: {
    backgroundColor: '#EDE9FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subtaskPillDone: {
    backgroundColor: '#E0F5F3',
  },
  subtaskPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9B96B0',
  },
  subtaskPillTextDone: {
    color: '#5CC8BD',
  },
  reactions: {
    flexDirection: 'row',
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
});
