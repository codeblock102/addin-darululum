-- Create communications table for in-app messaging between users

CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  message_type text,
  category text,
  parent_message_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_communications_recipient_id ON public.communications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_communications_sender_id ON public.communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON public.communications(created_at DESC);

-- Enable RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Read: sender or recipient can read
DROP POLICY IF EXISTS communications_read_policy ON public.communications;
CREATE POLICY communications_read_policy
  ON public.communications
  FOR SELECT
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

-- Insert: only allow a user to send from their own id
DROP POLICY IF EXISTS communications_insert_policy ON public.communications;
CREATE POLICY communications_insert_policy
  ON public.communications
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Update: recipient can mark as read; sender cannot change after sending
DROP POLICY IF EXISTS communications_update_policy ON public.communications;
CREATE POLICY communications_update_policy
  ON public.communications
  FOR UPDATE
  USING (
    recipient_id = auth.uid()
  )
  WITH CHECK (
    recipient_id = auth.uid()
  );

-- Optional: simple trigger function to update updated_at on change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS set_communications_updated_at ON public.communications;
CREATE TRIGGER set_communications_updated_at
BEFORE UPDATE ON public.communications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


