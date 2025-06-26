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
        placeholder="Search teachers by name, email or subject..."
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      />
    </div>
  );
}
