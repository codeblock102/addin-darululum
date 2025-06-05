export interface Student {
  id: string;
  name: string;
  status?: "active" | "inactive" | "graduated" | "on-hold"; // Student status
  guardian_email?: string | null; // Optional: Parent/Guardian's email address
  // TODO: Add other common student fields like date_of_birth, enrollment_date, etc., if standardized.
} 