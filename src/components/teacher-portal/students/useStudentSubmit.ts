import { useState } from "react";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import { StudentFormData } from "./studentTypes.ts";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";

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
      let studentId: string | null = existingStudent?.id ?? null;
      if (!existingStudent) {
        // Create the student with all the form data; retry without guardian2_* if schema is missing
        const submission: Record<string, unknown> = {
          name: formData.studentName,
          enrollment_date: formData.enrollmentDate,
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          grade: formData.grade || null,
          health_card: formData.healthCard || null,
          permanent_code: formData.permanentCode || null,
          street: formData.street || null,
          city: formData.city || null,
          province: formData.province || null,
          postal_code: formData.postalCode || null,
          guardian_name: formData.guardianName || null,
          guardian_contact: formData.guardianContact || null,
          guardian_email: formData.guardianEmail || null,
          secondary_guardian_name: formData.guardian2Name || null,
          secondary_guardian_phone: formData.guardian2Contact || null,
          secondary_guardian_whatsapp: formData.guardian2Email || null,
          status: formData.status,
          medical_condition: formData.medicalConditions || null,
          current_juz: formData.currentJuz === "_none_" ? null : Number(formData.currentJuz),
          completed_juz: completedJuz,
          madrassah_id: teacherProfile.madrassah_id,
          section: teacherProfile.section,
        };

        try {
          const { data: created, error: createError } = await supabase
            .from("students")
            .insert(submission)
            .select("id")
            .single();
          if (createError) throw createError;
          studentId = created?.id ?? null;
        } catch (err) {
          const msg = formatErrorMessage(err);
          if (/guardian2_/i.test(msg) || /secondary_guardian_/i.test(msg) || /column .* does not exist/i.test(msg)) {
            const { secondary_guardian_name: _gn, secondary_guardian_phone: _gp, secondary_guardian_whatsapp: _gw, ...cleaned } = submission;
            const { data: created2, error: retryError } = await supabase
              .from("students")
              .insert(cleaned)
              .select("id")
              .single();
            if (retryError) throw retryError;
            studentId = created2?.id ?? null;
          } else {
            throw err as Error;
          }
        }
      } else {
        // Update existing student with new information; retry without guardian2_* if needed
        const updateSubmission: Record<string, unknown> = {
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          grade: formData.grade || null,
          health_card: formData.healthCard || null,
          permanent_code: formData.permanentCode || null,
          street: formData.street || null,
          city: formData.city || null,
          province: formData.province || null,
          postal_code: formData.postalCode || null,
          guardian_name: formData.guardianName || null,
          guardian_contact: formData.guardianContact || null,
          guardian_email: formData.guardianEmail || null,
          secondary_guardian_name: formData.guardian2Name || null,
          secondary_guardian_phone: formData.guardian2Contact || null,
          secondary_guardian_whatsapp: formData.guardian2Email || null,
          status: formData.status,
          medical_condition: formData.medicalConditions || null,
          current_juz: formData.currentJuz === "_none_" ? null : Number(formData.currentJuz),
          completed_juz: completedJuz,
          madrassah_id: teacherProfile.madrassah_id,
          section: teacherProfile.section,
        };

        try {
          const { error: updateError } = await supabase
            .from("students")
            .update(updateSubmission)
            .eq("id", existingStudent.id);
          if (updateError) throw updateError;
          studentId = existingStudent.id;
        } catch (err) {
          const msg = formatErrorMessage(err);
          if (/guardian2_/i.test(msg) || /secondary_guardian_/i.test(msg) || /column .* does not exist/i.test(msg)) {
            const { secondary_guardian_name: _gn, secondary_guardian_phone: _gp, secondary_guardian_whatsapp: _gw, ...cleanedUpdate } = updateSubmission;
            const { error: retryUpdateError } = await supabase
              .from("students")
              .update(cleanedUpdate)
              .eq("id", existingStudent.id);
            if (retryUpdateError) throw retryUpdateError;
            studentId = existingStudent.id;
          } else {
            throw err as Error;
          }
        }
      }

      // Now assign student to teacher (non-blocking if this linkage fails)
      try {
        const { error: assignmentError } = await supabase
          .from("students_teachers")
          .insert({
            teacher_id: teacherId,
            student_name: formData.studentName,
            active: true,
          });
        if (assignmentError) {
          console.warn("Teacher-student assignment failed:", assignmentError);
        }
      } catch (assignErr) {
        console.warn("Teacher-student assignment threw:", assignErr);
      }

      // Create or link parent account if guardian email is provided
      try {
        const guardianEmail = (formData.guardianEmail || "").trim();
        if (guardianEmail && studentId) {
          // Try standard invoke first
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token || "";
          const { data, error } = await supabase.functions.invoke("create-parent", {
            body: {
              email: guardianEmail,
              name: formData.guardianName || guardianEmail,
              madrassah_id: teacherProfile.madrassah_id,
              student_ids: [studentId],
              phone: formData.guardianContact || null,
            },
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
              apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
          });
          let result = data;
          let err = error as unknown;
          // Fallback: direct fetch to functions URL if invoke fails silently in some environments
          if (!result && err) {
            const token = accessToken;
            const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-parent`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                email: guardianEmail,
                name: formData.guardianName || guardianEmail,
                madrassah_id: teacherProfile.madrassah_id,
                student_ids: [studentId],
                phone: formData.guardianContact || null,
              }),
            });
            result = resp.ok ? await resp.json() : null;
            err = resp.ok ? null : await resp.text();
          }
          console.log("create-parent result:", { data: result, error: err });
          if (result?.credentials) {
            console.log(
              `Parent credentials -> username: ${result.credentials.username}, password: ${result.credentials.password}`,
            );
          }
        }
      } catch (_e) {
        // Non-fatal: parent creation issues should not block student creation
      }

      onSuccess?.();
    } catch (error: unknown) {
      console.error("Failed to add student:", error);
      const errorMessage = formatErrorMessage(error) || "Failed to add student";
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
