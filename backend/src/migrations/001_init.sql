-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (pre-seeded: Juli and Gino only)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (id, name) VALUES
  ('juli', 'Juli'),
  ('gino', 'Gino')
ON CONFLICT (id) DO NOTHING;

-- Push tokens (one per user device)
CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(10) REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Custom tags (in addition to preloaded ones)
CREATE TABLE IF NOT EXISTS custom_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  emoji VARCHAR(10),
  created_by VARCHAR(10) REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards (tasks)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  timeline VARCHAR(20) NOT NULL CHECK (timeline IN ('today', 'this_week', 'this_month', 'custom')),
  custom_date DATE,
  assigned_to VARCHAR(20) DEFAULT 'either' CHECK (assigned_to IN ('either', 'juli', 'gino', 'together')),
  tag TEXT,
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'on_it', 'waiting', 'done', 'snoozed')),
  status_user_id VARCHAR(10) REFERENCES users(id),
  status_updated_at TIMESTAMPTZ,
  status_note TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  notes TEXT,
  snooze_count INTEGER DEFAULT 0,
  snoozed_until DATE,
  original_timeline VARCHAR(20),
  created_by VARCHAR(10) REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on cards
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cards_updated_at ON cards;
CREATE TRIGGER cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comments on cards
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id VARCHAR(10) REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emoji reactions (one per user per card)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id VARCHAR(10) REFERENCES users(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, user_id)
);

-- Grocery list items
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity TEXT,
  category VARCHAR(30) CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'frozen', 'drinks', 'other')),
  added_by VARCHAR(10) REFERENCES users(id),
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
