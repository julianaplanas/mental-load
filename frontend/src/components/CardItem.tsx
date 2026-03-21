import { useNavigate } from 'react-router-dom';
import TimelineBadge from './TimelineBadge';
import { PRESET_TAGS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import type { Card } from '@/types';

const ASSIGNED: Record<string, string> = { juli: 'Juli', gino: 'Gino', together: 'Together', either: '' };

// Soft pastel card themes per tag
const TAG_THEME: Record<string, { bg: string; pill: string; pillText: string }> = {
  'House & Cleaning': { bg: '#EEF0FF', pill: 'rgba(139,143,212,0.15)', pillText: '#6066B8' },
  'Groceries':        { bg: '#EBF7F0', pill: 'rgba(130,176,154,0.18)', pillText: '#3E8A68' },
  'Travel':           { bg: '#FFF3EC', pill: 'rgba(200,168,85,0.18)',  pillText: '#9A6A20' },
  'Admin & Paperwork':{ bg: '#F3EEFF', pill: 'rgba(163,130,200,0.18)', pillText: '#7048B8' },
  'Health':           { bg: '#FFEEF4', pill: 'rgba(212,132,154,0.18)', pillText: '#B04870' },
  'Social Plans':     { bg: '#EAF5FF', pill: 'rgba(123,170,200,0.18)', pillText: '#3878A8' },
};
const DEFAULT_THEME = { bg: '#F5F3FF', pill: 'rgba(139,143,212,0.15)', pillText: '#6066B8' };

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
  const commentCount = card.comment_count ?? 0;

  const theme = (card.tag && TAG_THEME[card.tag]) ? TAG_THEME[card.tag] : DEFAULT_THEME;

  const pillStyle = {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 50,
    background: theme.pill,
    color: theme.pillText,
    whiteSpace: 'nowrap' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  };

  return (
    <div
      className="card"
      onClick={() => navigate(`/card/${card.id}`)}
      style={{ background: theme.bg }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {card.tag && (
            <span style={pillStyle}>
              {tagEmoji(card.tag)} {card.tag}
            </span>
          )}
          {card.priority === 'urgent' && (
            <span style={{ ...pillStyle, background: 'rgba(224,112,112,0.15)', color: '#C04040' }}>
              Urgent
            </span>
          )}
        </div>
        <TimelineBadge card={card} small />
      </div>

      {/* Title — editorial weight */}
      <p style={{
        fontSize: 17,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1.35,
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
              background: card.assigned_to === 'juli'
                ? 'rgba(212,132,154,0.15)'
                : card.assigned_to === 'gino'
                ? 'rgba(130,176,154,0.18)'
                : 'rgba(139,143,212,0.15)',
              color: card.assigned_to === 'juli' ? '#A03060'
                   : card.assigned_to === 'gino' ? '#306850'
                   : '#5060A0',
            }}>
              {card.assigned_to === 'juli' ? '🌸' : card.assigned_to === 'gino' ? '🌿' : '🤝'} {ASSIGNED[card.assigned_to]}
            </span>
          )}
          {card.status === 'on_it' && (
            <span style={{ ...pillStyle, background: 'rgba(130,176,154,0.18)', color: '#306850' }}>
              💪 {card.status_user_id === 'juli' ? 'Juli' : 'Gino'}
            </span>
          )}
          {card.status === 'waiting' && (
            <span style={{ ...pillStyle, background: 'rgba(200,168,85,0.18)', color: '#7A5A10' }}>
              ⏳ Waiting
            </span>
          )}
          {card.priority === 'low' && (
            <span style={{ ...pillStyle, background: 'rgba(130,176,154,0.12)', color: '#508060' }}>
              Low
            </span>
          )}
          {card.is_recurring && <span style={{ fontSize: 13, opacity: 0.5 }}>🔁</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {commentCount > 0 && (
            <span style={{ fontSize: 12, color: theme.pillText, opacity: 0.7 }}>
              💬 {commentCount}
            </span>
          )}
          {hasSubtasks && (
            <span style={{
              ...pillStyle,
              background: allDone ? 'rgba(107,175,138,0.2)' : theme.pill,
              color: allDone ? '#2E7A50' : theme.pillText,
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
