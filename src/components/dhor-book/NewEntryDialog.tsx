import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { DhorBookEntryForm } from "./DhorBookEntryForm.tsx";
import { useDhorEntryMutation } from "./useDhorEntryMutation.ts";
import { useToast } from "@/hooks/use-toast.ts";

export interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  onSuccess?: (data?: unknown) => void;
}

export function NewEntryDialog({
  open,
  onOpenChange,
  studentId,
  teacherId,
  onSuccess,
}: NewEntryDialogProps) {
  const { toast } = useToast();
  const { mutate, isPending } = useDhorEntryMutation({
    studentId,
    teacherId,
    onSuccess: (data) => {
      console.log("Entry created successfully:", data);
      toast({
        title: "Entry Added",
        description: "The dhor book entry has been saved successfully.",
      });
      onSuccess?.(data);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>New Dhor Book Entry</DialogTitle>
          <DialogDescription>
            Fill in the details for the student's dhor (progress) for the
            selected date.
          </DialogDescription>
        </DialogHeader>
        <DhorBookEntryForm
          onSubmit={mutate}
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
