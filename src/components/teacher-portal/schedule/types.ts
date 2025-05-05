
import { RevisionSchedule } from "@/types/dhor-book";

export interface StudentWithName {
  name: string;
}

export interface RevisionScheduleWithStudentName extends RevisionSchedule {
  students: StudentWithName;
}

export interface ScheduleFilterState {
  priority: string | null;
  searchQuery: string;
}

export interface ScheduleItemProps {
  schedule: RevisionScheduleWithStudentName;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

export interface ScheduleListProps {
  schedules: RevisionScheduleWithStudentName[] | null;
  isLoading: boolean;
  selectedStudentName?: string;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

export interface ScheduleActionsProps {
  tab: string;
}

export interface ScheduleFiltersProps {
  filterPriority: string | null;
  setFilterPriority: (priority: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
