import { supabase } from "@/integrations/supabase/client.ts";

export const promoteToAdmin = async (targetUserId: string) => {
  try {
    // 1. Get the currently logged-in admin's user object
    const { data: { user: currentAdmin }, error: adminError } = await supabase.auth.getUser();
    if (adminError || !currentAdmin) {
      throw new Error("Could not get current admin user. You may need to log in again.");
    }

    // 2. Verify the current user is actually an admin by checking their profile
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("madrassah_id, role")
      .eq("id", currentAdmin.id)
      .single();

    if (adminProfileError || adminProfile?.role !== 'admin' || !adminProfile.madrassah_id) {
      throw new Error("You are not authorized to perform this action. Only admins can promote users.");
    }
    
    const madrassahId = adminProfile.madrassah_id;

    // 3. Update the target user's auth metadata to set their role
    const { error: updateUserError } = await supabase.auth.admin.updateUserById(
      targetUserId,
      { user_metadata: { role: 'admin' } }
    );
    if (updateUserError) {
      throw new Error(`Failed to update target user's authentication role: ${updateUserError.message}`);
    }

    // 4. Upsert the target user's profile to set their role and madrassah
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: targetUserId,
        role: "admin",
        madrassah_id: madrassahId,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
        // If the profile update fails, we should ideally try to revert the auth metadata update.
        // For simplicity here, we'll just report the error.
      throw new Error(`Failed to update target user's profile: ${profileError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return { success: false, error: (error as Error).message };
  }
}; 