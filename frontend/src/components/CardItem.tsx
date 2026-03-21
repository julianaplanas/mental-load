import { useNavigate } from 'react-router-dom';
import TimelineBadge from './TimelineBadge';
import { PRESET_TAGS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import type { Card } from '@/types';

const ASSIGNED: Record<string, string> = { juli: 'Juli', gino: 'Gino', together: 'Together', either: '' };

// Tag accent colors (left-border stripe)
const TAG_STRIPE: Record<string, string> = {
  'House & Cleaning': '#8B8FFF',
  'Groceries':        '#4DBFA0',
  'Travel':           '#FFB800',
  'Admin & Paperwork':'#A855F7',
  'Health':           '#FF6B8A',
  'Social Plans':     '#4D8FFF',
};

function tagEmoji(tag: string | null | undefined): string {
  if (!tag) return '';
  return PRESET_TAGS.find((t) => t.name === tag)?.emoji ?? '🏷️';
}

const pillStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 6,
  border: '1.5px solid #0F0F0F',
  background: '#F5F2EC',
  color: '#0F0F0F',
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
};

export default function CardItem({ card }: { card: Card }) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const reactions = (card.reactions ?? []).slice(0, 3);
  const hasSubtasks = (card.subtask_count ?? 0) > 0;
  const allDone = hasSubtasks && card.subtask_done_count === card.subtask_count;
  const commentCount = card.comment_count ?? 0;

  const stripe = (card.tag && TAG_STRIPE[card.tag]) ? TAG_STRIPE[card.tag] : '#C8FF00';

  return (
    <div
      className="card"
      onClick={() => navigate(`/card/${card.id}`)}
      style={{ paddingLeft: 0, overflow: 'hidden', flexDirection: 'row', gap: 0 }}
    >
      {/* Color stripe */}
      <div style={{ width: 6, background: stripe, borderRadius: '8px 0 0 8px', flexShrink: 0, alignSelf: 'stretch', marginRight: 14, marginLeft: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            {card.tag && (
              <span style={pillStyle}>
                {tagEmoji(card.tag)} {card.tag}
              </span>
            )}
            {card.priority === 'urgent' && (
              <span style={{ ...pillStyle, background: '#FF3D3D', color: '#fff', border: '1.5px solid #0F0F0F' }}>
                🔥 Urgent
              </span>
            )}
          </div>
          <TimelineBadge card={card} small />
        </div>

        {/* Title */}
        <p style={{
          fontSize: 16,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.3,
          margin: 0,
          letterSpacing: -0.2,
        }}>
          {card.title}
        </p>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap' }}>
            {card.assigned_to !== 'either' && (
              <span style={{
                ...pillStyle,
                background: card.assigned_to === 'juli' ? '#FFE5EE'
                  : card.assigned_to === 'gino' ? '#E5F8F4'
                  : '#F5F2EC',
              }}>
                {card.assigned_to === 'juli' ? '🌸' : card.assigned_to === 'gino' ? '🌿' : '🤝'} {ASSIGNED[card.assigned_to]}
              </span>
            )}
            {card.status === 'on_it' && (
              <span style={{ ...pillStyle, background: '#E5F8F4' }}>
                💪 {card.status_user_id === 'juli' ? 'Juli' : 'Gino'}
              </span>
            )}
            {card.status === 'waiting' && (
              <span style={{ ...pillStyle, background: '#FFF4D6' }}>
                ⏳ Waiting
              </span>
            )}
            {card.priority === 'low' && (
              <span style={{ ...pillStyle, background: '#E5F8F4' }}>
                Low
              </span>
            )}
            {card.is_recurring && <span style={{ fontSize: 13, opacity: 0.6 }}>🔁</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {commentCount > 0 && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>
                💬 {commentCount}
              </span>
            )}
            {hasSubtasks && (
              <span style={{
                ...pillStyle,
                background: allDone ? '#CCFAE5' : '#F5F2EC',
              }}>
                {card.subtask_done_count}/{card.subtask_count} ✓
              </span>
            )}
            {reactions.length > 0 && (
              <span style={{ fontSize: 13 }}>{reactions.map((r) => r.emoji).join('')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
