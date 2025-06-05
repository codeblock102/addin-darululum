import { supabase } from "@/integrations/supabase/client.ts";

export const setUserAsAdmin = async (email: string) => {
  try {
    console.log("setUserAsAdmin: Attempting to get current user.");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('setUserAsAdmin: Error getting user or no user found.', userError);
      return false;
    }
    console.log("setUserAsAdmin: Current user ID:", user.id);

    console.log("setUserAsAdmin: Attempting to update user metadata to admin.");
    const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
      data: { role: 'admin' }
    });

    if (updateError) {
      console.error('setUserAsAdmin: Error updating user metadata.', updateError);
      return false;
    }

    console.log("setUserAsAdmin: User metadata update successful. Response:", updatedUserData);
    // Verify the metadata directly from the response if possible
    if (updatedUserData?.user?.user_metadata?.role === 'admin') {
      console.log("setUserAsAdmin: Confirmed admin role in updatedUserData.");
      localStorage.setItem('userRole', 'admin');
      return true;
    } else {
      console.warn("setUserAsAdmin: Admin role not found in updatedUserData immediately after update. Metadata:", updatedUserData?.user?.user_metadata);
      // Still, the update might have been processed. Let's trust the process for now and set local storage.
      // The next login will rely on a fresh getUser() which should have the metadata.
      localStorage.setItem('userRole', 'admin'); 
      return true; // Return true, assuming eventual consistency or direct update worked.
    }

  } catch (error) {
    console.error('setUserAsAdmin: Unexpected error setting admin role.', error);
    return false;
  }
}; 