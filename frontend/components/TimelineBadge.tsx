import { View, Text, StyleSheet } from 'react-native';
import type { Card } from '@/types';

// Parse YYYY-MM-DD as a local date (avoids UTC midnight → previous day in negative-offset zones)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isOverdue(card: Card): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (card.timeline === 'custom' && card.custom_date) {
    return parseLocalDate(card.custom_date) < now;
  }
  if (card.timeline === 'today') {
    const created = new Date(card.created_at);
    created.setHours(0, 0, 0, 0);
    return created < now;
  }
  if (card.timeline === 'this_week') {
    const created = new Date(card.created_at);
    const weekEnd = new Date(created);
    weekEnd.setDate(created.getDate() + (6 - created.getDay()));
    weekEnd.setHours(0, 0, 0, 0);
    return weekEnd < now;
  }
  if (card.timeline === 'this_month') {
    const created = new Date(card.created_at);
    const monthEnd = new Date(created.getFullYear(), created.getMonth() + 1, 0);
    monthEnd.setHours(0, 0, 0, 0);
    return monthEnd < now;
  }
  return false;
}

interface Props {
  card: Card;
  small?: boolean;
}

export function TimelineBadge({ card, small }: Props) {
  const overdue = isOverdue(card);

  let label: string;
  let bg: string;

  if (overdue) {
    label = 'Overdue';
    bg = '#F06565';
  } else if (card.timeline === 'today') {
    label = 'Today';
    bg = '#F06565';
  } else if (card.timeline === 'this_week') {
    label = 'This week';
    bg = '#F5A064';
  } else if (card.timeline === 'this_month') {
    label = 'This month';
    bg = '#6BA8E8';
  } else if (card.timeline === 'custom' && card.custom_date) {
    const d = parseLocalDate(card.custom_date);
    const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    label = formatted === 'Invalid Date' ? 'No date' : formatted;
    bg = '#6BA8E8';
  } else {
    label = card.timeline === 'custom' ? 'No date' : (card.timeline ?? 'Pending');
    bg = '#9B96B0';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }, small && styles.small]}>
      <Text style={[styles.text, small && styles.smallText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 11,
  },
});
