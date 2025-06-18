import { useState } from "react";
import { Form } from "@/components/ui/form.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader.tsx";
import { DateSelector } from "./form/DateSelector.tsx";
import { NotesField } from "./form/NotesField.tsx";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit.ts";
import { StudentGrid } from "./form/StudentGrid.tsx";
import { BulkActions } from "./form/BulkActions.tsx";
import { useAuth } from "@/hooks/use-auth.ts";

export const AttendanceForm = () => {
  const { session } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );
  const { toast } = useToast();

  const { form, isProcessing, handleBulkSubmit } = useAttendanceSubmit({
    onSuccess: () => {
      setSelectedStudents(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (students: { id: string }[] = []) => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set()); // Deselect all
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id))); // Select all
    }
  };

  return (
    <div className="space-y-6">
      <AttendanceFormHeader />
      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 p-4 border rounded-lg">
            <DateSelector form={form} />
          </div>

          <StudentGrid
            form={form}
            user={session?.user ?? null}
            multiSelect={true}
            selectedStudents={selectedStudents}
            onStudentSelect={handleStudentSelect}
            onSelectAll={handleSelectAll}
          />

          {selectedStudents.size > 0 && (
            <BulkActions
              form={form}
              selectedStudents={selectedStudents}
              onClear={() => setSelectedStudents(new Set())}
              isSubmitting={isProcessing}
              onSubmit={handleBulkSubmit}
            />
          )}

          <NotesField form={form} />
        </div>
      </Form>
    </div>
  );
};
