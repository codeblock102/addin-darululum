import { SearchInput } from "@/components/table/SearchInput.tsx";

interface TeacherAccountSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function TeacherAccountSearch(
  { searchQuery, onSearchChange }: TeacherAccountSearchProps,
) {
  return (
    <div className="w-full">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search by name, email, or subject..."
        className="w-full bg-white border-gray-300 focus:ring-2 focus:ring-[hsl(142.8,64.2%,24.1%)] focus:border-[hsl(142.8,64.2%,24.1%)] transition-all duration-200"
      />
    </div>
  );
}
