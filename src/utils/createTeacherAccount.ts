
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

    // 2. Generate username from name
    const username = createNormalizedUsername(name);
    
    // 3. Create user account
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          teacher_id: teacherId,
          role: 'teacher'
        }
      }
    });

    if (userError) {
      console.error("User account creation error:", userError);
      throw userError;
    }
    
    console.log("User account created:", userData);

    return {
      success: true,
      teacher: teacherData,
      user: userData,
      username: username,
      message: `Teacher account created successfully. Username: ${username}`
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
