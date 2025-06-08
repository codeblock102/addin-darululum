import { UserFormData } from "@/types/adminUser.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export const handleUserSubmit = async (
  formData: UserFormData,
  selectedUserId: string | undefined,
  onSuccess: () => void,
  onError: (message: string) => void
) => {
  try {
    if (selectedUserId) {
      // Update existing user - we can only update email and metadata
      // (password updates require special handling)
      
      // Note: Regular authenticated users cannot update other users
      // This would typically require a Supabase Edge Function with service_role key
      // For now, just show an appropriate message
      onError("Updating existing users requires admin privileges. This feature is disabled.");
      return "Operation not permitted";
    } else {
      console.log("Creating new user with data:", formData);
      
      // Always set the role based on the selection, defaulting to 'teacher'
      const userRole = formData.role || 'teacher';
      
      // Sign up a new user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            teacher_id: formData.teacherId,
            role: userRole,
            username: formData.username
          },
          emailRedirectTo: globalThis.location.origin + '/auth'
        }
      });
      
      if (error) {
        console.error("User creation error:", error);
        throw error;
      }
      
      // When user created successfully, create a user_role entry
      if (data.user) {
        try {
          // Find the appropriate role ID
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', userRole)
            .single();
            
          if (roleError || !roleData) {
            console.warn("Could not find role:", roleError);
          } else {
            console.log(`Assigning ${userRole} role (${roleData.id}) to user ${data.user.id}`);
            
            // Use the create_user_role RPC function to assign role
            const { error: userRoleError } = await supabase.rpc(
              'create_user_role', 
              {
                p_user_id: data.user.id,
                p_role_id: roleData.id
              }
            );
              
            if (userRoleError) {
              console.error("Error assigning role to user:", userRoleError);
            }
          }
        } catch (roleError) {
          console.error("Error setting up user role:", roleError);
          // Continue anyway, as the user account has been created
        }
      }
      
      console.log("User account created successfully:", data);
      onSuccess();
      return `User account created successfully with role: ${userRole}. They can now log in using their email.`;
    }
  } catch (error) {
    console.error("User creation error details:", error);
    onError((error as Error).message);
    throw error;
  }
};
