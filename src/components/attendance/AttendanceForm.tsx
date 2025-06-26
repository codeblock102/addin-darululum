import { useState } from "react";
import { Form } from "@/components/ui/form.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { DateSelector } from "./form/DateSelector.tsx";
import { NotesField } from "./form/NotesField.tsx";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit.ts";
import { StudentGrid } from "./form/StudentGrid.tsx";
import { BulkActions } from "./form/BulkActions.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

export const AttendanceForm = () => {
  const { session } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { form, isProcessing, handleBulkSubmit } = useAttendanceSubmit({
    onSuccess: () => setSelectedStudents(new Set()),
    onError: (error: Error) =>
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      }),
  });

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(studentId)) newSelected.delete(studentId);
      else newSelected.add(studentId);
      return newSelected;
    });
  };

  const handleSelectAll = (students: { id: string }[] = []) => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map((s) => s.id)));
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Date and Time</CardTitle>
            <CardDescription>
              Select the date and time for the attendance records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DateSelector form={form} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Students</CardTitle>
            <CardDescription>
              Choose the students to mark attendance for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentGrid
              form={form}
              user={session?.user ?? null}
              multiSelect
              selectedStudents={selectedStudents}
              onStudentSelect={handleStudentSelect}
              onSelectAll={handleSelectAll}
            />
          </CardContent>
        </Card>

        {selectedStudents.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Apply the same attendance status to all selected students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkActions
                form={form}
                selectedStudents={selectedStudents}
                onClear={() => setSelectedStudents(new Set())}
                isSubmitting={isProcessing}
                onSubmit={handleBulkSubmit}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>
              Add any relevant notes for this attendance record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotesField form={form} />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
};
