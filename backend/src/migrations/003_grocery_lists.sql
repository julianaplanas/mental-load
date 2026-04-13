-- Grocery lists
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji VARCHAR(10) DEFAULT '🛒',
  created_by VARCHAR(10) REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add list_id to grocery_items
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES grocery_lists(id) ON DELETE CASCADE;

-- Migrate any existing items to a default "Shopping" list
DO $$
DECLARE
  default_list_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM grocery_items WHERE list_id IS NULL) THEN
    INSERT INTO grocery_lists (name, emoji, created_by)
    VALUES ('Shopping', '🛒', 'gino')
    RETURNING id INTO default_list_id;
    UPDATE grocery_items SET list_id = default_list_id WHERE list_id IS NULL;
  END IF;
END $$;
