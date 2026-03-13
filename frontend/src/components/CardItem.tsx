import { useNavigate } from 'react-router-dom';
import TimelineBadge from './TimelineBadge';
import { PRESET_TAGS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import type { Card } from '@/types';

const ASSIGNED: Record<string, string> = { juli: 'Juli', gino: 'Gino', together: 'Together', either: '' };

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'House & Cleaning': { bg: '#FFF8E1', text: '#C49A20' },
  'Groceries':        { bg: '#E6F9F0', text: '#2E9B6E' },
  'Travel':           { bg: '#EBF3FB', text: '#4080C0' },
  'Admin & Paperwork':{ bg: '#F3EDFA', text: '#7E57C2' },
  'Health':           { bg: '#FFF0F4', text: '#D4577A' },
  'Social Plans':     { bg: '#FFF0EB', text: '#D46840' },
};

function tagEmoji(tag: string | null | undefined): string {
  if (!tag) return '';
  return PRESET_TAGS.find((t) => t.name === tag)?.emoji ?? '🏷️';
}

function getTagColors(tag: string): { bg: string; text: string } {
  return TAG_COLORS[tag] ?? { bg: 'var(--border-soft)', text: 'var(--text-soft)' };
}

export default function CardItem({ card }: { card: Card }) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const reactions = (card.reactions ?? []).slice(0, 3);
  const hasSubtasks = (card.subtask_count ?? 0) > 0;
  const allDone = hasSubtasks && card.subtask_done_count === card.subtask_count;

  const mySubtaskCount = userId === 'juli'
    ? (card.juli_subtask_count ?? 0)
    : (card.gino_subtask_count ?? 0);
  const hasMySubtask = mySubtaskCount > 0;

  const commentCount = card.comment_count ?? 0;

  return (
    <div className="card" onClick={() => navigate(`/card/${card.id}`)}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          {card.tag && (() => {
            const colors = getTagColors(card.tag);
            return (
              <span style={{
                background: colors.bg, color: colors.text, fontSize: 12, fontWeight: 700,
                padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap',
              }}>
                {tagEmoji(card.tag)} {card.tag}
              </span>
            );
          })()}
          {card.priority !== 'normal' && (
            <span style={{ fontSize: 12 }}>
              {card.priority === 'urgent' ? '🔴' : '🟢'}
            </span>
          )}
        </div>
        <TimelineBadge card={card} small />
      </div>

      {/* Title */}
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, margin: 0 }}>
        {card.title}
      </p>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {card.assigned_to !== 'either' && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50,
              background: card.assigned_to === 'juli' ? 'var(--juli-light)' : card.assigned_to === 'gino' ? 'var(--gino-light)' : 'var(--accent-light)',
              color: card.assigned_to === 'juli' ? 'var(--juli)' : card.assigned_to === 'gino' ? 'var(--gino)' : 'var(--accent)',
            }}>
              👤 {ASSIGNED[card.assigned_to]}
            </span>
          )}
          {card.status === 'on_it' && (
            <span style={{
              background: 'var(--gino-light)', color: 'var(--gino)', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 50,
            }}>
              {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} is on it 💪
            </span>
          )}
          {card.status === 'waiting' && (
            <span style={{
              background: 'var(--yellow-light)', color: '#B8930F', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 50,
            }}>
              Waiting on... ⏳
            </span>
          )}
          {card.is_recurring && <span style={{ fontSize: 12 }}>🔁</span>}
          {hasMySubtask && (
            <span style={{
              background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 50,
            }}>
              Your step
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {commentCount > 0 && (
            <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
              💬 {commentCount}
            </span>
          )}
          {hasSubtasks && (
            <span style={{
              background: allDone ? 'var(--green-light)' : 'var(--border-soft)',
              color: allDone ? 'var(--green)' : 'var(--muted)',
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50,
            }}>
              {card.subtask_done_count}/{card.subtask_count} ✓
            </span>
          )}
          {reactions.length > 0 && (
            <span style={{ fontSize: 14 }}>{reactions.map((r) => r.emoji).join('')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
