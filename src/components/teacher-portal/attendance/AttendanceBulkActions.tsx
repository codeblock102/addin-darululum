import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

interface AttendanceBulkActionsProps {
  selectedCount: number;
  bulkActionStatus: string;
  onBulkActionStatusChange: (value: string) => void;
  onApply: () => void;
  onClearSelection: () => void;
  disabled: boolean;
}

export const AttendanceBulkActions = ({
  selectedCount,
  bulkActionStatus,
  onBulkActionStatusChange,
  onApply,
  onClearSelection,
  disabled,
}: AttendanceBulkActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-3 mb-4 border rounded-lg bg-muted/30">
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        {selectedCount} student(s) selected
      </p>
      <Select
        value={bulkActionStatus}
        onValueChange={onBulkActionStatusChange}
      >
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Set status for selected" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="present">Present</SelectItem>
          <SelectItem value="absent">Absent</SelectItem>
          <SelectItem value="late">Late</SelectItem>
          <SelectItem value="excused">Excused</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={onApply}
        disabled={!bulkActionStatus || disabled}
        className="h-9"
      >
        Apply to Selected
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        className="h-9"
      >
        Clear Selection
      </Button>
    </div>
  );
};
