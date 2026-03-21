import { useNavigate } from 'react-router-dom';
import TimelineBadge from './TimelineBadge';
import { PRESET_TAGS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import type { Card } from '@/types';

const ASSIGNED: Record<string, string> = { juli: 'Juli', gino: 'Gino', together: 'Together', either: '' };

// Full card background + text colors by tag
const TAG_CARD: Record<string, { bg: string; accent: string; text: string }> = {
  'House & Cleaning': { bg: '#EAE8FF', accent: '#7B68EE', text: '#4438B0' },
  'Groceries':        { bg: '#DFF8F0', accent: '#2BAE8E', text: '#1A7A65' },
  'Travel':           { bg: '#FFE8D6', accent: '#E8733A', text: '#B04D1A' },
  'Admin & Paperwork':{ bg: '#F0EAFF', accent: '#9B72CF', text: '#6A3DAA' },
  'Health':           { bg: '#FFE5F2', accent: '#E8709A', text: '#B04070' },
  'Social Plans':     { bg: '#DAF8F3', accent: '#3EC8B8', text: '#1A9080' },
};

const DEFAULT_CARD = { bg: '#F0EEFF', accent: '#7B68EE', text: '#4438B0' };

function tagEmoji(tag: string | null | undefined): string {
  if (!tag) return '';
  return PRESET_TAGS.find((t) => t.name === tag)?.emoji ?? '🏷️';
}

function getCardTheme(tag: string | null | undefined) {
  if (!tag) return DEFAULT_CARD;
  return TAG_CARD[tag] ?? DEFAULT_CARD;
}

export default function CardItem({ card }: { card: Card }) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const reactions = (card.reactions ?? []).slice(0, 3);
  const hasSubtasks = (card.subtask_count ?? 0) > 0;
  const allDone = hasSubtasks && card.subtask_done_count === card.subtask_count;
  const commentCount = card.comment_count ?? 0;

  const theme = getCardTheme(card.tag);

  return (
    <div
      className="card"
      onClick={() => navigate(`/card/${card.id}`)}
      style={{ background: theme.bg }}
    >
      {/* Top row: tag pill + timeline badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          {card.tag ? (
            <span style={{
              background: 'rgba(255,255,255,0.65)',
              color: theme.text,
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 50,
              whiteSpace: 'nowrap',
            }}>
              {tagEmoji(card.tag)} {card.tag}
            </span>
          ) : null}
          {card.priority === 'urgent' && (
            <span style={{
              background: '#F06565', color: '#fff',
              fontSize: 11, fontWeight: 700,
              padding: '3px 8px', borderRadius: 50,
            }}>
              Urgent
            </span>
          )}
          {card.priority === 'low' && (
            <span style={{
              background: 'rgba(255,255,255,0.55)', color: theme.text,
              fontSize: 11, fontWeight: 700,
              padding: '3px 8px', borderRadius: 50,
            }}>
              Low
            </span>
          )}
        </div>
        <TimelineBadge card={card} small />
      </div>

      {/* Title */}
      <p style={{
        fontSize: 17,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        color: '#1A1826',
        lineHeight: 1.35,
        margin: 0,
      }}>
        {card.title}
      </p>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap' }}>
          {card.assigned_to !== 'either' && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 50,
              background: 'rgba(255,255,255,0.65)',
              color: card.assigned_to === 'juli' ? '#C4406A'
                   : card.assigned_to === 'gino' ? '#1A8070'
                   : theme.text,
            }}>
              {card.assigned_to === 'juli' ? '🌸' : card.assigned_to === 'gino' ? '🌿' : '🤝'} {ASSIGNED[card.assigned_to]}
            </span>
          )}
          {card.status === 'on_it' && (
            <span style={{
              background: 'rgba(255,255,255,0.65)',
              color: theme.text,
              fontSize: 11, fontWeight: 700,
              padding: '3px 9px', borderRadius: 50,
            }}>
              💪 {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} is on it
            </span>
          )}
          {card.status === 'waiting' && (
            <span style={{
              background: 'rgba(255,255,255,0.65)',
              color: '#9B6A00',
              fontSize: 11, fontWeight: 700,
              padding: '3px 9px', borderRadius: 50,
            }}>
              ⏳ Waiting
            </span>
          )}
          {card.is_recurring && (
            <span style={{ fontSize: 13, opacity: 0.65 }}>🔁</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {commentCount > 0 && (
            <span style={{ fontSize: 12, color: theme.text, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 2 }}>
              💬 {commentCount}
            </span>
          )}
          {hasSubtasks && (
            <span style={{
              background: 'rgba(255,255,255,0.65)',
              color: allDone ? '#2BAE8E' : theme.text,
              fontSize: 11, fontWeight: 700,
              padding: '3px 9px', borderRadius: 50,
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
