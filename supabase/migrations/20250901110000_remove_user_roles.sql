-- Remove user_roles table and related database objects
-- Safely drop dependent functions and policies if they exist

-- Drop functions that depend on user_roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_permission'
  ) THEN
    DROP FUNCTION IF EXISTS public.has_permission(user_id uuid, required_permission text);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_user_role_id'
  ) THEN
    DROP FUNCTION IF EXISTS public.get_user_role_id(user_id uuid);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_user_role'
  ) THEN
    DROP FUNCTION IF EXISTS public.create_user_role(p_user_id uuid, p_role_id uuid);
  END IF;
END $$;

-- Drop policies on user_roles (CASCADE on table drop will remove them, but do it explicitly if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_roles'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
  END IF;
END $$;

-- Finally drop the table
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Note: Application now relies on profiles.role and auth metadata for RBAC.

