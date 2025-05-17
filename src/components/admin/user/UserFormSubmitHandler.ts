
import { UserFormData } from "@/types/adminUser";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Sign up a new user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            teacher_id: formData.teacherId,
            role: formData.role || 'teacher'
          },
          emailRedirectTo: window.location.origin + '/auth'
        }
      });
      
      if (error) {
        console.error("User creation error:", error);
        throw error;
      }
      
      // If user created successfully and has a teacher ID, create a user_role entry
      if (data.user && formData.teacherId) {
        // Find the appropriate role ID first
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'teacher')
          .single();
          
        if (roleError || !roleData) {
          console.warn("Could not find teacher role:", roleError);
        } else {
          // Create user_role association
          const { error: userRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role_id: roleData.id
            });
            
          if (userRoleError) {
            console.error("Error assigning role to user:", userRoleError);
          }
        }
      }
      
      console.log("User account created successfully:", data);
      onSuccess();
      return "User account created successfully. They can now log in using their email.";
    }
  } catch (error: any) {
    console.error("User creation error details:", error);
    onError(error.message);
    throw error;
  }
};
