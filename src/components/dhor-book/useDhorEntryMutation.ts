import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { endOfWeek, format, startOfWeek } from "date-fns";
import type { Database } from "@/types/supabase.ts";

interface UseDhorEntryMutationProps {
  studentId: string;
  teacherId: string;
  onSuccess?: (data?: unknown) => void;
}

// Define more specific types for form data parts to help with type safety
// These reflect what the form might send.
interface FormSabaqData {
  current_juz?: number;
  current_surah?: number;
  start_ayat?: number;
  end_ayat?: number;
  memorization_quality?: Database["public"]["Enums"]["quality_rating"];
}

interface FormSabaqParaData {
  sabaq_para_juz?: number;
  sabaq_para_pages?: number; // Form field, potentially for future use or mapping
  sabaq_para_memorization_quality?:
    Database["public"]["Enums"]["quality_rating"];
  quarters_revised?: Database["public"]["Enums"]["quarter_revised"]; // Expected by sabaq_para table
}

// Combined form data type that the mutation function will receive
export type DhorBookCombinedFormData = FormSabaqData & FormSabaqParaData & {
  entry_date: string;
  comments?: string;
  points?: number;
  detention?: boolean;
  pages_memorized?: number;

  // Single Dhor fields from Zod schema (replaces dhor1_... and dhor2_...)
  dhor_juz?: number;
  dhor_memorization_quality?: Database["public"]["Enums"]["quality_rating"];
  dhor_quarter_start?: number;
  dhor_quarters_covered?: number;

  // Legacy fields that were previously related to dhor_book_entries,
  // kept for logging if needed, but can be cleaned up if logging is not required for them.
  day_of_week?: string;
  sabak_para?: string;
  dhor_1?: string;
  dhor_1_mistakes?: number;
  dhor_2?: string;
  dhor_2_mistakes?: number;
};

