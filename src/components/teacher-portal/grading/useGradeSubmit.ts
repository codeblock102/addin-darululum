
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentGradeData } from "./types";

export const useGradeSubmit = (teacherId: string, selectedStudent: string, students: any[], teacherData: any) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StudentGradeData) => {
      const student = students?.find(s => s.name === selectedStudent);
      
      if (!student) {
        throw new Error("Student not found");
      }
      
      const contributorInfo = teacherData ? {
        contributor_id: teacherData.id,
        contributor_name: `Teacher ${teacherData.name}`
      } : {
        contributor_id: teacherId,
        contributor_name: "Teacher"
      };
      
      const { data: result, error } = await supabase
        .from('progress')
        .insert([{
          student_id: student.id,
          memorization_quality: data.memorization_quality,
          tajweed_level: data.tajweed_grade,
          teacher_notes: data.notes,
          date: new Date().toISOString().split('T')[0],
          ...contributorInfo
        }]);
      
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-grades', selectedStudent] });
      toast({
        title: "Grade Submitted",
        description: "The student's grade has been successfully recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit grade: ${error.message}`,
        variant: "destructive",
      });
    }
  });
};
