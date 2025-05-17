
-- Fix the has_permission function by adding a fixed search path
CREATE OR REPLACE FUNCTION public.has_permission(user_id uuid, required_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = user_id
    AND rp.permission = required_permission
  );
END;
$function$;

-- Create helper function to get user's role ID (used by client)
CREATE OR REPLACE FUNCTION public.get_user_role_id(user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  role_id uuid;
BEGIN
  SELECT ur.role_id INTO role_id
  FROM public.user_roles ur
  WHERE ur.user_id = user_id
  LIMIT 1;
  
  RETURN role_id;
END;
$function$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Allow administrators to manage user roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles 
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));
