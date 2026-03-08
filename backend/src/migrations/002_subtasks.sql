-- Subtasks table: checklist items within a card
CREATE TABLE IF NOT EXISTS subtasks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id           UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  assigned_to       VARCHAR(10) NOT NULL DEFAULT 'either',
  status            VARCHAR(10) NOT NULL DEFAULT 'pending', -- pending | on_it | done
  status_user_id    VARCHAR(10),
  status_updated_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subtasks_card_id_idx ON subtasks(card_id);
