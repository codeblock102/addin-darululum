
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Form } from "@/components/ui/form.tsx";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader.tsx";
import { StudentGrid } from "./form/StudentGrid.tsx";
import { AttendanceStatusRadioGroup } from "./form/AttendanceStatusRadioGroup.tsx";
import { TimeSelector } from "./form/TimeSelector.tsx";
import { ReasonSelector } from "./form/ReasonSelector.tsx";
import { NotesField } from "./form/NotesField.tsx";
import { SubmitButton } from "./form/SubmitButton.tsx";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit.ts";
import { Calendar } from "@/components/ui/calendar.tsx";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils.ts";

export function AttendanceForm() {
  const {
    form,
    onSubmit,
    selectedStudent,
    setSelectedStudent,
    selectedTime,
    setSelectedTime,
    selectedReason,
    setSelectedReason,
    existingAttendance,
    saveAttendance,
  } = useAttendanceSubmit();

  return (
    <Card className="border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
      <AttendanceFormHeader />
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Selector */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-gray-700 dark:text-gray-300">
                    Select Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Student Grid */}
            <StudentGrid
              form={form}
              selectedStudent={selectedStudent}
              onStudentSelect={setSelectedStudent}
            />

            {selectedStudent && (
              <>
                {/* Time Selector */}
                <TimeSelector
                  form={form}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                />

                {/* Attendance Status */}
                <AttendanceStatusRadioGroup form={form} />

                {/* Reason Selector (only for late) */}
                <ReasonSelector
                  form={form}
                  selectedReason={selectedReason}
                  onReasonSelect={setSelectedReason}
                  showOnlyForLate={true}
                />

                {/* Notes Field */}
                <NotesField form={form} />

                {/* Submit Button */}
                <SubmitButton
                  isPending={saveAttendance.isPending}
                  isUpdate={!!existingAttendance}
                />
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
