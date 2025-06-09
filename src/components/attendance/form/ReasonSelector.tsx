
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Button } from "@/components/ui/button.tsx";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceStatus } from "@/types/attendance.ts";

type AttendanceFormValues = {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
  date: Date;
  time: string;
  late_reason?: string;
};

interface ReasonSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
  selectedReason?: string;
  onReasonSelect?: (reason: string) => void;
  showOnlyForLate?: boolean;
}

export function ReasonSelector({ form, selectedReason, onReasonSelect, showOnlyForLate = true }: ReasonSelectorProps) {
  const predefinedReasons = [
    "Sick",
    "Family Emergency",
    "Transit Delay",
    "Medical Appointment",
    "Traffic",
    "Overslept",
    "Personal Issue",
    "Weather Conditions",
    "Car Trouble",
    "Other"
  ];

  const currentStatus = form.watch("status");
  
  // Only show reason selector for late status if showOnlyForLate is true
  if (showOnlyForLate && currentStatus !== "late") {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="late_reason"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-900 dark:text-gray-100 font-medium">
            Reason for Lateness
          </FormLabel>
          <FormControl>
            <ScrollArea className="h-40 w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4">
              <div className="space-y-3">
                {predefinedReasons.map((reason) => (
                  <Button
                    key={reason}
                    type="button"
                    variant={selectedReason === reason || field.value === reason ? "default" : "outline"}
                    size="sm"
                    className={`w-full justify-start font-medium transition-all ${
                      selectedReason === reason || field.value === reason
                        ? "bg-blue-600 text-white shadow-md border-blue-600 hover:bg-blue-700"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-300"
                    }`}
                    onClick={() => {
                      field.onChange(reason);
                      onReasonSelect?.(reason);
                    }}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
