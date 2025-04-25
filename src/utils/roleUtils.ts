
import { supabase } from "@/integrations/supabase/client";

export const hasPermission = async (requiredPermission: string): Promise<boolean> => {
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
