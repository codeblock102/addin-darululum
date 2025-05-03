
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Search className="h-5 w-5 text-gray-500" />
      <Input
        placeholder="Search by student or class name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
      />
    </div>
  );
}
