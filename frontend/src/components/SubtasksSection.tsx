import { useState } from 'react';
import { addSubtask, updateSubtask, deleteSubtask } from '@/lib/api';
import type { Subtask, AssignedTo } from '@/types';

const ASSIGNED_LABEL: Record<string, string> = {
  either: 'Either', juli: 'Juli', gino: 'Gino', together: 'Both',
};

const ASSIGN_CYCLE: AssignedTo[] = ['either', 'juli', 'gino', 'together'];

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
    } catch { /* silently ignore */ }
  };

  const handleAssigneeChange = async (subtask: Subtask) => {
    const currentIdx = ASSIGN_CYCLE.indexOf(subtask.assigned_to);
    const next = ASSIGN_CYCLE[(currentIdx + 1) % ASSIGN_CYCLE.length];
    try {
      await updateSubtask(cardId, subtask.id, { assigned_to: next });
      onUpdate();
    } catch { /* silently ignore */ }
  };

  const handleDelete = async (subtask: Subtask) => {
    if (!confirm(`Remove "${subtask.title}"?`)) return;
    try {
      await deleteSubtask(cardId, subtask.id);
      onUpdate();
    } catch { /* silently ignore */ }
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
    } catch { /* silently ignore */ } finally {
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
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Steps
          </span>
          {subtasks.length > 0 && (
            <span style={{
              background: allDone ? 'var(--teal-light)' : '#F5EDE4',
              color: allDone ? 'var(--teal)' : 'var(--muted)',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            }}>
              {doneCount}/{subtasks.length} done
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setNewTitle(''); }}
          style={{ fontSize: 14, color: 'var(--blue)', fontWeight: 600 }}
        >
          {showAdd ? 'Cancel' : '+ Add step'}
        </button>
      </div>

      {subtasks.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: 'var(--light-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0', margin: 0 }}>
          Break this task into steps — tap "Add step" to get started
        </p>
      )}

      {subtasks.map((subtask) => (
        <SubtaskRow
          key={subtask.id}
          subtask={subtask}
          onStatusTap={() => handleStatusTap(subtask)}
          onAssigneeChange={() => handleAssigneeChange(subtask)}
          onDelete={() => handleDelete(subtask)}
        />
      ))}

      {showAdd && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            style={{
              border: '1.5px solid var(--orange)', borderRadius: 12, padding: 12,
              fontSize: 16, color: 'var(--text)', background: 'var(--surface)',
              width: '100%', boxSizing: 'border-box',
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
                  padding: '6px 12px', borderRadius: 8, fontSize: 13,
                  fontWeight: newAssigned === a.value ? 600 : 500,
                  border: `1.5px solid ${newAssigned === a.value ? 'var(--orange)' : 'var(--border)'}`,
                  background: newAssigned === a.value ? 'var(--orange-light)' : 'var(--surface)',
                  color: newAssigned === a.value ? 'var(--orange)' : 'var(--muted)',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || adding}
            className="btn-primary"
            style={{ opacity: (!newTitle.trim() || adding) ? 0.4 : 1 }}
          >
            {adding ? 'Adding...' : 'Add step'}
          </button>
        </div>
      )}
    </div>
  );
}

function SubtaskRow({ subtask, onStatusTap, onAssigneeChange, onDelete }: {
  subtask: Subtask;
  onStatusTap: () => void;
  onAssigneeChange: () => void;
  onDelete: () => void;
}) {
  const isDone = subtask.status === 'done';
  const isOnIt = subtask.status === 'on_it';
  const actorName = subtask.status_user_id === 'juli' ? 'Juli' : 'Gino';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      padding: '11px 0', borderBottom: '1px solid var(--border-soft)', gap: 10,
    }}>
      {/* Status circle */}
      <button
        onClick={onStatusTap}
        style={{
          width: 24, height: 24, borderRadius: 12, flexShrink: 0,
          border: `2px solid ${isDone ? 'var(--teal)' : isOnIt ? 'var(--orange)' : 'var(--light-muted)'}`,
          background: isDone ? 'var(--teal)' : isOnIt ? 'var(--orange-light)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1, transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        {isDone && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
        {isOnIt && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--orange)', display: 'block' }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          fontSize: 15, color: isDone ? 'var(--light-muted)' : 'var(--text)',
          fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.35,
        }}>
          {subtask.title}
        </span>
        {(isOnIt || isDone) && subtask.status_user_id && (
          <span style={{ fontSize: 12, color: isDone ? 'var(--teal)' : 'var(--orange)', fontWeight: 500 }}>
            {isDone ? `✓ Done by ${actorName}` : `💪 ${actorName} is on it`}
          </span>
        )}
      </div>

      {/* Assignee badge — tap to cycle */}
      <button
        onClick={onAssigneeChange}
        style={{
          background: subtask.assigned_to === 'either' ? 'transparent' : 'var(--orange-light)',
          border: `1.5px solid ${subtask.assigned_to === 'either' ? 'var(--border)' : 'var(--orange-soft)'}`,
          color: subtask.assigned_to === 'either' ? 'var(--light-muted)' : 'var(--orange)',
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 8,
          alignSelf: 'flex-start', marginTop: 3, cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        title="Tap to change assignee"
      >
        {subtask.assigned_to === 'either' ? '· · ·' : ASSIGNED_LABEL[subtask.assigned_to]}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{ fontSize: 20, color: 'var(--light-muted)', padding: 0, lineHeight: 1, marginTop: 2 }}
      >
        ×
      </button>
    </div>
  );
}
