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
    <div className="p-4 sm:p-5 border border-gray-200 rounded-xl bg-white space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">
          {selectedStudents.size} students selected
        </h3>
        <Button variant="outline" onClick={onClear} disabled={isSubmitting} className="border-gray-300 hover:bg-gray-100">
          Clear selection
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SliderTimeSelector form={form} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button onClick={() => handleStatusClick('present')} disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
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
          <Button onClick={() => handleStatusClick('excused')} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excused
          </Button>
        </div>
      </div>
    </div>
  );
}; 