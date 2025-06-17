import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { GradeData, Student } from "./types";

interface GradeFormProps {
  students: Student[] | undefined;
  studentsLoading: boolean;
  selectedStudent: string;
  onStudentChange: (student: string) => void;
  gradeData: GradeData;
  onGradeDataChange: (data: GradeData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const GradeForm = ({
  students,
  studentsLoading,
  selectedStudent,
  onStudentChange,
  gradeData,
  onGradeDataChange,
  onSubmit,
  isSubmitting,
}: GradeFormProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onGradeDataChange({ ...gradeData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    onGradeDataChange({ ...gradeData, [name]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="student">Select Student</Label>
        <Select value={selectedStudent} onValueChange={onStudentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {studentsLoading
              ? (
                <div className="flex justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )
              : students && students.length > 0
              ? (
                students.map((student: Student) => (
                  <SelectItem key={student.name} value={student.name}>
                    {student.name}
                  </SelectItem>
                ))
              )
              : (
                <SelectItem value="none" disabled>
                  No students available
                </SelectItem>
              )}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && (
        <>
          <div className="space-y-2">
            <Label htmlFor="memorization_quality">Memorization Quality</Label>
            <Select
              value={gradeData.memorization_quality}
              onValueChange={(value) =>
                handleSelectChange("memorization_quality", value)}
            >
              <SelectTrigger id="memorization_quality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="needsWork">Needs Work</SelectItem>
                <SelectItem value="horrible">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Teacher Notes</Label>
            <textarea
              id="notes"
              name="notes"
              value={gradeData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes about the student's performance"
              className="w-full min-h-[100px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                )
                : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Grade
                  </>
                )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};
