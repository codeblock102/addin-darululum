
import { TeacherAccountSearch } from "./TeacherAccountSearch";
import { TeacherAccountFilters } from "./TeacherAccountFilters";

interface TeacherSearchAndFiltersProps {
  searchQuery: string;
  statusFilter: "all" | "active" | "suspended";
  activityFilter: "all" | "7days" | "30days" | "inactive";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "active" | "suspended") => void;
  onActivityFilterChange: (value: "all" | "7days" | "30days" | "inactive") => void;
}

export function TeacherSearchAndFilters({
  searchQuery,
  statusFilter,
  activityFilter,
  onSearchChange,
  onStatusFilterChange,
  onActivityFilterChange
}: TeacherSearchAndFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-2/3">
        <TeacherAccountSearch 
          searchQuery={searchQuery} 
          onSearchChange={onSearchChange} 
        />
      </div>
      <div className="w-full md:w-1/3">
        <TeacherAccountFilters
          statusFilter={statusFilter}
          activityFilter={activityFilter}
          onStatusFilterChange={onStatusFilterChange}
          onActivityFilterChange={onActivityFilterChange}
        />
      </div>
    </div>
  );
}
