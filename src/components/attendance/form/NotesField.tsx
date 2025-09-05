import { Textarea } from "@/components/ui/textarea.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface NotesFieldProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function NotesField({ form }: NotesFieldProps) {
  const { t } = useI18n();
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-black">
            {t("pages.attendance.form.notes.title", "Additional Notes")}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={t("pages.attendance.form.notes.placeholder", "Add any additional notes about attendance")}
              className="resize-none border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
