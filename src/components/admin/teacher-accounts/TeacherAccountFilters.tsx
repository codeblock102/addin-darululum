import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
interface TeacherAccountFiltersProps {
  statusFilter: "all" | "active" | "suspended";
  activityFilter: "all" | "7days" | "30days" | "inactive";
  onStatusFilterChange: (value: "all" | "active" | "suspended") => void;
  onActivityFilterChange: (value: "all" | "7days" | "30days" | "inactive") => void;
}
export function TeacherAccountFilters({
  statusFilter,
  activityFilter,
  onStatusFilterChange,
  onActivityFilterChange
}: TeacherAccountFiltersProps) {
  return <div className="flex gap-3 bg-slate-900">
      {/* Status Filter */}
      <div className="w-1/2">
        <Select value={statusFilter} onValueChange={value => onStatusFilterChange(value as "all" | "active" | "suspended")}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="suspended">Suspended Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Filter */}
      <div className="w-1/2">
        <Select value={activityFilter} onValueChange={value => onActivityFilterChange(value as "all" | "7days" | "30days" | "inactive")}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="7days">Active in 7 days</SelectItem>
            <SelectItem value="30days">Active in 30 days</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>;
}