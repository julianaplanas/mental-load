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
          <span style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Steps
          </span>
          {subtasks.length > 0 && (
            <span style={{
              background: allDone ? 'var(--green)' : 'var(--primary)',
              color: 'var(--ink)',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              border: '1.5px solid var(--ink)',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}>
              {doneCount}/{subtasks.length} done
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setNewTitle(''); }}
          style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 700, background: showAdd ? 'var(--border-soft)' : 'var(--primary)', border: '1.5px solid var(--ink)', borderRadius: 6, padding: '4px 10px', boxShadow: '2px 2px 0 var(--ink)', textTransform: 'uppercase', letterSpacing: 0.3 }}
        >
          {showAdd ? 'Cancel' : '+ Add step'}
        </button>
      </div>

      {subtasks.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, textAlign: 'center', padding: '12px 0', margin: 0 }}>
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
              border: '2px solid var(--ink)', borderRadius: 8, padding: 12,
              fontSize: 15, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)',
              width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            placeholder="What needs to happen?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ASSIGNMENTS.map((a) => {
              const active = newAssigned === a.value;
              return (
                <button
                  key={a.value}
                  onClick={() => setNewAssigned(a.value)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12,
                    fontWeight: 700,
                    border: `2px solid ${active ? 'var(--ink)' : 'var(--border-soft)'}`,
                    background: active ? 'var(--primary)' : 'var(--surface)',
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    boxShadow: active ? '2px 2px 0 var(--ink)' : 'none',
                    transition: 'all 0.1s ease',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}
                >
                  {a.label}
                </button>
              );
            })}
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
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          border: `2px solid var(--ink)`,
          background: isDone ? 'var(--green)' : isOnIt ? 'var(--primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1, transition: 'all 0.1s ease',
          boxShadow: isDone ? '2px 2px 0 var(--ink)' : isOnIt ? '2px 2px 0 var(--ink)' : '1px 1px 0 var(--border-soft)',
        }}
      >
        {isDone && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1, animation: 'checkBounce 0.3s var(--ease-spring)' }}>✓</span>}
        {isOnIt && <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--ink)', display: 'block' }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          fontSize: 15, color: isDone ? 'var(--muted)' : 'var(--text)',
          fontWeight: 600,
          textDecoration: isDone ? 'line-through' : 'none',
          lineHeight: 1.35,
        }}>
          {subtask.title}
        </span>
        {(isOnIt || isDone) && subtask.status_user_id && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            {isDone ? `✓ Done by ${actorName}` : `💪 ${actorName} is on it`}
          </span>
        )}
      </div>

      {/* Assignee badge */}
      <button
        onClick={onAssigneeChange}
        style={{
          background: subtask.assigned_to === 'either' ? 'transparent' : 'var(--primary)',
          border: `2px solid ${subtask.assigned_to === 'either' ? 'var(--border-soft)' : 'var(--ink)'}`,
          color: subtask.assigned_to === 'either' ? 'var(--muted)' : 'var(--ink)',
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          alignSelf: 'flex-start', marginTop: 3, cursor: 'pointer',
          boxShadow: subtask.assigned_to === 'either' ? 'none' : '2px 2px 0 var(--ink)',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
        title="Tap to change assignee"
      >
        {subtask.assigned_to === 'either' ? '· · ·' : ASSIGNED_LABEL[subtask.assigned_to]}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{ fontSize: 20, color: 'var(--muted)', padding: 0, lineHeight: 1, marginTop: 2, fontWeight: 700 }}
      >
        ×
      </button>
    </div>
  );
}
