export interface StudentFormData {
  studentName: string;
  dateOfBirth: string;
  enrollmentDate: string;
  guardianName: string;
  guardianContact: string;
  status: "active" | "inactive";
  completedJuz: number[];
  currentJuz: string;
}
