
import { supabase } from "@/integrations/supabase/client";

type RolePermission = 
  | "view_reports" 
  | "export_reports" 
  | "manage_students" 
  | "manage_teachers" 
  | "manage_schedules" 
  | "manage_roles" 
  | "bulk_actions" 
  | "manage_classes";

export const hasPermission = async (requiredPermission: RolePermission): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return false;

    const { data, error } = await supabase.rpc('has_permission', {
      user_id: session.user.id,
      required_permission: requiredPermission
    });

    if (error) {
      console.error('Permission check error:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error checking permission:', error);
    return false;
  }
};
