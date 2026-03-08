import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { addSubtask, updateSubtask, deleteSubtask } from '@/lib/api';
import type { Subtask, AssignedTo } from '@/types';

const ASSIGNED_LABEL: Record<string, string> = {
  either: '',
  juli: 'Juli',
  gino: 'Gino',
  together: 'Both',
};

const ASSIGNMENTS: { value: AssignedTo; label: string }[] = [
  { value: 'either', label: 'Either' },
  { value: 'juli', label: 'Juli' },
  { value: 'gino', label: 'Gino' },
  { value: 'together', label: 'Together' },
];

interface Props {
  cardId: string;
  subtasks: Subtask[];
  currentUserId: string;
  onUpdate: () => void;
}

export function SubtasksSection({ cardId, subtasks, currentUserId, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssigned, setNewAssigned] = useState<AssignedTo>('either');
  const [adding, setAdding] = useState(false);

  const handleStatusTap = async (subtask: Subtask) => {
    const next =
      subtask.status === 'pending' ? 'on_it'
      : subtask.status === 'on_it' ? 'done'
      : 'pending';
    try {
      await updateSubtask(cardId, subtask.id, { status: next, status_user_id: currentUserId });
      onUpdate();
    } catch {
      Alert.alert('Error', 'Could not update this step.');
    }
  };

  const handleDelete = (subtask: Subtask) => {
    Alert.alert('Remove this step?', `"${subtask.title}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubtask(cardId, subtask.id);
            onUpdate();
          } catch {
            Alert.alert('Error', 'Could not remove this step.');
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await addSubtask(cardId, { title: trimmed, assigned_to: newAssigned });
      setNewTitle('');
      setNewAssigned('either');
      setShowAdd(false);
      onUpdate();
    } catch {
      Alert.alert('Error', 'Could not add this step.');
    } finally {
      setAdding(false);
    }
  };

  const doneCount = subtasks.filter((s) => s.status === 'done').length;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>STEPS</Text>
          {subtasks.length > 0 && (
            <View style={[styles.progressPill, doneCount === subtasks.length && styles.progressPillDone]}>
              <Text style={[styles.progressText, doneCount === subtasks.length && styles.progressTextDone]}>
                {doneCount}/{subtasks.length} done
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => { setShowAdd((v) => !v); setNewTitle(''); }}>
          <Text style={styles.addToggle}>{showAdd ? 'Cancel' : '+ Add step'}</Text>
        </TouchableOpacity>
      </View>

      {/* Subtask list */}
      {subtasks.length === 0 && !showAdd && (
        <Text style={styles.empty}>Break this task into steps — tap "Add step" to get started</Text>
      )}

      {subtasks.map((subtask) => (
        <SubtaskRow
          key={subtask.id}
          subtask={subtask}
          onStatusTap={() => handleStatusTap(subtask)}
          onDelete={() => handleDelete(subtask)}
        />
      ))}

      {/* Add form */}
      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            placeholder="What needs to happen?"
            placeholderTextColor="#C0B5AC"
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <View style={styles.assignRow}>
            {ASSIGNMENTS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.assignChip, newAssigned === a.value && styles.assignChipSelected]}
                onPress={() => setNewAssigned(a.value)}
              >
                <Text style={[styles.assignChipText, newAssigned === a.value && styles.assignChipTextSelected]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.addBtn, (!newTitle.trim() || adding) && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!newTitle.trim() || adding}
          >
            <Text style={styles.addBtnText}>{adding ? 'Adding...' : 'Add step'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function SubtaskRow({
  subtask,
  onStatusTap,
  onDelete,
}: {
  subtask: Subtask;
  onStatusTap: () => void;
  onDelete: () => void;
}) {
  const isDone = subtask.status === 'done';
  const isOnIt = subtask.status === 'on_it';
  const actorName = subtask.status_user_id === 'juli' ? 'Juli' : 'Gino';

  return (
    <View style={styles.row}>
      {/* Status tap target */}
      <TouchableOpacity onPress={onStatusTap} style={styles.statusBtn} activeOpacity={0.7}>
        <View style={[
          styles.statusCircle,
          isDone && styles.statusCircleDone,
          isOnIt && styles.statusCircleOnIt,
        ]}>
          {isDone ? (
            <Text style={styles.statusCheckmark}>✓</Text>
          ) : isOnIt ? (
            <Text style={styles.statusOnItDot} />
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, isDone && styles.rowTitleDone]} numberOfLines={2}>
          {subtask.title}
        </Text>
        {(isOnIt || isDone) && subtask.status_user_id && (
          <Text style={[styles.statusNote, isDone && styles.statusNoteDone]}>
            {isDone ? `✓ Done by ${actorName}` : `💪 ${actorName} is on it`}
          </Text>
        )}
      </View>

      {/* Assignee badge */}
      {subtask.assigned_to !== 'either' && (
        <View style={styles.assignBadge}>
          <Text style={styles.assignBadgeText}>{ASSIGNED_LABEL[subtask.assigned_to]}</Text>
        </View>
      )}

      {/* Delete */}
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.deleteBtn}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7F77',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPill: {
    backgroundColor: '#F5EDE4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  progressPillDone: {
    backgroundColor: '#E8F4F0',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A7F77',
  },
  progressTextDone: {
    color: '#5A9E8A',
  },
  addToggle: {
    fontSize: 14,
    color: '#5B9BD5',
    fontWeight: '600',
  },
  empty: {
    fontSize: 13,
    color: '#B0A8A0',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
    gap: 10,
  },
  statusBtn: {
    paddingTop: 1,
  },
  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C0B5AC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCircleDone: {
    borderColor: '#5A9E8A',
    backgroundColor: '#5A9E8A',
  },
  statusCircleOnIt: {
    borderColor: '#D4845A',
    backgroundColor: '#FDF0E8',
  },
  statusCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  statusOnItDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4845A',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    color: '#2C2C2C',
    fontWeight: '500',
    lineHeight: 20,
  },
  rowTitleDone: {
    color: '#B0A8A0',
    textDecorationLine: 'line-through',
  },
  statusNote: {
    fontSize: 12,
    color: '#D4845A',
    fontWeight: '500',
  },
  statusNoteDone: {
    color: '#5A9E8A',
  },
  assignBadge: {
    backgroundColor: '#F5EDE4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  assignBadgeText: {
    fontSize: 11,
    color: '#5C4A38',
    fontWeight: '600',
  },
  deleteBtn: {
    paddingTop: 1,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#C0B5AC',
    lineHeight: 22,
  },
  // Add form
  addForm: {
    marginTop: 8,
    gap: 10,
  },
  addInput: {
    borderWidth: 1.5,
    borderColor: '#D4845A',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#2C2C2C',
    backgroundColor: '#fff',
  },
  assignRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  assignChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    backgroundColor: '#fff',
  },
  assignChipSelected: {
    borderColor: '#D4845A',
    backgroundColor: '#FDF0E8',
  },
  assignChipText: {
    fontSize: 13,
    color: '#8A7F77',
    fontWeight: '500',
  },
  assignChipTextSelected: {
    color: '#D4845A',
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#D4845A',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
