import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { getCard, updateCard, deleteCard, addGroceryItem } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import TimelineBadge from '@/components/TimelineBadge';
import { CommentsSection } from '@/components/CommentsSection';
import { ReactionsSection } from '@/components/ReactionsSection';
import { SubtasksSection } from '@/components/SubtasksSection';
import { getSocket, EVENTS } from '@/lib/socket';
import { PRESET_TAGS } from '@/types';
import type { Card } from '@/types';

const PRIORITY_LABEL: Record<string, string> = { urgent: '🔴 Urgent', normal: '⚪ Normal', low: '🟢 Low' };
const ASSIGNED_LABEL: Record<string, string> = { either: 'Either of us', juli: 'Juli', gino: 'Gino', together: 'Together' };
const FREQ_LABEL: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };

function getTagDisplay(tag: string | null | undefined): string {
  if (!tag) return '';
  const preset = PRESET_TAGS.find((t) => t.name === tag);
  return preset ? `${preset.emoji} ${preset.name}` : `🏷️ ${tag}`;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingNote, setWaitingNote] = useState('');
  const [showWaitingInput, setShowWaitingInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSnoozeSheet, setShowSnoozeSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [groceryItem, setGroceryItem] = useState('');
  const [showGroceryAdd, setShowGroceryAdd] = useState(false);
  const [groceryAdding, setGroceryAdding] = useState(false);
  const [groceryConfirm, setGroceryConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCard = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getCard(id);
      setCard(data);
    } catch {
      navigate('/tasks', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCard();
    if (!id) return;
    const socket = getSocket();
    const onUpdate = (updated: Card) => { if (updated.id === id) setCard(updated); };
    const onDelete = ({ id: deletedId }: { id: string }) => { if (deletedId === id) navigate('/tasks', { replace: true }); };
    socket.on(EVENTS.CARD_UPDATED, onUpdate);
    socket.on(EVENTS.CARD_DELETED, onDelete);
    socket.on(EVENTS.COMMENT_ADDED, () => fetchCard());
    socket.on(EVENTS.REACTION_UPDATED, () => fetchCard());
    return () => {
      socket.off(EVENTS.CARD_UPDATED, onUpdate);
      socket.off(EVENTS.CARD_DELETED, onDelete);
      socket.off(EVENTS.COMMENT_ADDED, fetchCard);
      socket.off(EVENTS.REACTION_UPDATED, fetchCard);
    };
  }, [id, fetchCard]);

  const doUpdate = async (patch: object) => {
    if (!card || !id) return;
    setActionLoading(true);
    try {
      await updateCard(card.id, { ...patch, current_user_id: userId });
      await fetchCard();
    } catch {
      alert('Could not update task. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = () => {
    if (!card) return;
    const isOwner = card.status === 'on_it' && card.status_user_id === userId;
    doUpdate({ status: isOwner ? 'pending' : 'on_it' });
  };

  const handleDone = async () => {
    if (!card || !id) return;
    const total = card.subtask_count ?? 0;
    const done = card.subtask_done_count ?? 0;
    if (total > 0 && done < total) {
      showToast(`⚠️ Complete all steps first — ${done}/${total} done`);
      return;
    }
    setActionLoading(true);
    try {
      await updateCard(card.id, { status: 'done', current_user_id: userId });
      await fetchCard();
      showToast(card.is_recurring ? '✅ Done! A new recurring task was created 🔁' : '🎉 Done! Great work!');
    } catch {
      showToast('Could not update. Please try again.');
    } finally {
      setActionLoading(false);
    }
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

  const handleSnooze = () => setShowSnoozeSheet(true);

  const confirmSnooze = async () => {
    setShowSnoozeSheet(false);
    if (!card || !id) return;
    setActionLoading(true);
    try {
      await updateCard(card.id, { status: 'snoozed', current_user_id: userId });
      await fetchCard();
      showToast('😴 Snoozed for 7 days');
    } catch {
      showToast('Could not snooze. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => setShowDeleteSheet(true);

  const confirmDelete = async () => {
    if (!id) return;
    setShowDeleteSheet(false);
    try {
      await deleteCard(id);
      navigate('/tasks', { replace: true });
    } catch {
      showToast('Could not delete. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!card) return null;

  const isOnItByMe = card.status === 'on_it' && card.status_user_id === userId;
  const isOnItByOther = card.status === 'on_it' && card.status_user_id !== userId;
  const statusUserName = card.status_user_id === 'juli' ? 'Juli' : 'Gino';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Nav */}
      <div className="nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 17, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          ‹ Back
        </button>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate(`/card/${id}/edit`)} style={{ background: 'none', border: 'none', fontSize: 15, color: 'var(--blue)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Edit</button>
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', fontSize: 15, color: 'var(--red)', cursor: 'pointer', padding: 0, fontWeight: 600 }}>Delete</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 8px', flexWrap: 'wrap' }}>
          <TimelineBadge card={card} />
          {card.priority !== 'normal' && <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{PRIORITY_LABEL[card.priority]}</span>}
          {card.snooze_count > 0 && <span style={{ fontSize: 13, color: 'var(--light-muted)', fontWeight: 600 }}>Snoozed {card.snooze_count}×</span>}
        </div>

        <h1 style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', padding: '0 20px', margin: '0 0 12px', lineHeight: 1.3 }}>
          {card.title}
        </h1>

        {/* Status banners */}
        {card.status === 'on_it' && (
          <div style={{ margin: '0 20px 12px', background: 'var(--gino-light)', borderRadius: 16, padding: '12px 14px', borderLeft: `4px solid var(--gino)` }}>
            <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, margin: 0 }}>
              {statusUserName} is on it 💪 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>· {formatTimestamp(card.status_updated_at)}</span>
            </p>
          </div>
        )}
        {card.status === 'waiting' && (
          <div style={{ margin: '0 20px 12px', background: 'var(--yellow-light)', borderRadius: 16, padding: '12px 14px', borderLeft: '4px solid var(--yellow)' }}>
            <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, margin: 0 }}>⏳ Waiting on...{card.status_note ? ` "${card.status_note}"` : ''}</p>
          </div>
        )}
        {card.status === 'snoozed' && (
          <div style={{ margin: '0 20px 12px', background: 'var(--accent-light)', borderRadius: 16, padding: '12px 14px', borderLeft: '4px solid var(--accent)' }}>
            <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, margin: 0 }}>
              😴 Snoozed until {card.snoozed_until ?? 'next week'}
              {card.original_timeline ? ` (was: ${card.original_timeline.replace('_', ' ')})` : ''}
            </p>
          </div>
        )}

        {/* Fields */}
        <div style={{ margin: '0 20px 24px', background: 'var(--surface)', borderRadius: 20, border: '2px solid var(--border)', overflow: 'hidden' }}>
          {card.assigned_to !== 'either' && <FieldRow label="Who" value={`👤 ${ASSIGNED_LABEL[card.assigned_to]}`} />}
          {card.tag && <FieldRow label="Category" value={getTagDisplay(card.tag)} />}
          {card.is_recurring && card.recurring_frequency && <FieldRow label="Recurring" value={`🔁 ${FREQ_LABEL[card.recurring_frequency]}`} />}
          {card.notes && <FieldRow label="Notes" value={card.notes} />}
          <FieldRow label="Added by" value={card.created_by === 'juli' ? 'Juli' : 'Gino'} />
          <FieldRow label="Created" value={formatTimestamp(card.created_at)} last />
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 28px' }}>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>Actions</p>
          {showWaitingInput && (
            <input
              type="text"
              style={{ width: '100%', border: '2px solid var(--primary)', borderRadius: 14, padding: 12, fontSize: 16, color: 'var(--text)', background: 'var(--surface)', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}
              value={waitingNote}
              onChange={(e) => setWaitingNote(e.target.value)}
              placeholder="What are you waiting on?"
              autoFocus
            />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <ActionBtn label={isOnItByMe ? 'Unclaim' : isOnItByOther ? `${statusUserName} is on it` : "I'm on it"} emoji={isOnItByMe ? '↩️' : '💪'} onClick={handleClaim} disabled={actionLoading} highlight={isOnItByMe} />
            <ActionBtn label="Mark as Done" emoji="✅" onClick={handleDone} disabled={actionLoading || card.status === 'done'} primary />
            <ActionBtn label={showWaitingInput ? 'Confirm' : 'Waiting on...'} emoji="⏳" onClick={handleWaiting} disabled={actionLoading} highlight={card.status === 'waiting'} />
            <ActionBtn label="Snooze" emoji="😴" onClick={handleSnooze} disabled={actionLoading} />
          </div>
        </div>

        {/* Subtasks */}
        <div style={{ padding: '0 20px' }}>
          <SubtasksSection cardId={card.id} subtasks={card.subtasks ?? []} currentUserId={userId!} onUpdate={fetchCard} />
        </div>

        {/* Reactions */}
        <div style={{ padding: '0 20px' }}>
          <ReactionsSection cardId={card.id} reactions={card.reactions ?? []} currentUserId={userId!} onUpdate={fetchCard} />
        </div>

        {/* Comments */}
        <div style={{ padding: '0 20px' }}>
          <CommentsSection cardId={card.id} comments={card.comments ?? []} currentUserId={userId!} onUpdate={fetchCard} />
        </div>

        {/* Grocery shortcut */}
        {card.tag === 'Groceries' && (
          <div style={{ padding: '0 20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Add to grocery list</p>
              <button onClick={() => setShowGroceryAdd((v) => !v)} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                {showGroceryAdd ? 'Cancel' : '+ Add item'}
              </button>
            </div>
            {showGroceryAdd && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={groceryItem}
                  onChange={(e) => setGroceryItem(e.target.value)}
                  placeholder="Item name..."
                  autoFocus
                  style={{ flex: 1, border: '2px solid var(--border)', borderRadius: 14, padding: '10px 12px', fontSize: 16, color: 'var(--text)', background: 'var(--surface)', height: 44, boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <button
                  disabled={!groceryItem.trim() || groceryAdding}
                  onClick={async () => {
                    if (!groceryItem.trim()) return;
                    setGroceryAdding(true);
                    try {
                      await addGroceryItem({ name: groceryItem.trim(), added_by: userId });
                      setGroceryItem('');
                      setGroceryConfirm(true);
                      setTimeout(() => setGroceryConfirm(false), 2000);
                    } catch {
                      alert('Could not add to grocery list.');
                    } finally {
                      setGroceryAdding(false);
                    }
                  }}
                  style={{ background: 'var(--blue)', border: 'none', borderRadius: 50, padding: '0 16px', height: 44, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (!groceryItem.trim() || groceryAdding) ? 0.4 : 1, fontFamily: 'var(--font-display)', boxShadow: '0 3px 0px #4080B0' }}
                >
                  Add
                </button>
              </div>
            )}
            {groceryConfirm && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--green)', fontWeight: 700, margin: '8px 0 0' }}>✓ Added to grocery list!</p>}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Snooze confirmation sheet */}
      {showSnoozeSheet && (() => {
        const snoozeDate = new Date();
        snoozeDate.setDate(snoozeDate.getDate() + 7);
        const snoozeDateStr = snoozeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const snoozeCount = card?.snooze_count ?? 0;
        return (
          <div className="sheet-overlay" onClick={() => setShowSnoozeSheet(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Snooze this task?</p>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                {snoozeCount >= 2
                  ? 'This has been snoozed a few times — consider tackling it together or reassigning it.'
                  : `This task will be pushed to ${snoozeDateStr}.`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-primary" style={{ width: '100%' }} onClick={confirmSnooze}>
                  😴 Snooze to {snoozeDateStr}
                </button>
                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowSnoozeSheet(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation sheet */}
      {showDeleteSheet && (
        <div className="sheet-overlay" onClick={() => setShowDeleteSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Delete this task?</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px' }}>This can't be undone.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={confirmDelete}
                style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 50, padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 0px #B83030' }}
              >
                Delete
              </button>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowDeleteSheet(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          <span>{toast}</span>
          <button className="toast-action" onClick={() => setToast(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--border-soft)', gap: 12 }}>
      <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, flex: 2, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ActionBtn({ label, emoji, onClick, disabled, primary, highlight }: {
  label: string; emoji: string; onClick: () => void;
  disabled?: boolean; primary?: boolean; highlight?: boolean;
}) {
  const bgColor = primary ? 'var(--green)' : highlight ? 'var(--primary-light)' : 'var(--surface)';
  const borderColor = primary ? 'var(--green)' : highlight ? 'var(--primary)' : 'var(--border)';
  const shadowColor = primary ? '#34A06A' : highlight ? '#C45A30' : 'var(--border)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, minWidth: '45%',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 20, padding: 14, cursor: 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        boxShadow: `0 3px 0px ${shadowColor}`,
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      }}
    >
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: primary ? '#fff' : 'var(--text)', textAlign: 'center' }}>{label}</span>
    </button>
  );
}
