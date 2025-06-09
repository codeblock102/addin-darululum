
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Form } from "@/components/ui/form.tsx";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader.tsx";
import { ClassSelector } from "./form/ClassSelector.tsx";
import { StudentSelector } from "./form/StudentSelector.tsx";
import { AttendanceStatusRadioGroup } from "./form/AttendanceStatusRadioGroup.tsx";
import { NotesField } from "./form/NotesField.tsx";
import { SubmitButton } from "./form/SubmitButton.tsx";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit.ts";

export function AttendanceForm() {
  const {
    form,
    onSubmit,
    selectedClass,
    setSelectedClass,
    selectedStudent,
    setSelectedStudent,
    classesData,
    students,
    isLoadingClasses,
    isLoadingStudents,
    existingAttendance,
    saveAttendance,
  } = useAttendanceSubmit();

  return (
    <Card className="border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
      <AttendanceFormHeader />
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ClassSelector
              form={form}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              isLoading={isLoadingClasses}
              classesData={classesData}
            />

            <StudentSelector
              form={form}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              isLoading={isLoadingStudents}
              students={students}
              disabled={!selectedClass}
            />

            {selectedStudent && (
              <>
                <AttendanceStatusRadioGroup form={form} />
                <NotesField form={form} />
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
