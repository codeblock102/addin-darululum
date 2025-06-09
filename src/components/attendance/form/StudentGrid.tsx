
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceStatus } from "@/types/attendance.ts";
import { getInitials } from "@/utils/stringUtils.ts";

type AttendanceFormValues = {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
  date: Date;
  time: string;
  late_reason?: string;
};

interface StudentGridProps {
  form: UseFormReturn<AttendanceFormValues>;
  selectedStudent?: string;
  onStudentSelect?: (studentId: string) => void;
}

export function StudentGrid({ form, selectedStudent, onStudentSelect }: StudentGridProps) {
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

  return (
    <FormField
      control={form.control}
      name="student_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700 dark:text-gray-300">
            Select Student
          </FormLabel>
          <FormControl>
            <ScrollArea className="h-80 w-full rounded-md border p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {students?.map((student) => (
                  <Card
                    key={student.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedStudent === student.id || field.value === student.id
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => {
                      field.onChange(student.id);
                      onStudentSelect?.(student.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
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
                ))}
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
