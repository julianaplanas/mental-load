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
  const [groceryItem, setGroceryItem] = useState('');
  const [showGroceryAdd, setShowGroceryAdd] = useState(false);
  const [groceryAdding, setGroceryAdding] = useState(false);
  const [groceryConfirm, setGroceryConfirm] = useState(false);

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

  const handleDone = () => {
    const isRecurring = card?.is_recurring;
    const message = isRecurring
      ? `"${card?.title}" will be marked done and a new instance created. 🔁`
      : `Mark "${card?.title}" as done?`;
    if (!confirm(message)) return;
    doUpdate({ status: 'done' });
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
    const count = card?.snooze_count ?? 0;
    const message = count >= 2
      ? 'This has been snoozed a few times — want to tackle it together or reassign it?'
      : 'This task will be pushed forward by 7 days.';
    if (!confirm(message)) return;
    doUpdate({ status: 'snoozed' });
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this task? This cannot be undone.')) return;
    await deleteCard(id);
    navigate('/tasks', { replace: true });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EDE5DA', borderTopColor: '#D4845A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 17, color: '#D4845A', fontWeight: 500, cursor: 'pointer', padding: 0 }}>
          ‹ Back
        </button>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate(`/card/${id}/edit`)} style={{ background: 'none', border: 'none', fontSize: 15, color: '#5B9BD5', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Edit</button>
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', fontSize: 15, color: '#E85555', cursor: 'pointer', padding: 0 }}>Delete</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 8px', flexWrap: 'wrap' }}>
          <TimelineBadge card={card} />
          {card.priority !== 'normal' && <span style={{ fontSize: 13, color: '#8A7F77', fontWeight: 500 }}>{PRIORITY_LABEL[card.priority]}</span>}
          {card.snooze_count > 0 && <span style={{ fontSize: 13, color: '#B0A8A0', fontWeight: 500 }}>Snoozed {card.snooze_count}×</span>}
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2C2C2C', padding: '0 20px', margin: '0 0 12px', lineHeight: 1.3 }}>
          {card.title}
        </h1>

        {/* Status banners */}
        {card.status === 'on_it' && (
          <div style={{ margin: '0 20px 12px', background: '#E8F4F0', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 14, color: '#2C6E56', fontWeight: 500, margin: 0 }}>
              {statusUserName} is on it 💪 <span style={{ color: '#8A7F77', fontWeight: 400, fontSize: 13 }}>· {formatTimestamp(card.status_updated_at)}</span>
            </p>
          </div>
        )}
        {card.status === 'waiting' && (
          <div style={{ margin: '0 20px 12px', background: '#FFF3E0', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 14, color: '#2C6E56', fontWeight: 500, margin: 0 }}>⏳ Waiting on...{card.status_note ? ` "${card.status_note}"` : ''}</p>
          </div>
        )}
        {card.status === 'snoozed' && (
          <div style={{ margin: '0 20px 12px', background: '#F0F0F5', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 14, color: '#2C6E56', fontWeight: 500, margin: 0 }}>
              😴 Snoozed until {card.snoozed_until ?? 'next week'}
              {card.original_timeline ? ` (was: ${card.original_timeline.replace('_', ' ')})` : ''}
            </p>
          </div>
        )}

        {/* Fields */}
        <div style={{ margin: '0 20px 24px', background: '#fff', borderRadius: 16, border: '1px solid #EDE5DA', overflow: 'hidden' }}>
          {card.assigned_to !== 'either' && <FieldRow label="Who" value={`👤 ${ASSIGNED_LABEL[card.assigned_to]}`} />}
          {card.tag && <FieldRow label="Category" value={getTagDisplay(card.tag)} />}
          {card.is_recurring && card.recurring_frequency && <FieldRow label="Recurring" value={`🔁 ${FREQ_LABEL[card.recurring_frequency]}`} />}
          {card.notes && <FieldRow label="Notes" value={card.notes} />}
          <FieldRow label="Added by" value={card.created_by === 'juli' ? 'Juli' : 'Gino'} />
          <FieldRow label="Created" value={formatTimestamp(card.created_at)} last />
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 28px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>Actions</p>
          {showWaitingInput && (
            <input
              type="text"
              style={{ width: '100%', border: '1.5px solid #D4845A', borderRadius: 10, padding: 12, fontSize: 15, color: '#2C2C2C', background: '#fff', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}
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
              <p style={{ fontSize: 13, fontWeight: 700, color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Add to grocery list</p>
              <button onClick={() => setShowGroceryAdd((v) => !v)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#5B9BD5', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
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
                  style={{ flex: 1, border: '1.5px solid #EDE5DA', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#2C2C2C', background: '#fff', height: 42, boxSizing: 'border-box', fontFamily: 'inherit' }}
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
                  style={{ background: '#5B9BD5', border: 'none', borderRadius: 10, padding: '0 14px', height: 42, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (!groceryItem.trim() || groceryAdding) ? 0.4 : 1 }}
                >
                  Add
                </button>
              </div>
            )}
            {groceryConfirm && <p style={{ marginTop: 8, fontSize: 13, color: '#5A9E8A', fontWeight: 600, margin: '8px 0 0' }}>✓ Added to grocery list!</p>}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FieldRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 16px', borderBottom: last ? 'none' : '1px solid #F5EDE4', gap: 12 }}>
      <span style={{ fontSize: 14, color: '#8A7F77', fontWeight: 500, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#2C2C2C', fontWeight: 500, flex: 2, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ActionBtn({ label, emoji, onClick, disabled, primary, highlight }: {
  label: string; emoji: string; onClick: () => void;
  disabled?: boolean; primary?: boolean; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, minWidth: '45%', background: primary ? '#D4845A' : highlight ? '#FDF0E8' : '#fff',
        border: `1.5px solid ${primary ? '#D4845A' : highlight ? '#D4845A' : '#EDE5DA'}`,
        borderRadius: 14, padding: 14, cursor: 'pointer', opacity: disabled ? 0.4 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: primary ? '#fff' : '#2C2C2C', textAlign: 'center' }}>{label}</span>
    </button>
  );
}
