import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Search } from "lucide-react";
import type { RecordTypeFilter } from "./types.ts";

interface RecordsFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  recordType: RecordTypeFilter;
  onRecordTypeChange: (value: RecordTypeFilter) => void;
}

export function RecordsFilter(
  { searchQuery, onSearchChange, recordType, onRecordTypeChange }:
    RecordsFilterProps,
) {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
      <div className="flex items-center gap-2 w-full max-w-xs">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      <Select
        value={recordType}
        onValueChange={(value) =>
          onRecordTypeChange(value as RecordTypeFilter)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Show all records" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All records</SelectItem>
          <SelectItem value="complete">
            Completed records
          </SelectItem>
          <SelectItem value="incomplete">
            Incomplete records
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
