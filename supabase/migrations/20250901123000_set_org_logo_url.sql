-- Set a public absolute URL for the organization logo used in emails
-- This value is read by edge functions (as a configurable option)

INSERT INTO app_settings (key, value, description)
VALUES (
  'org_logo_url',
  'https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png',
  'Public URL for email logo displayed in notifications'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();


