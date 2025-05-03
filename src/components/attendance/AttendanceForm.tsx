
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader";
import { ClassSelector } from "./form/ClassSelector";
import { StudentSelector } from "./form/StudentSelector";
import { AttendanceStatusRadioGroup } from "./form/AttendanceStatusRadioGroup";
import { NotesField } from "./form/NotesField";
import { SubmitButton } from "./form/SubmitButton";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit";

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
        <div className="space-y-4">
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AttendanceStatusRadioGroup form={form} />
                <NotesField form={form} />
                <SubmitButton 
                  isPending={saveAttendance.isPending} 
                  isUpdate={!!existingAttendance}
                />
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
