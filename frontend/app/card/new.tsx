import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { createCard } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { enqueueAction } from '@/lib/offlineQueue';
import { PRESET_TAGS } from '@/types';
import type { Timeline, AssignedTo, Priority, RecurringFrequency } from '@/types';

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'custom', label: 'Custom date' },
];

const ASSIGNMENTS: { value: AssignedTo; label: string }[] = [
  { value: 'either', label: 'Either of us' },
  { value: 'juli', label: 'Juli' },
  { value: 'gino', label: 'Gino' },
  { value: 'together', label: 'Together' },
];

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'urgent', label: '🔴 Urgent', color: '#F06565' },
  { value: 'normal', label: '⚪ Normal', color: '#9B96B0' },
  { value: 'low', label: '🟢 Low', color: '#5CC8BD' },
];

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

function SegmentedPicker<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={seg.row}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[seg.option, value === opt.value && seg.selected]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[seg.label, value === opt.value && seg.selectedLabel]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const seg = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    backgroundColor: '#fff',
  },
  selected: { borderColor: '#7C6FCD', backgroundColor: '#EDE9FF' },
  label: { fontSize: 14, color: '#9B96B0', fontWeight: '500' },
  selectedLabel: { color: '#7C6FCD', fontWeight: '600' },
});

export default function NewCardScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [title, setTitle] = useState('');
  const [timeline, setTimeline] = useState<Timeline>('this_week');
  const [customDate, setCustomDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<AssignedTo>('either');
  const [tag, setTag] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [priority, setPriority] = useState<Priority>('normal');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('weekly');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCustomTag = tag !== null && !PRESET_TAGS.find((t) => t.name === tag);

  const handleConfirmCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed) {
      setTag(trimmed);
    }
    setShowCustomTagInput(false);
    setCustomTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('One more thing', 'Please add a title for this task.');
      return;
    }
    if (timeline === 'custom' && !customDate) {
      Alert.alert('One more thing', 'Please enter a custom date (YYYY-MM-DD).');
      return;
    }

    const cardData = {
      title: title.trim(),
      timeline,
      custom_date: timeline === 'custom' ? customDate : undefined,
      assigned_to: assignedTo,
      tag,
      priority,
      is_recurring: isRecurring,
      recurring_frequency: isRecurring ? recurringFrequency : undefined,
      notes: notes.trim() || undefined,
      created_by: userId,
    };

    setSubmitting(true);
    try {
      await createCard(cardData);
      router.back();
    } catch (err: any) {
      const isNetworkError = !err.response;
      if (isNetworkError) {
        await enqueueAction('createCard', cardData);
        Alert.alert(
          'Saved for later',
          "You're offline, but we've saved this task. It'll sync automatically when you reconnect."
        );
        router.back();
      } else {
        Alert.alert('Hmm, something went wrong', "Couldn't add this task. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Task</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.saveBtn, submitting && { opacity: 0.5 }]}
        >
          <Text style={styles.saveBtnText}>{submitting ? 'Adding...' : 'Add Task'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            placeholder="What needs to be done?"
            placeholderTextColor="#B8B4CC"
            value={title}
            onChangeText={setTitle}
            multiline
            autoFocus
          />
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.label}>When</Text>
          <SegmentedPicker options={TIMELINES} value={timeline} onChange={setTimeline} />
          {timeline === 'custom' && (
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#B8B4CC"
              value={customDate}
              onChangeText={setCustomDate}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Assigned to */}
        <View style={styles.section}>
          <Text style={styles.label}>Who</Text>
          <SegmentedPicker options={ASSIGNMENTS} value={assignedTo} onChange={setAssignedTo} />
        </View>

        {/* Tag */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PRESET_TAGS.map((t) => (
                <TouchableOpacity
                  key={t.name}
                  style={[styles.tagChip, tag === t.name && styles.tagChipSelected]}
                  onPress={() => {
                    setTag(tag === t.name ? null : t.name);
                    setShowCustomTagInput(false);
                  }}
                >
                  <Text style={[styles.tagChipText, tag === t.name && styles.tagChipTextSelected]}>
                    {t.emoji} {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Custom tag chip (shown when one is set) */}
              {isCustomTag && (
                <TouchableOpacity
                  style={[styles.tagChip, styles.tagChipSelected]}
                  onPress={() => setTag(null)}
                >
                  <Text style={[styles.tagChipText, styles.tagChipTextSelected]}>
                    🏷️ {tag} ✕
                  </Text>
                </TouchableOpacity>
              )}
              {/* Add custom button */}
              {!isCustomTag && (
                <TouchableOpacity
                  style={[styles.tagChip, showCustomTagInput && styles.tagChipSelected]}
                  onPress={() => {
                    setTag(null);
                    setShowCustomTagInput((v) => !v);
                  }}
                >
                  <Text style={[styles.tagChipText, showCustomTagInput && styles.tagChipTextSelected]}>
                    ＋ Custom
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          {showCustomTagInput && (
            <View style={styles.customTagRow}>
              <TextInput
                style={styles.customTagInput}
                placeholder="e.g. Garden, Car..."
                placeholderTextColor="#B8B4CC"
                value={customTagInput}
                onChangeText={setCustomTagInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirmCustomTag}
              />
              <TouchableOpacity
                style={[styles.customTagConfirm, !customTagInput.trim() && { opacity: 0.4 }]}
                onPress={handleConfirmCustomTag}
                disabled={!customTagInput.trim()}
              >
                <Text style={styles.customTagConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <SegmentedPicker options={PRIORITIES} value={priority} onChange={setPriority} />
        </View>

        {/* Recurring */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Recurring</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ true: '#7C6FCD' }}
              thumbColor="#fff"
            />
          </View>
          {isRecurring && (
            <SegmentedPicker
              options={FREQUENCIES}
              value={recurringFrequency}
              onChange={setRecurringFrequency}
            />
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any extra context..."
            placeholderTextColor="#B8B4CC"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFF',
  },
  cancel: { fontSize: 16, color: '#9B96B0' },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#1A1826' },
  saveBtn: {
    backgroundColor: '#7C6FCD',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#9B96B0', textTransform: 'uppercase', letterSpacing: 0.5 },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1826',
    lineHeight: 30,
    minHeight: 60,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A1826',
    backgroundColor: '#fff',
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    backgroundColor: '#fff',
  },
  tagChipSelected: { borderColor: '#7C6FCD', backgroundColor: '#EDE9FF' },
  tagChipText: { fontSize: 13, color: '#9B96B0', fontWeight: '500' },
  tagChipTextSelected: { color: '#7C6FCD', fontWeight: '600' },
  customTagRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  customTagInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#7C6FCD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1A1826',
    backgroundColor: '#fff',
  },
  customTagConfirm: {
    backgroundColor: '#7C6FCD',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customTagConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1826',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
