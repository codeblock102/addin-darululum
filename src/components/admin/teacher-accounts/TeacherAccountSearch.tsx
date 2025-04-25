
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TeacherAccountSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function TeacherAccountSearch({ searchQuery, onSearchChange }: TeacherAccountSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search teachers by name or email..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
