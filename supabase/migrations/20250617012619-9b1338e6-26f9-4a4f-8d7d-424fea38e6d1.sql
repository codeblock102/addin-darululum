
-- Update the profile to use the correct auth user ID
UPDATE public.profiles 
SET id = '4c4ff992-a3ca-4ee9-b3b8-54ac8a1a19a6'
WHERE email = 'adekunleabdulquayum7@gmail.com';

-- Ensure the user has admin role assignment
DO $$
DECLARE
  admin_role_id uuid;
  auth_user_id uuid := '4c4ff992-a3ca-4ee9-b3b8-54ac8a1a19a6';
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Create user role assignment with the correct auth user ID
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (auth_user_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;
