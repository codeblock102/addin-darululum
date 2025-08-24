export type AssignmentStatus = "pending" | "completed" | "overdue";

export interface Assignment {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  status: AssignmentStatus;
  attachmentName?: string;
  attachmentUrl?: string; // In-memory/object URL for now
  classIds?: string[];
  studentIds?: string[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface NewAssignmentInput {
  title: string;
  description: string;
  dueDate?: string;
  file?: File | null;
}


