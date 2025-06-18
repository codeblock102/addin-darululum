import { Button } from "@/components/ui/button.tsx";
import { SliderTimeSelector } from "./SliderTimeSelector.tsx";
import { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

interface BulkActionsProps {
  form: UseFormReturn<any>;
  selectedStudents: Set<string>;
  onClear: () => void;
  isSubmitting: boolean;
  onSubmit: (student_ids: string[], status: string) => void;
}

export const BulkActions = ({ form, selectedStudents, onClear, isSubmitting, onSubmit }: BulkActionsProps) => {
  const handleStatusClick = (status: string) => {
    if (selectedStudents.size === 0) return;
    onSubmit(Array.from(selectedStudents), status);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{selectedStudents.size} students selected</h3>
        <Button variant="ghost" onClick={onClear} disabled={isSubmitting}>Clear selection</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SliderTimeSelector form={form} />
        <div className="flex items-center gap-2">
            <Button onClick={() => handleStatusClick('present')} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Present
            </Button>
            <Button onClick={() => handleStatusClick('absent')} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Absent
            </Button>
            <Button onClick={() => handleStatusClick('late')} disabled={isSubmitting} className="w-full bg-orange-500 hover:bg-orange-600">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Late
            </Button>
            <Button onClick={() => handleStatusClick('excused')} disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excused
            </Button>
        </div>
      </div>
    </div>
  );
}; 