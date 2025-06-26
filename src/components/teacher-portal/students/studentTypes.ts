export interface StudentFormData {
  studentName: string;
  dateOfBirth: string;
  enrollmentDate: string;
  guardianName: string;
  guardianContact: string;
  guardianEmail: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string;
  status: "active" | "inactive";
  completedJuz: number[];
  currentJuz: string;
}
