
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
      // Update existing user
      if (formData.password) {
        // Update password if provided
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          selectedUserId,
          { password: formData.password }
        );
        
        if (passwordError) throw passwordError;
      }
      
      // Update user metadata
      const { error: userError } = await supabase.auth.admin.updateUserById(
        selectedUserId,
        { 
          email: formData.email,
          user_metadata: { 
            username: formData.username,
            teacher_id: formData.teacherId
          }
        }
      );
      
      if (userError) throw userError;
      
      onSuccess();
      return "User updated successfully";
    } else {
      // Create new user
      const { error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { 
          username: formData.username,
          teacher_id: formData.teacherId
        }
      });
      
      if (error) throw error;
      
      onSuccess();
      return "User created successfully";
    }
  } catch (error: any) {
    onError(error.message);
    throw error;
  }
};
