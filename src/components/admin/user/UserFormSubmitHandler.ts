import { UserFormData } from "@/types/adminUser.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export const handleUserSubmit = async (
  formData: UserFormData,
  selectedUserId: string | undefined,
  onSuccess: () => void,
  onError: (message: string) => void,
) => {
  try {
    if (selectedUserId) {
      // Update existing user - we can only update email and metadata
      // (password updates require special handling)

      // Note: Regular authenticated users cannot update other users
      // This would typically require a Supabase Edge Function with service_role key
      // For now, just show an appropriate message
      onError(
        "Updating existing users requires admin privileges. This feature is disabled.",
      );
      return "Operation not permitted";
    } else {
      console.log("Creating new user with data:", formData);

      // Always set the role based on the selection, defaulting to 'teacher'
      const userRole = formData.role || "teacher";

      // Sign up a new user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            teacher_id: formData.teacherId,
            role: userRole,
            username: formData.username,
          },
          emailRedirectTo: globalThis.location.origin + "/auth",
        },
      });

      if (error) {
        console.error("User creation error:", error);
        throw error;
      }

      // When user created successfully, create a user_role entry and profile record
      if (data.user) {
        try {
          // 1. Create profile record for the user
          const profileData: any = {
            id: data.user.id,
            email: formData.email,
            role: userRole,
            name: formData.username || formData.email.split("@")[0],
          };

          // For admin users, try to assign them to a madrassah if available
          if (userRole === "admin") {
            // Get current user's madrassah (if they're creating an admin)
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              const { data: currentProfile } = await supabase
                .from("profiles")
                .select("madrassah_id")
                .eq("id", currentUser.id)
                .single();
              
              if (currentProfile?.madrassah_id) {
                profileData.madrassah_id = currentProfile.madrassah_id;
                console.log(`Assigning admin to madrassah: ${currentProfile.madrassah_id}`);
              }
            }
          }

          const { error: profileError } = await supabase
            .from("profiles")
            .insert(profileData);

          if (profileError) {
            console.error("Error creating user profile:", profileError);
            // Continue anyway, but log the error
          } else {
            console.log(`Profile created for ${userRole} user:`, data.user.id);
          }

          // user_roles table removed — role is sourced from profiles.role and auth metadata only
        } catch (roleError) {
          console.error("Error setting up user role and profile:", roleError);
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
