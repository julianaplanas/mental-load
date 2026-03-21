import type { Card } from '@/types';

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isOverdue(card: Card): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (card.timeline === 'custom' && card.custom_date) return parseLocalDate(card.custom_date) < today;
  if (card.timeline === 'today') { const c = new Date(card.created_at); c.setHours(0,0,0,0); return c < today; }
  if (card.timeline === 'this_week') {
    const c = new Date(card.created_at);
    const end = new Date(c); end.setDate(c.getDate() + (6 - c.getDay())); end.setHours(0,0,0,0);
    return end < today;
  }
  if (card.timeline === 'this_month') {
    const c = new Date(card.created_at);
    const end = new Date(c.getFullYear(), c.getMonth() + 1, 0); end.setHours(0,0,0,0);
    return end < today;
  }
  return false;
}

interface Props { card: Card; small?: boolean }

export default function TimelineBadge({ card, small }: Props) {
  const overdue = isOverdue(card);

  let label: string, bg: string, color: string, border: string;
  if (overdue) {
    label = 'Overdue'; bg = '#FF3D3D'; color = '#fff'; border = '#0F0F0F';
  } else if (card.timeline === 'today') {
    label = 'Today'; bg = '#C8FF00'; color = '#0F0F0F'; border = '#0F0F0F';
  } else if (card.timeline === 'this_week') {
    label = 'This week'; bg = '#FFB800'; color = '#0F0F0F'; border = '#0F0F0F';
  } else if (card.timeline === 'this_month') {
    label = 'This month'; bg = '#4D8FFF'; color = '#fff'; border = '#0F0F0F';
  } else if (card.timeline === 'custom' && card.custom_date) {
    const d = parseLocalDate(card.custom_date);
    label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    bg = '#0F0F0F'; color = '#fff'; border = '#0F0F0F';
  } else {
    label = card.timeline; bg = '#E0E0DE'; color = '#0F0F0F'; border = '#AAAAAA';
  }

  const shouldPulse = overdue || card.timeline === 'today';

  return (
    <span style={{
      backgroundColor: bg,
      color,
      fontSize: small ? 10 : 12,
      fontWeight: 700,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 6,
      border: `1.5px solid ${border}`,
      whiteSpace: 'nowrap',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      animation: shouldPulse ? 'pulse 2s ease-in-out infinite' : undefined,
      boxShadow: small ? 'none' : `2px 2px 0px ${border}`,
    }}>
      {label}
    </span>
  );
}
