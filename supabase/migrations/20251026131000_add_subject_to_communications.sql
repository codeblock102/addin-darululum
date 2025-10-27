-- Add subject to communications and optional parent_message_id FK
ALTER TABLE public.communications
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS parent_message_id uuid;

-- Index on parent_message_id for threads
CREATE INDEX IF NOT EXISTS idx_communications_parent_message_id ON public.communications(parent_message_id);

