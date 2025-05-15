
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { StudentGradeData } from "./types";

interface GradeFormProps {
  selectedStudent: string;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  gradeData: StudentGradeData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const GradeForm = ({
  selectedStudent,
  onSubmit,
  isSubmitting,
  gradeData,
  onInputChange,
  onSelectChange
}: GradeFormProps) => {
  if (!selectedStudent) {
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="memorization_quality">Memorization Quality</Label>
          <Select 
            value={gradeData.memorization_quality}
            onValueChange={(value) => onSelectChange('memorization_quality', value)}
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
          <Label htmlFor="tajweed_grade">Tajweed Grade</Label>
          <Input
            id="tajweed_grade"
            name="tajweed_grade"
            value={gradeData.tajweed_grade}
            onChange={onInputChange}
            placeholder="e.g., Excellent, Good, Needs Practice"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="attendance_grade">Attendance</Label>
          <Input
            id="attendance_grade"
            name="attendance_grade"
            value={gradeData.attendance_grade}
            onChange={onInputChange}
            placeholder="e.g., 90%, Regular, Irregular"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="participation_grade">Class Participation</Label>
          <Input
            id="participation_grade"
            name="participation_grade"
            value={gradeData.participation_grade}
            onChange={onInputChange}
            placeholder="e.g., Active, Moderate, Low"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Teacher Notes</Label>
        <textarea
          id="notes"
          name="notes"
          value={gradeData.notes}
          onChange={onInputChange}
          placeholder="Additional notes about the student's performance"
          className="w-full min-h-[100px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Submit Grade
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
