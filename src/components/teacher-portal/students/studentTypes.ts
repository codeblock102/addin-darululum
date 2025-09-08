export interface StudentFormData {
  studentName: string;
  dateOfBirth: string;
  enrollmentDate: string;
  guardianName: string;
  guardianContact: string;
  guardianEmail: string;
  guardian2Name: string;
  guardian2Contact: string;
  guardian2Email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string;
  status: "active" | "inactive";
  completedJuz: number[];
  currentJuz: string;
}
