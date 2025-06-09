
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader";
import { ClassSelector } from "./form/ClassSelector";
import { StudentGrid } from "./form/StudentGrid";
import { DateSelector } from "./form/DateSelector";
import { SliderTimeSelector } from "./form/SliderTimeSelector";
import { NotesField } from "./form/NotesField";
import { SubmitButton } from "./form/SubmitButton";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit";

export const AttendanceForm = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const { toast } = useToast();

  const { form, handleSubmit, isProcessing } = useAttendanceSubmit({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance record saved successfully",
      });
      form.reset({
        class_id: "",
        student_id: "",
        date: new Date(),
        time: "09:00",
        status: "present",
        late_reason: "",
        notes: "",
      });
      setSelectedClassId("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <AttendanceFormHeader />

      <Card>
        <CardHeader>
          <CardTitle>Record Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DateSelector form={form} />
                
                <ClassSelector
                  form={form}
                  selectedClassId={selectedClassId}
                  onClassChange={setSelectedClassId}
                />
              </div>

              <StudentGrid form={form} selectedClassId={selectedClassId} />

              <SliderTimeSelector form={form} />

              <NotesField form={form} />

              <SubmitButton isPending={isProcessing} isUpdate={false} />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
