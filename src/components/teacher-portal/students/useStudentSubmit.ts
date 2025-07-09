import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { StudentFormData } from "./studentTypes.ts";
import { getErrorMessage } from "@/utils/stringUtils.ts";

interface UseStudentSubmitProps {
  teacherId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useStudentSubmit = ({
  teacherId,
  onSuccess,
  onError,
}: UseStudentSubmitProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (formData: StudentFormData) => {
    setIsProcessing(true);

    try {
      if (!formData.studentName.trim()) {
        throw new Error("Student name is required");
      }

      if (!formData.guardianName.trim()) {
        throw new Error("Guardian name is required");
      }

      if (!formData.guardianContact.trim()) {
        throw new Error("Guardian contact is required");
      }

      if (!formData.guardianEmail.trim()) {
        throw new Error("Guardian email is required");
      }

      if (!formData.emergencyContactName.trim()) {
        throw new Error("Emergency contact name is required");
      }

      if (!formData.emergencyContactPhone.trim()) {
        throw new Error("Emergency contact phone is required");
      }

      // First, get the teacher's profile to get madrassah_id and section
      const { data: teacherProfile, error: teacherError } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId)
        .single();

      if (teacherError) throw teacherError;

      if (!teacherProfile?.madrassah_id) {
        throw new Error("Teacher must be assigned to a madrassah to create students");
      }

      // Check if the student exists in students table
      const { data: existingStudent, error: lookupError } = await supabase
        .from("students")
        .select("id, name")
        .eq("name", formData.studentName)
        .maybeSingle();

      if (lookupError) throw lookupError;

      // Map the completed Juz to numbers
      const completedJuz = formData.completedJuz.map((juz) => Number(juz));

      // If student doesn't exist, create them
      if (!existingStudent) {
        // Create the student with all the form data
        const { error: createError } = await supabase
          .from("students")
          .insert({
            name: formData.studentName,
            enrollment_date: formData.enrollmentDate,
            date_of_birth: formData.dateOfBirth || null,
            guardian_name: formData.guardianName || null,
            guardian_contact: formData.guardianContact || null,
            guardian_email: formData.guardianEmail || null,
            status: formData.status,
            medical_condition: formData.medicalConditions || null,
            current_juz: formData.currentJuz === "_none_"
              ? null
              : Number(formData.currentJuz),
            completed_juz: completedJuz,
            madrassah_id: teacherProfile.madrassah_id,
            section: teacherProfile.section,
          });

        if (createError) throw createError;
      } else {
        // Update existing student with new information
        const { error: updateError } = await supabase
          .from("students")
          .update({
            date_of_birth: formData.dateOfBirth || null,
            guardian_name: formData.guardianName || null,
            guardian_contact: formData.guardianContact || null,
            guardian_email: formData.guardianEmail || null,
            status: formData.status,
            medical_condition: formData.medicalConditions || null,
            current_juz: formData.currentJuz === "_none_"
              ? null
              : Number(formData.currentJuz),
            completed_juz: completedJuz,
            madrassah_id: teacherProfile.madrassah_id,
            section: teacherProfile.section,
          })
          .eq("id", existingStudent.id);

        if (updateError) throw updateError;
      }

      // Now assign student to teacher
      const { error: assignmentError } = await supabase
        .from("students_teachers")
        .insert({
          teacher_id: teacherId,
          student_name: formData.studentName,
          active: true,
        });

      if (assignmentError) throw assignmentError;

      onSuccess?.();
    } catch (error: unknown) {
      console.error("Failed to add student:", error);
      const errorMessage = getErrorMessage(error, "Failed to add student");
      onError?.(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleSubmit,
    isProcessing,
  };
};
