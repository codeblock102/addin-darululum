/**
 * ReasonSelector — shows the structured absence/late reason picker
 * when the selected attendance status warrants a reason.
 *
 * Shows for: absent, excused, late
 * Uses AbsenceReasonSelect (Mozaïk-style grouped dropdown).
 * Stores reason in `late_reason` field (existing column) and
 * appends description to `notes` when provided.
 */
import { UseFormReturn, useWatch } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form.ts";
import { AbsenceReasonSelect } from "@/components/attendance/AbsenceReasonSelect.tsx";
import {
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form.tsx";

interface ReasonSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
}

const REASON_STATUSES = ["absent", "excused", "late"];

export function ReasonSelector({ form }: ReasonSelectorProps) {
  const status = useWatch({ control: form.control, name: "status" });
  const lateReason = useWatch({ control: form.control, name: "late_reason" }) ?? "";
  const notes = useWatch({ control: form.control, name: "notes" }) ?? "";

  if (!REASON_STATUSES.includes(status)) return null;

  return (
    <div className="pt-1">
      <FormField
        control={form.control}
        name="late_reason"
        render={({ field }) => (
          <FormItem>
            <AbsenceReasonSelect
              value={field.value ?? ""}
              onChange={field.onChange}
              description={notes}
              onDescriptionChange={(val) => form.setValue("notes", val)}
              showDescription
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
