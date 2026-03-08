import { useState } from 'react';
import { addSubtask, updateSubtask, deleteSubtask } from '@/lib/api';
import type { Subtask, AssignedTo } from '@/types';

const ASSIGNED_LABEL: Record<string, string> = {
  either: '', juli: 'Juli', gino: 'Gino', together: 'Both',
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
      // silently ignore
    }
  };

  const handleDelete = async (subtask: Subtask) => {
    if (!confirm(`Remove "${subtask.title}"?`)) return;
    try {
      await deleteSubtask(cardId, subtask.id);
      onUpdate();
    } catch {
      // silently ignore
    }
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
      // silently ignore
    } finally {
      setAdding(false);
    }
  };

  const doneCount = subtasks.filter((s) => s.status === 'done').length;
  const allDone = subtasks.length > 0 && doneCount === subtasks.length;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Steps
          </span>
          {subtasks.length > 0 && (
            <span style={{
              background: allDone ? '#E8F4F0' : '#F5EDE4',
              color: allDone ? '#5A9E8A' : '#8A7F77',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            }}>
              {doneCount}/{subtasks.length} done
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setNewTitle(''); }}
          style={{ fontSize: 14, color: '#5B9BD5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {showAdd ? 'Cancel' : '+ Add step'}
        </button>
      </div>

      {/* Empty state */}
      {subtasks.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: '#B0A8A0', fontStyle: 'italic', textAlign: 'center', padding: '12px 0', margin: 0 }}>
          Break this task into steps — tap "Add step" to get started
        </p>
      )}

      {/* Subtask rows */}
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
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            style={{
              border: '1.5px solid #D4845A', borderRadius: 10, padding: 12,
              fontSize: 15, color: '#2C2C2C', background: '#fff', width: '100%',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            placeholder="What needs to happen?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ASSIGNMENTS.map((a) => (
              <button
                key={a.value}
                onClick={() => setNewAssigned(a.value)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: newAssigned === a.value ? 600 : 500,
                  border: `1.5px solid ${newAssigned === a.value ? '#D4845A' : '#EDE5DA'}`,
                  background: newAssigned === a.value ? '#FDF0E8' : '#fff',
                  color: newAssigned === a.value ? '#D4845A' : '#8A7F77',
                  cursor: 'pointer',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || adding}
            style={{
              background: '#D4845A', color: '#fff', border: 'none', borderRadius: 10,
              padding: '11px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              opacity: (!newTitle.trim() || adding) ? 0.4 : 1,
            }}
          >
            {adding ? 'Adding...' : 'Add step'}
          </button>
        </div>
      )}
    </div>
  );
}

function SubtaskRow({
  subtask, onStatusTap, onDelete,
}: {
  subtask: Subtask; onStatusTap: () => void; onDelete: () => void;
}) {
  const isDone = subtask.status === 'done';
  const isOnIt = subtask.status === 'on_it';
  const actorName = subtask.status_user_id === 'juli' ? 'Juli' : 'Gino';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10,
      borderBottom: '1px solid #F5EDE4', gap: 10,
    }}>
      {/* Status circle */}
      <button
        onClick={onStatusTap}
        style={{
          width: 22, height: 22, borderRadius: 11, flexShrink: 0,
          border: `2px solid ${isDone ? '#5A9E8A' : isOnIt ? '#D4845A' : '#C0B5AC'}`,
          background: isDone ? '#5A9E8A' : isOnIt ? '#FDF0E8' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, marginTop: 1,
        }}
      >
        {isDone && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
        {isOnIt && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#D4845A', display: 'block' }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 15, color: isDone ? '#B0A8A0' : '#2C2C2C', fontWeight: 500,
          textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.35,
        }}>
          {subtask.title}
        </span>
        {(isOnIt || isDone) && subtask.status_user_id && (
          <span style={{ fontSize: 12, color: isDone ? '#5A9E8A' : '#D4845A', fontWeight: 500 }}>
            {isDone ? `✓ Done by ${actorName}` : `💪 ${actorName} is on it`}
          </span>
        )}
      </div>

      {/* Assignee badge */}
      {subtask.assigned_to !== 'either' && (
        <span style={{
          background: '#F5EDE4', color: '#5C4A38', fontSize: 11, fontWeight: 600,
          padding: '2px 7px', borderRadius: 6, alignSelf: 'flex-start', marginTop: 2,
        }}>
          {ASSIGNED_LABEL[subtask.assigned_to]}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C0B5AC', padding: 0, lineHeight: 1, marginTop: 1 }}
      >
        ×
      </button>
    </div>
  );
}
