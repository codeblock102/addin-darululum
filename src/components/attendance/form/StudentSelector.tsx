import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Loader2 } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { AttendanceFormValues } from "@/types/attendance-form.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface StudentSelectorProps {
  students?: { id: string; name: string }[];
  isLoading?: boolean;
  form: UseFormReturn<AttendanceFormValues>;
  disabled?: boolean;
  selectedStudent?: string;
  setSelectedStudent?: (value: string) => void;
}

export function StudentSelector({
  form,
  disabled = false,
  selectedStudent,
  setSelectedStudent,
}: StudentSelectorProps) {
  const { t } = useI18n();
  // Fetch all active students without teacher filtering
  const { data: students, isLoading } = useQuery({
    queryKey: ["all-students-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students for selector:", error);
        throw error;
      }

      return data || [];
    },
  });

  // If we have direct props for value/onChange, use those (for components not using react-hook-form)
  const handleChange = (value: string) => {
    if (setSelectedStudent) {
      setSelectedStudent(value);
    }
  };

  return (
    <FormField
      control={form.control}
      name="student_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-black">
            {t("pages.attendance.form.students.title", "Select Students")}
          </FormLabel>
          <FormControl>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                handleChange(value);
              }}
              value={selectedStudent || field.value}
              disabled={disabled || isLoading}
            >
              <SelectTrigger
                disabled={disabled || isLoading}
                className="w-full border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
              >
                {isLoading
                  ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("pages.attendance.loading", "Loading...")}
                    </div>
                  )
                  : <SelectValue placeholder={t("pages.attendance.form.students.placeholder", "Select a student")} />}
              </SelectTrigger>
              <SelectContent>
                {students?.length
                  ? (
                    students.filter((student) => student.id !== "").map((
                      student,
                    ) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))
                  )
                  : (
                    <SelectItem value="no-students" disabled>
                      {t("pages.attendance.form.students.none", "No students available")}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
