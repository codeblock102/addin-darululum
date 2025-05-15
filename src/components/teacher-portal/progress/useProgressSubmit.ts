
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProgressFormValues, ContributorInfo } from "./types";

export const useProgressSubmit = (teacherId: string, teacherData: any | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ProgressFormValues) => {
      // Create contributor info
      const contributorInfo: ContributorInfo = teacherData ? {
        contributor_id: teacherData.id,
        contributor_name: `Teacher ${teacherData.name}`
      } : {
        contributor_id: teacherId,
        contributor_name: "Teacher"
      };

      // Calculate verses memorized
      const versesMemorized = values.end_ayat - values.start_ayat + 1;

      // Create progress entry
      const { data, error } = await supabase.from('progress').insert({
        student_id: values.student_id,
        current_surah: values.current_surah,
        current_juz: values.current_juz,
        start_ayat: values.start_ayat,
        end_ayat: values.end_ayat,
        memorization_quality: values.memorization_quality,
        tajweed_level: values.tajweed_level,
        teacher_notes: values.notes,
        date: new Date().toISOString().split('T')[0],
        verses_memorized: versesMemorized,
        contributor_id: contributorInfo.contributor_id,
        contributor_name: contributorInfo.contributor_name
      });
      
      if (error) {
        throw new Error(`Failed to save progress: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-summary', teacherId]
      });
      toast({
        title: "Progress Recorded",
        description: "Student progress has been successfully saved."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Progress",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
