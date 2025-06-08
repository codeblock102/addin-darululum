import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StudentSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const StudentSearchBar = (
  { searchQuery, setSearchQuery }: StudentSearchBarProps,
) => {
  return (
    <div className="flex items-center space-x-2 mt-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
};
