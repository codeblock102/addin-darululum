import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isPending: boolean;
  isUpdate: boolean;
}

export function SubmitButton({ isPending, isUpdate }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
      disabled={isPending}
    >
      {isPending
        ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </span>
        )
        : (
          isUpdate ? "Update Attendance" : "Save Attendance"
        )}
    </Button>
  );
}
