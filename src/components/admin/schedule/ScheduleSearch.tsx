
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ScheduleSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ScheduleSearch = ({ searchTerm, onSearchChange }: ScheduleSearchProps) => {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by class name, day, or room..."
          className="pl-10 h-11 text-base bg-white border-gray-200 focus:border-primary focus:ring-primary"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
