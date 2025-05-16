
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentFormData } from "./studentTypes";

interface UseStudentSubmitProps {
  teacherId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useStudentSubmit = ({ 
  teacherId, 
  onSuccess, 
  onError 
}: UseStudentSubmitProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (formData: StudentFormData) => {
    setIsProcessing(true);
    
    try {
      if (!formData.studentName.trim()) {
        throw new Error("Student name is required");
      }
      
      // First, check if the student exists in students table
      const { data: existingStudent, error: lookupError } = await supabase
        .from('students')
        .select('id, name')
        .eq('name', formData.studentName)
        .maybeSingle();
        
      let studentId;
      
      if (lookupError) throw lookupError;
      
      // Map the completed Juz to numbers
      const completedJuz = formData.completedJuz.map(juz => Number(juz));
      
      // If student doesn't exist, create them
      if (!existingStudent) {
        // Create the student with all the form data
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({ 
            name: formData.studentName,
            enrollment_date: formData.enrollmentDate,
            date_of_birth: formData.dateOfBirth || null,
            guardian_name: formData.guardianName || null,
            guardian_contact: formData.guardianContact || null,
            status: formData.status,
            current_juz: formData.currentJuz === "_none_" ? null : Number(formData.currentJuz),
            completed_juz: completedJuz
          })
          .select('id')
          .single();
          
        if (createError) throw createError;
        studentId = newStudent.id;
      } else {
        // Update existing student with new information
        const { error: updateError } = await supabase
          .from('students')
          .update({
            date_of_birth: formData.dateOfBirth || null,
            guardian_name: formData.guardianName || null,
            guardian_contact: formData.guardianContact || null,
            status: formData.status,
            current_juz: formData.currentJuz === "_none_" ? null : Number(formData.currentJuz),
            completed_juz: completedJuz
          })
          .eq('id', existingStudent.id);
          
        if (updateError) throw updateError;
        studentId = existingStudent.id;
      }
      
      // Now assign student to teacher
      const { error: assignmentError } = await supabase
        .from('students_teachers')
        .insert({
          teacher_id: teacherId,
          student_name: formData.studentName,
          active: true
        });
        
      if (assignmentError) throw assignmentError;
      
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to add student:", error);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleSubmit,
    isProcessing
  };
};
