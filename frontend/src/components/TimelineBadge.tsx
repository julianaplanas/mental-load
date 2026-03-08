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

  let label: string, bg: string;
  if (overdue)                           { label = 'Overdue';    bg = '#E85555'; }
  else if (card.timeline === 'today')    { label = 'Today';      bg = '#E85555'; }
  else if (card.timeline === 'this_week'){ label = 'This week';  bg = '#F4945A'; }
  else if (card.timeline === 'this_month'){ label = 'This month'; bg = '#5B9BD5'; }
  else if (card.timeline === 'custom' && card.custom_date) {
    const d = parseLocalDate(card.custom_date);
    label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    bg = '#5B9BD5';
  } else { label = card.timeline; bg = '#8A7F77'; }

  return (
    <span style={{
      backgroundColor: bg,
      color: '#fff',
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      padding: small ? '2px 6px' : '3px 8px',
      borderRadius: small ? 4 : 6,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
