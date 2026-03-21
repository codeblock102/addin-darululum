import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Teacher } from "@/types/teacher.ts";
import { TeacherFormValues } from "./teacherSchema.ts";

// Generate a random password
const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const isValidUUID = (id: string | undefined): id is string => {
  if (!id) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

interface UseTeacherSubmitOptions {
  selectedTeacher: Teacher | null;
  madrassahId?: string;
  onClose: () => void;
}

export const useTeacherSubmit = ({
  selectedTeacher,
  madrassahId,
  onClose,
}: UseTeacherSubmitOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: TeacherFormValues) => {
    try {
      setIsSubmitting(true);

      if (selectedTeacher) {
        // --- UPDATE EXISTING TEACHER IN 'profiles' table ---
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            subject: values.subject || "",
            bio: values.bio || null,
            section: values.section,
          })
          .eq("id", selectedTeacher.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Success",
          description: "Teacher profile updated successfully!",
        });
      } else {
        // --- CREATE NEW TEACHER (triggers will handle profile creation) ---

        // CRITICAL VALIDATION: Ensure we have a valid Madrassah UUID before proceeding.
        if (!isValidUUID(madrassahId)) {
          toast({
            title: "Cannot Create Teacher",
            description:
              "A valid Madrassah ID is required. Please ensure a madrassah is selected.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (!values.createAccount || !values.email) {
          toast({
            title: "Cannot Create Profile",
            description: "An email is required to create a user account.",
            variant: "destructive",
          });
          return;
        }

        const password = values.generatePassword
          ? generateRandomPassword()
          : values.password!;

        const { data: userData, error: userError } = await supabase.auth
          .signUp({
            email: values.email,
            password: password,
            options: {
              data: {
                // These keys must match the column names in your `profiles` table
                name: values.name,
                role: "teacher",
                phone: values.phone || null,
                subject: values.subject || "",
                bio: values.bio || null,
                section: values.section,
                madrassah_id: madrassahId,
              },
            },
          });

        if (userError) {
          throw userError;
        }

        if (!userData.user) {
          throw new Error("User creation did not return a user object.");
        }

        toast({
          title: "Success",
          description: values.generatePassword
            ? `Teacher and user account created! Temporary password: ${password}`
            : `Teacher and user account created!`,
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["teacher-profiles", madrassahId],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] });
      onClose();
    } catch (error: unknown) {
      const supabaseError = error as {
        message: string;
        status?: number;
        details?: string;
        hint?: string;
      };
      console.group("Supabase Error Details");
      console.error("Message:", supabaseError.message);
      if (supabaseError.status) console.error("Status:", supabaseError.status);
      if (supabaseError.details) {
        console.error("Details:", supabaseError.details);
      }
      if (supabaseError.hint) console.error("Hint:", supabaseError.hint);
      console.error("Full Error Object:", error);
      console.groupEnd();

      toast({
        title: "Error",
        description: supabaseError.message ||
          "An unexpected error occurred. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
};
