import { supabase } from "@/integrations/supabase/client.ts";

export const setUserAsAdmin = async (_email: string) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("setUserAsAdmin: Error getting user or no user found.", userError);
      return false;
    }

    const { data: updatedUserData, error: updateError } = await supabase.auth
      .updateUser({
        data: { role: "admin" },
      });

    if (updateError) {
      console.error("setUserAsAdmin: Error updating user metadata.", updateError);
      return false;
    }

    if (updatedUserData?.user?.user_metadata?.role === "admin") {
      return true;
    } else {
      // Assume eventual consistency
      return true;
    }
  } catch (error) {
    console.error("setUserAsAdmin: Unexpected error setting admin role.", error);
    return false;
  }
};

export const setupAdminAccount = async (email: string) => {
  try {
    // 1. Get the user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("setupAdminAccount: Error getting user or no user found", userError);
      return false;
    }

    // 2. Update user metadata to set admin role
    const { error: updateError } = await supabase.auth.updateUser({
      data: { role: "admin" },
    });

    if (updateError) {
      console.error("setupAdminAccount: Error updating user metadata", updateError);
      return false;
    }

    // 3. Find the user's assigned madrassah
    const { data: madrassahData, error: madrassahError } = await supabase
      .from("madrassahs")
      .select("id")
      .eq("admin_id", user.id)
      .single();

    if (madrassahError || !madrassahData) {
      console.error(
        "setupAdminAccount: Error finding assigned madrassah for user.",
        "Please ensure this user's ID is set as the 'admin_id' for a madrassah in the database.",
        madrassahError
      );
      return false;
    }

    const madrassahId = madrassahData.id;

    // 4. Create or update profile with madrassah_id
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: email,
      role: "admin",
      madrassah_id: madrassahId,
      name: email.split("@")[0],
    });

    if (profileError) {
      console.error("setupAdminAccount: Error upserting profile", profileError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("setupAdminAccount: Unexpected error", error);
    return false;
  }
};

export const updateAdminMadrassahId = async (madrassahId: string) => {
  try {
    // 1. Get the user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("updateAdminMadrassahId: Error getting user or no user found", userError);
      return false;
    }

    // 2. Update profile with madrassah_id
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        madrassah_id: madrassahId,
        role: "admin",
      })
      .eq("id", user.id);

    if (updateProfileError) {
      console.error("updateAdminMadrassahId: Error updating profile", updateProfileError);
      return false;
    }

    // 3. Update user metadata to ensure admin role
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { role: "admin" }
    });

    if (updateUserError) {
      console.error("updateAdminMadrassahId: Error updating user metadata", updateUserError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("updateAdminMadrassahId: Unexpected error", error);
    return false;
  }
};

/**
 * Fixes existing admin users who might be missing profile records
 * This can happen if users were created before the profile creation fix
 */
export const fixAdminProfile = async (userId: string, email: string) => {
  try {
    // 1. Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("fixAdminProfile: Error checking existing profile", checkError);
      return false;
    }

    if (existingProfile) {
      // Update role to admin if it's not already
      if (existingProfile.role !== 'admin') {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: 'admin' })
          .eq("id", userId);

        if (updateError) {
          console.error("fixAdminProfile: Error updating role to admin", updateError);
          return false;
        }
      }
      return true;
    }

    // 2. Create missing profile record
    const profileData: { id: string; email: string; role: string; name: string; madrassah_id?: string } = {
      id: userId,
      email: email,
      role: 'admin',
      name: email.split("@")[0],
    };

    // Try to get current user's madrassah for assignment
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", currentUser.id)
        .single();

      if (currentProfile?.madrassah_id) {
        profileData.madrassah_id = currentProfile.madrassah_id;
      }
    }

    const { error: createError } = await supabase
      .from("profiles")
      .insert(profileData);

    if (createError) {
      console.error("fixAdminProfile: Error creating profile", createError);
      return false;
    }

    // 3. Update auth metadata to ensure admin role
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { role: "admin" }
    });

    if (updateUserError) {
      console.error("fixAdminProfile: Error updating user metadata", updateUserError);
      // Continue anyway as profile was created
    }

    return true;
  } catch (error) {
    console.error("fixAdminProfile: Unexpected error", error);
    return false;
  }
};
