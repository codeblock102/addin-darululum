import React from 'react';
import { supabase } from "@/integrations/supabase/client.ts";

// Function to seed the students table with actual student data
export const seedStudentsTable = async () => {
  try {
    // Insert actual student data from the provided image
    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          name: "Maaz Ahmad",
          current_juz: 1,
          completed_juz: [],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Basim Faraz",
          current_juz: 3,
          completed_juz: [1, 2],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Bilal Amin",
          current_juz: 2,
          completed_juz: [1],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Hashim Nadeem",
          current_juz: 5,
          completed_juz: [1, 2, 3, 4],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Hamza Akhtar",
          current_juz: 4,
          completed_juz: [1, 2, 3],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Ibrahim Khaled",
          current_juz: 2,
          completed_juz: [1],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Nasir Mahmood",
          current_juz: 6,
          completed_juz: [1, 2, 3, 4, 5],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Rayhan Qasim",
          current_juz: 3,
          completed_juz: [1, 2],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Subhan Ali",
          current_juz: 4,
          completed_juz: [1, 2, 3],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        },
        {
          name: "Yusuf Waheed",
          current_juz: 1,
          completed_juz: [],
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        }
      ]);

    if (error) {
      console.error('Error seeding students table:', error);
      return false;
    }

    console.log('Successfully seeded students table:', data);
    return true;
  } catch (err) {
    console.error('Exception seeding students table:', err);
    return false;
  }
};

// Function to assign students to a teacher
export const assignStudentsToTeacher = async (teacherId: string) => {
  try {
    // First get all student IDs
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('id, name');

    if (fetchError) {
      console.error('Error fetching students:', fetchError);
      return false;
    }

    if (!students || students.length === 0) {
      console.error('No students found to assign to teacher');
      return false;
    }

    // Create associations between students and teacher
    const studentTeacherData = students.map(student => ({
      teacher_id: teacherId,
      student_name: student.name,
      student_id: student.id,
      active: true,
      assigned_date: new Date().toISOString().split('T')[0]
    }));

    const { error: assignError } = await supabase
      .from('students_teachers')
      .insert(studentTeacherData);

    if (assignError) {
      console.error('Error assigning students to teacher:', assignError);
      return false;
    }

    console.log('Successfully assigned students to teacher');
    return true;
  } catch (err) {
    console.error('Exception assigning students to teacher:', err);
    return false;
  }
};
