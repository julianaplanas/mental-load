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
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCard, updateCard } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PRESET_TAGS } from '@/types';
import type { Timeline, AssignedTo, Priority, RecurringFrequency, Card } from '@/types';

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

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'normal', label: '⚪ Normal' },
  { value: 'low', label: '🟢 Low' },
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
  options: { value: T; label: string }[];
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
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    backgroundColor: '#fff',
  },
  selected: { borderColor: '#D4845A', backgroundColor: '#FDF0E8' },
  label: { fontSize: 14, color: '#8A7F77', fontWeight: '500' },
  selectedLabel: { color: '#D4845A', fontWeight: '600' },
});

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    getCard(id)
      .then(({ data }: { data: Card }) => {
        setTitle(data.title);
        // Use original timeline if card was snoozed
        const tl = (data.original_timeline as Timeline) ?? data.timeline;
        setTimeline(tl);
        setCustomDate(data.custom_date ?? '');
        setAssignedTo(data.assigned_to);
        setTag(data.tag ?? null);
        setPriority(data.priority);
        setIsRecurring(data.is_recurring);
        setRecurringFrequency(data.recurring_frequency ?? 'weekly');
        setNotes(data.notes ?? '');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not load task.');
        router.back();
      })
      .finally(() => setFetching(false));
  }, [id]);

  const isCustomTag = tag !== null && !PRESET_TAGS.find((t) => t.name === tag);

  const handleConfirmCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed) setTag(trimmed);
    setShowCustomTagInput(false);
    setCustomTagInput('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a task title.');
      return;
    }
    if (timeline === 'custom' && !customDate) {
      Alert.alert('Missing date', 'Please enter a custom date (YYYY-MM-DD).');
      return;
    }

    setSubmitting(true);
    try {
      await updateCard(id, {
        title: title.trim(),
        timeline,
        custom_date: timeline === 'custom' ? customDate : null,
        assigned_to: assignedTo,
        tag,
        priority,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : null,
        notes: notes.trim() || null,
        current_user_id: userId,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D4845A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Task</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          style={[styles.saveBtn, submitting && { opacity: 0.5 }]}
        >
          <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            placeholder="What needs to be done?"
            placeholderTextColor="#C0B5AC"
            value={title}
            onChangeText={setTitle}
            multiline
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
              placeholderTextColor="#C0B5AC"
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
                placeholderTextColor="#C0B5AC"
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
              trackColor={{ true: '#D4845A' }}
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
            placeholderTextColor="#C0B5AC"
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
  container: { flex: 1, backgroundColor: '#FDF6EE' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5DA',
  },
  cancel: { fontSize: 16, color: '#8A7F77' },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#2C2C2C' },
  saveBtn: {
    backgroundColor: '#D4845A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5 },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C2C2C',
    lineHeight: 30,
    minHeight: 60,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#2C2C2C',
    backgroundColor: '#fff',
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    backgroundColor: '#fff',
  },
  tagChipSelected: { borderColor: '#D4845A', backgroundColor: '#FDF0E8' },
  tagChipText: { fontSize: 13, color: '#8A7F77', fontWeight: '500' },
  tagChipTextSelected: { color: '#D4845A', fontWeight: '600' },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#2C2C2C',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customTagRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  customTagInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D4845A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#2C2C2C',
    backgroundColor: '#fff',
  },
  customTagConfirm: {
    backgroundColor: '#D4845A',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customTagConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
