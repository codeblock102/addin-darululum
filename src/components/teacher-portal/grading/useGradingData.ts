import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GradeData, ProgressData, Student } from "./types";

export const useGradingData = (teacherId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["all-students-for-grading"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }

      const studentsWithProgress = await Promise.all(
        data.map(async (student) => {
          const { data: progressData, error: progressError } = await supabase
            .from("progress")
            .select("current_surah, current_juz, memorization_quality")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (progressError) {
            console.error("Error fetching student progress:", progressError);
            return {
              id: student.id,
              name: student.name,
              status: student.status,
            } as Student;
          }

          if (progressData && progressData.length > 0) {
            try {
              const progress = progressData[0] as ProgressData;
              return {
                id: student.id,
                name: student.name,
                status: student.status,
                current_surah: progress.current_surah,
                current_juz: progress.current_juz,
                memorization_quality: progress.memorization_quality,
              } as Student;
            } catch (e) {
              console.error("Error processing progress data:", e);
            }
          }

          return {
            id: student.id,
            name: student.name,
            status: student.status,
          } as Student;
        }),
      );

      return studentsWithProgress;
    },
  });

  const { data: teacherData } = useQuery({
    queryKey: ["profile-details-for-grading", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", teacherId)
        .single();

      if (error) {
        console.error("Error fetching teacher details:", error);
        return null;
      }

      return data;
    },
  });

  const submitGradeMutation = useMutation({
    mutationFn: async (
      data: { gradeData: GradeData; selectedStudent: string },
    ) => {
      const student = students?.find((s) => s.name === data.selectedStudent);
      if (!student) {
        throw new Error("Student not found");
      }

      const contributorInfo = teacherData
        ? {
          notes: `Teacher ${teacherData.name}: ${data.gradeData.notes}`,
        }
        : {
          notes: `Teacher: ${data.gradeData.notes}`,
        };

      const { data: result, error } = await supabase
        .from("progress")
        .insert({
          student_id: student.id,
          memorization_quality: data.gradeData.memorization_quality,
          date: new Date().toISOString().split("T")[0],
          ...contributorInfo,
        });

      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["student-grades", variables.selectedStudent],
      });
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
    },
  });

  return {
    students,
    studentsLoading,
    teacherData,
    submitGradeMutation,
  };
};

export const useStudentGrades = (
  selectedStudent: string,
  students: Student[] | undefined,
) => {
  return useQuery({
    queryKey: ["student-grades", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const student = students?.find((s) => s.name === selectedStudent);
      if (!student) return [];

      const { data, error } = await supabase
        .from("progress")
        .select(
          "current_surah, current_juz, memorization_quality, created_at, notes",
        )
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching student grades:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!selectedStudent && !!students,
  });
};
