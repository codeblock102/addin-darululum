export interface StudentFormData {
  studentName: string;
  dateOfBirth: string;
  enrollmentDate: string;
  gender: string;
  grade: string;
  healthCard: string;
  permanentCode: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
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
