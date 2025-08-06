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
  home_address: string;
  health_card_number: string;
  permanent_code: string;
  guardian_phone: string;
  guardian_whatsapp: string;
  preferred_language: string;
  secondary_guardian_name: string;
  secondary_guardian_phone: string;
  secondary_guardian_whatsapp: string;
  secondary_guardian_email: string;
  secondary_guardian_home_address: string;
  section?: string;
}
