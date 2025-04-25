
// Add the Schedule type definition to fix the type errors
export interface Schedule {
  id: string;
  class_name: string;
  day_of_week: string;
  time_slot: string;
  room: string;
  capacity: number;
  current_students: number;
  teacher_id?: string | null;
}
