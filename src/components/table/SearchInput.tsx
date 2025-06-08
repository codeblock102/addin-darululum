import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange:
    | ((e: React.ChangeEvent<HTMLInputElement>) => void)
    | ((value: string) => void);
  placeholder?: string;
  className?: string;
}

export function SearchInput(
  { value, onChange, placeholder = "Search...", className = "" }:
    SearchInputProps,
) {
  // Handle both function signatures (direct value and event)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange === "function") {
      // Check if the onChange expects an event or direct value
      if (onChange.length === 1) {
        (onChange as (value: string) => void)(e.target.value);
      } else {
        (onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Search className="h-5 w-5 text-gray-500" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="flex-1 border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
      />
    </div>
  );
}
