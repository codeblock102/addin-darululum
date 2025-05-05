
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue
} from "@/components/ui/select";
import { ScheduleFiltersProps } from "./types";

export const ScheduleFilters = ({
  filterPriority,
  setFilterPriority,
  searchQuery,
  setSearchQuery
}: ScheduleFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search schedules..." 
          className="pl-8 w-full sm:w-[200px]" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Select value={filterPriority || ""} onValueChange={setFilterPriority}>
        <SelectTrigger className="w-full sm:w-[130px]">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            <span>{filterPriority || "Priority"}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
