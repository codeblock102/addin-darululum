
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Loader2, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { getInitials } from "@/utils/stringUtils.ts";
import { AttendanceFormValues } from "@/types/attendance-form.ts";

interface StudentGridProps {
  form: UseFormReturn<AttendanceFormValues>;
  selectedStudent?: string;
  onStudentSelect?: (studentId: string) => void;
  selectedClassId?: string;
  multiSelect?: boolean;
  selectedStudents?: Set<string>;
}

export function StudentGrid({ 
  form, 
  selectedStudent, 
  onStudentSelect,
  multiSelect = false,
  selectedStudents = new Set()
}: StudentGridProps) {
  const { data: students, isLoading } = useQuery({
    queryKey: ["all-students-grid"],
    queryFn: async () => {
      console.log("Fetching all students for grid");
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students for grid:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} students for grid`);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading students...
      </div>
    );
  }

  const handleStudentClick = (studentId: string) => {
    if (multiSelect) {
      onStudentSelect?.(studentId);
    } else {
      form.setValue("student_id", studentId);
      onStudentSelect?.(studentId);
    }
  };

  const isStudentSelected = (studentId: string) => {
    if (multiSelect) {
      return selectedStudents.has(studentId);
    }
    return selectedStudent === studentId || form.getValues("student_id") === studentId;
  };

  return (
    <FormField
      control={form.control}
      name="student_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-900 dark:text-gray-100 font-medium">
            {multiSelect ? "Select Students (Multiple)" : "Select Student"}
          </FormLabel>
          <FormControl>
            <ScrollArea className="h-80 w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {students?.map((student) => {
                  const isSelected = isStudentSelected(student.id);
                  
                  return (
                    <Card
                      key={student.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 relative ${
                        isSelected
                          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300"
                      }`}
                      onClick={() => handleStudentClick(student.id)}
                    >
                      {isSelected && multiSelect && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 font-medium">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Active Student
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {(!students || students.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No students found
                </div>
              )}
            </ScrollArea>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
