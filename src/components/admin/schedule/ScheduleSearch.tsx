
import { SearchInput } from "@/components/table/SearchInput";

interface ScheduleSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ScheduleSearch = ({ searchTerm, onSearchChange }: ScheduleSearchProps) => {
  return (
    <SearchInput
      placeholder="Search by class name, day, or room..."
      value={searchTerm}
      onChange={onSearchChange}
      className="w-full"
    />
  );
};
