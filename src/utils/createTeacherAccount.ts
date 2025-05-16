
import { supabase } from "@/integrations/supabase/client";

// Helper function to create a normalized username from a person's name
export const createNormalizedUsername = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/[^a-z0-9.]/g, '') // Remove special characters
    .trim(); // Remove any leading/trailing spaces
};

export const createTeacherWithAccount = async (name: string, email: string, password: string) => {
  try {
    // 1. Create teacher record in the teachers table
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .insert([{
        name: name,
        email: email,
        subject: "Islamic Studies",
        experience: "10+ years",
      }])
      .select();

    if (teacherError) {
      throw teacherError;
    }

    if (!teacherData || teacherData.length === 0) {
      throw new Error("Failed to create teacher profile");
    }

    // 2. Generate username from name
    const username = createNormalizedUsername(name);
    
    // 3. Create user account
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          teacher_id: teacherData[0].id,
          role: 'teacher'
        }
      }
    });

    if (userError) {
      throw userError;
    }

    return {
      success: true,
      teacher: teacherData[0],
      user: userData,
      username: username,
      message: `Teacher account created successfully. Username: ${username}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create teacher account"
    };
  }
};

// Execute the account creation for Mufti Ammar
export const createMuftiAmmarAccount = async () => {
  const result = await createTeacherWithAccount(
    "Mufti Ammar", 
    "Ammarmulla21@gmail.com", 
    "Ammarmulla2021"
  );
  
  console.log("Account creation result:", result);
  return result;
};
