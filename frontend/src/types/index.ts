export type UserId = 'juli' | 'gino';

export type Timeline = 'today' | 'this_week' | 'this_month' | 'custom';
export type AssignedTo = 'either' | 'juli' | 'gino' | 'together';
export type Priority = 'urgent' | 'normal' | 'low';
export type CardStatus = 'pending' | 'on_it' | 'waiting' | 'done' | 'snoozed';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type GroceryCategory = 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'drinks' | 'other';
export type SubtaskStatus = 'pending' | 'on_it' | 'done';

export interface Subtask {
  id: string;
  card_id: string;
  title: string;
  assigned_to: AssignedTo;
  status: SubtaskStatus;
  status_user_id?: string | null;
  status_updated_at?: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  title: string;
  timeline: Timeline;
  custom_date?: string | null;
  assigned_to: AssignedTo;
  tag?: string | null;
  priority: Priority;
  status: CardStatus;
  status_user_id?: UserId | null;
  status_updated_at?: string | null;
  status_note?: string | null;
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency | null;
  notes?: string | null;
  snooze_count: number;
  snoozed_until?: string | null;
  original_timeline?: string | null;
  created_by: UserId;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  reactions?: Reaction[];
  subtasks?: Subtask[];
  subtask_count?: number;
  subtask_done_count?: number;
  comment_count?: number;
  juli_subtask_count?: number;
  gino_subtask_count?: number;
}

export interface Comment {
  id: string;
  card_id: string;
  user_id: UserId;
  text: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  card_id: string;
  user_id: UserId;
  emoji: string;
  created_at: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string | null;
  category?: GroceryCategory | null;
  added_by: UserId;
  is_checked: boolean;
  created_at: string;
}

export const PRESET_TAGS = [
  { emoji: '🏠', name: 'House & Cleaning' },
  { emoji: '🛒', name: 'Groceries' },
  { emoji: '✈️', name: 'Travel' },
  { emoji: '📄', name: 'Admin & Paperwork' },
  { emoji: '🏥', name: 'Health' },
  { emoji: '🎉', name: 'Social Plans' },
] as const;

export const REACTION_EMOJIS = ['❤️', '😂', '👍', '👀', '✅', '🙏'] as const;
