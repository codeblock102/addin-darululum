import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Search } from "lucide-react";

interface AttendanceFiltersProps {
  selectedStatus: string | undefined;
  onStatusChange: (value: string | undefined) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  disabled: boolean;
}

export const AttendanceFilters = ({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  disabled,
}: AttendanceFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
      <div className="flex items-center space-x-2">
        <Select
          value={selectedStatus || "all"}
          onValueChange={(value) => {
            if (value === "all") {
              onStatusChange(undefined);
            } else {
              onStatusChange(value);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="excused">Excused</SelectItem>
            <SelectItem value="not-marked">Not Marked</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search student name..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
