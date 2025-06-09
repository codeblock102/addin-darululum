
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader";
import { ClassSelector } from "./form/ClassSelector";
import { StudentGrid } from "./form/StudentGrid";
import { SliderTimeSelector } from "./form/SliderTimeSelector";
import { NotesField } from "./form/NotesField";
import { SubmitButton } from "./form/SubmitButton";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit";
import { AttendanceFormValues } from "@/types/attendance-form";

const attendanceSchema = z.object({
  class_id: z.string().min(1, "Please select a class"),
  student_id: z.string().min(1, "Please select a student"),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  status: z.enum(["present", "absent", "late", "excused"]),
  late_reason: z.string().optional(),
  notes: z.string().optional(),
});

export const AttendanceForm = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      class_id: "",
      student_id: "",
      date: new Date(),
      time: "09:00",
      status: "present",
      late_reason: "",
      notes: "",
    },
  });

  const { handleSubmit, isProcessing } = useAttendanceSubmit({
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

  const onSubmit = (data: AttendanceFormValues) => {
    handleSubmit(data);
  };

  return (
    <div className="space-y-6">
      <AttendanceFormHeader />

      <Card>
        <CardHeader>
          <CardTitle>Record Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ClassSelector
              form={form}
              selectedClassId={selectedClassId}
              onClassChange={setSelectedClassId}
            />

            <StudentGrid form={form} selectedClassId={selectedClassId} />

            <SliderTimeSelector form={form} />

            <NotesField form={form} />

            <SubmitButton isPending={isProcessing} isUpdate={false} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
