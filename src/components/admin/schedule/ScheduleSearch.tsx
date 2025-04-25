
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ScheduleSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ScheduleSearch = ({ searchTerm, onSearchChange }: ScheduleSearchProps) => {
  return (
    <div className="mb-6 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search schedules..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};
