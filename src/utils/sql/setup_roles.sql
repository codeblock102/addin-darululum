-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_id, permission)
);

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Insert admin role if it doesn't exist
INSERT INTO public.roles (name)
VALUES ('admin')
ON CONFLICT (name) DO NOTHING;

-- Insert teacher role if it doesn't exist
INSERT INTO public.roles (name)
VALUES ('teacher')
ON CONFLICT (name) DO NOTHING;

-- Insert all permissions for admin role
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM public.roles r
CROSS JOIN (
  VALUES 
    ('view_reports'),
    ('export_reports'),
    ('manage_students'),
    ('manage_teachers'),
    ('manage_schedules'),
    ('manage_roles'),
    ('bulk_actions'),
    ('manage_classes')
) AS p(permission)
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Insert basic permissions for teacher role
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM public.roles r
CROSS JOIN (
  VALUES 
    ('view_reports'),
    ('manage_students'),
    ('manage_schedules'),
    ('manage_classes')
) AS p(permission)
WHERE r.name = 'teacher'
ON CONFLICT (role_id, permission) DO NOTHING; 