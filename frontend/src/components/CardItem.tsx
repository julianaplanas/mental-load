import { useNavigate } from 'react-router-dom';
import TimelineBadge from './TimelineBadge';
import { PRESET_TAGS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import type { Card } from '@/types';

const ASSIGNED: Record<string, string> = { juli: 'Juli', gino: 'Gino', together: 'Together', either: '' };

function tagEmoji(tag: string | null | undefined): string {
  if (!tag) return '';
  return PRESET_TAGS.find((t) => t.name === tag)?.emoji ?? '🏷️';
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
          {card.tag && (
            <span style={{
              background: '#F5EDE4', color: '#5C4A38', fontSize: 12, fontWeight: 600,
              padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap',
            }}>
              {tagEmoji(card.tag)} {card.tag}
            </span>
          )}
          {card.priority !== 'normal' && (
            <span style={{ fontSize: 12 }}>
              {card.priority === 'urgent' ? '🔴' : '🟢'}
            </span>
          )}
        </div>
        <TimelineBadge card={card} small />
      </div>

      {/* Title */}
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, margin: 0 }}>
        {card.title}
      </p>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {card.assigned_to !== 'either' && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              👤 {ASSIGNED[card.assigned_to]}
            </span>
          )}
          {card.status === 'on_it' && (
            <span style={{
              background: 'var(--teal-light)', color: 'var(--teal)', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 8,
            }}>
              {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} is on it 💪
            </span>
          )}
          {card.status === 'waiting' && (
            <span style={{
              background: '#FFF3E0', color: '#D4845A', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 8,
            }}>
              Waiting on...
            </span>
          )}
          {card.is_recurring && <span style={{ fontSize: 12 }}>🔁</span>}
          {hasMySubtask && (
            <span style={{
              background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 8,
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
              background: allDone ? 'var(--teal-light)' : '#F5EDE4',
              color: allDone ? 'var(--teal)' : 'var(--muted)',
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 8,
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
