-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policies that allow initial setup
CREATE POLICY "Allow initial role setup" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow if no roles exist yet (initial setup)
    NOT EXISTS (SELECT 1 FROM public.user_roles)
    OR
    -- Or if user is already an admin
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Add policy to allow authenticated users to read roles table
CREATE POLICY "Allow authenticated users to read roles" ON public.roles
  FOR SELECT TO authenticated
  USING (true); 