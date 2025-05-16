import { supabase } from "@/integrations/supabase/client";

// Helper function to create a normalized username from a person's name
// We'll keep this function for internal use but won't use it for login anymore
export const createNormalizedUsername = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/[^a-z0-9.]/g, '') // Remove special characters
    .trim(); // Remove any leading/trailing spaces
};

export const createTeacherWithAccount = async (name: string, email: string, password: string) => {
  try {
    console.log(`Attempting to create account for ${name} with email ${email}`);
    
    // Check if teacher already exists with this email
    const { data: existingTeacher } = await supabase
      .from("teachers")
      .select("id, name, email")
      .eq("email", email)
      .single();
    
    let teacherId = existingTeacher?.id;
    let teacherData = existingTeacher;
    
    if (!existingTeacher) {
      // 1. Create teacher record in the teachers table
      const { data: newTeacherData, error: teacherError } = await supabase
        .from("teachers")
        .insert([{
          name: name,
          email: email,
          subject: "Islamic Studies",
          experience: "10+ years",
        }])
        .select();

      if (teacherError) {
        console.error("Teacher creation error:", teacherError);
        throw teacherError;
      }

      if (!newTeacherData || newTeacherData.length === 0) {
        throw new Error("Failed to create teacher profile");
      }
      
      teacherId = newTeacherData[0].id;
      teacherData = newTeacherData[0];
      console.log("Teacher record created:", teacherData);
    } else {
      console.log("Teacher already exists:", existingTeacher);
    }

    // Check if a user with this email exists first
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (existingUser && existingUser.user) {
      console.log("User account already exists:", existingUser);
      return {
        success: true,
        teacher: teacherData,
        user: existingUser,
        message: "Teacher account already exists. You can log in now."
      };
    }

    // Create user account with auto-confirmation
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        teacher_id: teacherId,
        role: 'teacher'
      }
    });

    if (userError) {
      // Fallback to regular signup if admin API fails
      const { data: regularUserData, error: regularUserError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            teacher_id: teacherId,
            role: 'teacher'
          }
        }
      });
      
      if (regularUserError) {
        console.error("User account creation error:", regularUserError);
        throw regularUserError;
      }
      
      console.log("User account created (needs confirmation):", regularUserData);
      
      return {
        success: true,
        teacher: teacherData,
        user: regularUserData,
        message: `Teacher account created. Please check email for confirmation or go to Supabase Console to confirm the email manually.`
      };
    }
    
    console.log("User account created with auto-confirmation:", userData);

    return {
      success: true,
      teacher: teacherData,
      user: userData,
      message: `Teacher account created successfully with auto-confirmation.`
    };
  } catch (error: any) {
    console.error("Teacher account creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create teacher account"
    };
  }
};

// Execute the account creation for Mufti Ammar
export const createMuftiAmmarAccount = async () => {
  const result = await createTeacherWithAccount(
    "Mufti Ammar Mulla", 
    "Ammarmulla21@gmail.com", 
    "Ammarmulla2021"
  );
  
  console.log("Account creation result:", result);
  return result;
};
