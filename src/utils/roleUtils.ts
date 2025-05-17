
import { supabase } from "@/integrations/supabase/client";

export type RolePermission = 
  | "view_reports" 
  | "export_reports" 
  | "manage_students" 
  | "manage_teachers" 
  | "manage_schedules" 
  | "manage_roles" 
  | "bulk_actions" 
  | "manage_classes";

/**
 * Check if the current user has a specific permission
 * 
 * Note: The backend function has been updated to use a fixed search path
 * for improved security.
 */
export const hasPermission = async (requiredPermission: RolePermission): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return false;

    // Call the Supabase RPC function to check permissions
    const { data, error } = await supabase.rpc('has_permission', {
      user_id: session.user.id,
      required_permission: requiredPermission
    });

    if (error) {
      console.error('Permission check error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking permission:', error);
    return false;
  }
};

/**
 * Get all permissions for the current user
 */
export const getUserPermissions = async (): Promise<RolePermission[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return [];

    // Using a query instead of RPC since the get_user_permissions RPC function doesn't exist yet
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission')
      .innerJoin('user_roles', 'role_permissions.role_id = user_roles.role_id')
      .eq('user_roles.user_id', session.user.id);

    if (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    // Extract the permissions from the joined data
    return data ? data.map(item => item.role_permissions.permission) : [];
  } catch (error) {
    console.error('Unexpected error fetching permissions:', error);
    return [];
  }
};