export function useDhorEntryMutation({
  studentId,
  teacherId, // Logged, not saved directly currently
  onSuccess,
}: UseDhorEntryMutationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: DhorBookCombinedFormData) => {
      console.log(
        "Processing dhor book related entries with data:",
        JSON.stringify(formData, null, 2),
      );

      const entryDate = formData.entry_date ||
        new Date().toISOString().split("T")[0];
      const results = [];

      try {
        // 1. Insert Sabaq data into 'progress' table
        if (
          formData.current_juz !== undefined &&
          formData.current_surah !== undefined &&
          formData.start_ayat !== undefined &&
          formData.end_ayat !== undefined
        ) {
          const progressRecord:
            Database["public"]["Tables"]["progress"]["Insert"] = {
              student_id: studentId,
              date: entryDate,
              current_juz: formData.current_juz,
              current_surah: formData.current_surah,
              start_ayat: formData.start_ayat,
              end_ayat: formData.end_ayat,
              pages_memorized: formData.pages_memorized,
            };
          if (formData.memorization_quality) {
            progressRecord.memorization_quality = formData.memorization_quality;
          }

          console.log(
            "Inserting progress record:",
            JSON.stringify(progressRecord, null, 2),
          );
          const { data: progressData, error: progressError } = await supabase
            .from("progress")
            .insert([progressRecord])
            .select();

          if (progressError) {
            console.error("Error inserting progress data:", progressError);
            throw new Error(
              `Failed to insert progress data: ${progressError.message}`,
            );
          }
          console.log("Successfully inserted progress data:", progressData);
          results.push({ type: "progress", data: progressData });
        } else {
          console.log(
            "Skipping progress insert: Sabaq fields (juz, surah, start/end ayat) not provided.",
          );
        }

        // 2. Insert Sabaq Para data into 'sabaq_para' table
        if (
          formData.sabaq_para_juz !== undefined &&
          formData.sabaq_para_memorization_quality !== undefined &&
          formData.quarters_revised !== undefined // This is required by sabaq_para table schema
        ) {
          const sabaqParaRecord:
            Database["public"]["Tables"]["sabaq_para"]["Insert"] = {
              student_id: studentId,
              revision_date: entryDate,
              juz_number: formData.sabaq_para_juz,
              quality_rating: formData.sabaq_para_memorization_quality,
              quarters_revised: formData.quarters_revised,
            };
          // if (formData.comments) sabaqParaRecord.teacher_notes = formData.comments;

          console.log(
            "Inserting sabaq_para record:",
            JSON.stringify(sabaqParaRecord, null, 2),
          );
          const { data: sabaqParaData, error: sabaqParaError } = await supabase
            .from("sabaq_para")
            .insert([sabaqParaRecord])
            .select();

          if (sabaqParaError) {
            console.error("Error inserting sabaq_para data:", sabaqParaError);
            throw new Error(
              `Failed to insert sabaq_para data: ${sabaqParaError.message}`,
            );
          }
          console.log("Successfully inserted sabaq_para data:", sabaqParaData);
          results.push({ type: "sabaq_para", data: sabaqParaData });
        } else {
          console.log(
            "Skipping sabaq_para insert: Sabaq Para fields (juz, quality, quarters_revised) not fully provided.",
          );
          if (formData.sabaq_para_pages !== undefined) {
            console.warn(
              "sabaq_para_pages was provided in form data but is not currently saved. The 'sabaq_para' table expects 'quarters_revised'. Update DB schema or form mapping if 'sabaq_para_pages' should be stored.",
            );
          }
        }

        // 3. Insert Dhor (Juz Revisions) data into 'juz_revisions' table
        if (formData.dhor_juz !== undefined) {
          // Fetch the current max dhor_slot for this student and date
          const { data: existingDhors, error: fetchDhorError } = await supabase
            .from("juz_revisions")
            .select("dhor_slot")
            .eq("student_id", studentId)
            .eq("revision_date", entryDate)
            .order("dhor_slot", { ascending: false })
            .limit(1);

          if (fetchDhorError) {
            console.error(
              "Error fetching existing dhor slots:",
              fetchDhorError,
            );
            throw new Error(
              `Failed to fetch existing dhor slots: ${fetchDhorError.message}`,
            );
          }

          const maxExistingSlot = existingDhors && existingDhors.length > 0 &&
              existingDhors[0].dhor_slot
            ? existingDhors[0].dhor_slot
            : 0;
          const newDhorSlot = maxExistingSlot + 1;

          const juzRevisionRecord:
            Database["public"]["Tables"]["juz_revisions"]["Insert"] = {
              student_id: studentId,
              revision_date: entryDate,
              juz_revised: formData.dhor_juz as number, // Correctly map to the required juz_revised column
              dhor_slot: newDhorSlot,
            };
          if (formData.dhor_memorization_quality) {
            juzRevisionRecord.memorization_quality =
              formData.dhor_memorization_quality;
          }
          if (formData.dhor_quarter_start !== undefined) { // Map to quarter_start column
            juzRevisionRecord.quarter_start = formData.dhor_quarter_start;
          }
          if (formData.dhor_quarters_covered !== undefined) { // Map to quarters_covered column
            juzRevisionRecord.quarters_covered = formData.dhor_quarters_covered;
          }

          console.log(
            `Inserting juz_revisions record with dhor_slot ${newDhorSlot}:`,
            JSON.stringify(juzRevisionRecord, null, 2),
          );
          const { data: juzRevisionData, error: juzRevisionError } =
            await supabase
              .from("juz_revisions")
              .insert([juzRevisionRecord])
              .select();

          if (juzRevisionError) {
            console.error(
              "Error inserting juz_revisions data:",
              juzRevisionError,
            );
            throw new Error(
              `Failed to insert Dhor data: ${juzRevisionError.message}`,
            );
          }
          console.log("Successfully inserted Dhor data:", juzRevisionData);
          results.push({ type: "juz_revisions", data: juzRevisionData });
        } else {
          console.log("Skipping Dhor insert: dhor_juz not provided.");
        }

        // Log any remaining form data fields that are not directly mapped or saved,
        // including legacy fields for context if needed.
        console.log("Unsaved/Legacy form data fields & other context:", {
          comments: formData.comments,
          points: formData.points,
          detention: formData.detention,
          teacher_id: teacherId, // For logging context
          day_of_week_legacy: formData.day_of_week,
          sabak_para_legacy: formData.sabak_para,
          dhor_1_string_legacy: formData.dhor_1,
          dhor_1_mistakes_legacy: formData.dhor_1_mistakes,
          dhor_2_string_legacy: formData.dhor_2,
          dhor_2_mistakes_legacy: formData.dhor_2_mistakes,
          sabaq_para_pages_from_form: formData.sabaq_para_pages,
        });

        if (results.length === 0) {
          console.warn(
            "No data was inserted into any table. Check form data and conditions for insertion.",
          );
        }

        return { entryDate, studentId, results };
      } catch (error) {
        console.error("Exception in mutation function:", error);
        let errorMessage =
          "An unexpected error occurred during data submission.";
        if (error instanceof Error) {
          errorMessage = error.message;
          console.error("Stack trace:", error.stack);
        } else if (typeof error === "string") {
          errorMessage = error;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      console.log(
        "Mutation succeeded, invalidating queries for student:",
        data?.studentId,
        "on date:",
        data?.entryDate,
      );

      const entryDateString = data?.entryDate;
      const currentStudentId = data?.studentId;

      if (entryDateString && currentStudentId) {
        // Parse entryDateString carefully. Assuming it's 'YYYY-MM-DD'.
        // Appending T00:00:00 helps ensure it's parsed as local time midnight.
        const entryDateObj = new Date(entryDateString + "T00:00:00");

        // Calculate week start and end for the "dhor-book-entries" query key
        const weekStartForDhorKey = startOfWeek(entryDateObj);
        const weekEndForDhorKey = endOfWeek(entryDateObj);
        const weekStartStr = format(weekStartForDhorKey, "yyyy-MM-dd");
        const weekEndStr = format(weekEndForDhorKey, "yyyy-MM-dd");

        console.log(
          `Invalidating dhor-book-entries for student ${currentStudentId}, week: ${weekStartStr} to ${weekEndStr}`,
        );
        queryClient.invalidateQueries({
          queryKey: [
            "dhor-book-entries",
            currentStudentId,
            weekStartStr,
            weekEndStr,
          ],
          refetchType: "all",
        });

        // Existing invalidations (example, keep your actual ones)
        // const entryWeekISO = getStartOfWeekISO(entryDateObj); // If you still use this for other keys
        // console.log(`Invalidating queries for student ${currentStudentId}, week start ISO: ${entryWeekISO}`);
        queryClient.invalidateQueries({
          queryKey: [
            "progress",
            currentStudentId, /*, entryWeekISO or other params as needed */
          ],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: [
            "sabaq_para",
            currentStudentId, /*, entryWeekISO or other params as needed */
          ],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: [
            "juz_revisions",
            currentStudentId, /*, entryWeekISO or other params as needed */
          ],
          refetchType: "all",
        });
      }

      // Invalidate all relevant queries to ensure both tabs are updated
      if (currentStudentId) {
        queryClient.invalidateQueries({
          queryKey: ["progress", currentStudentId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["sabaq_para", currentStudentId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["juz_revisions", currentStudentId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["student-progress", currentStudentId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["dhor-book-summary", currentStudentId],
          refetchType: "all",
        });
      }

      // Invalidate classroom records queries
      queryClient.invalidateQueries({
        queryKey: ["progress"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["sabaq_para"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["juz_revisions"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["student-progress"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher-summary"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher-schedule"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["revision-schedule"],
        refetchType: "all",
      });

      // Specifically invalidate classroom-records query with the date parameter for the classroom tab
      queryClient.invalidateQueries({
        queryKey: ["classroom-records"],
        refetchType: "all",
      });

      // onSuccess prop call from the component using the mutation
      // This should be called after invalidations if it triggers further refetches manually.
      // The original code had this: onSuccess?.(data);
      // It's better if component relies on automatic refetch from invalidation.
      // If onSuccess?.(data) is critical for UI changes (like closing dialog), keep it.
      if (onSuccess) { // Check if original onSuccess callback exists (it's optional in props)
        onSuccess(data);
      }

      toast({
        title: "Success",
        description: "Student progress entries processed successfully.",
      });
    },
    onError: (error) => {
      console.error("Error processing entries:", error);
      let errorMessage = "Failed to process entries. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      }
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return { mutate, isPending };
}
