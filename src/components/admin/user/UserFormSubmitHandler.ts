
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
      // Sign up a new user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            username: formData.username,
            teacher_id: formData.teacherId,
            role: 'teacher'
          }
        }
      });
      
      if (error) {
        console.error("User creation error:", error);
        throw error;
      }
      
      console.log("User account created successfully:", data);
      onSuccess();
      return "User account created successfully. They can now log in using their email or username.";
    }
  } catch (error: any) {
    console.error("User creation error details:", error);
    onError(error.message);
    throw error;
  }
};
