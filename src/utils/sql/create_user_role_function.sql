
-- Create a function to add a user_role record
-- This function can be executed as an RPC from the client
CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id uuid, p_role_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (p_user_id, p_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$function$;

-- Add policy to allow admins to create user roles
-- This requires the user_roles table to have RLS enabled
-- and the admins need to have appropriate policies

