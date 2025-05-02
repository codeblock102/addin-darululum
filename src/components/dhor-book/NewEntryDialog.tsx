
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DhorBookEntryForm } from "./DhorBookEntryForm";
import { useDhorEntryMutation } from "./useDhorEntryMutation";

export interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  onSuccess?: (data?: any) => void;
}

export function NewEntryDialog({
  open,
  onOpenChange,
  studentId,
  teacherId,
  onSuccess
}: NewEntryDialogProps) {
  const { mutate, isPending } = useDhorEntryMutation({
    studentId,
    teacherId,
    onSuccess: (data) => {
      onSuccess?.(data);
      onOpenChange(false);
    }
  });

  // Don't render the form until dialog is open to prevent React hook errors
  if (!open) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Dhor Book Entry</DialogTitle>
        </DialogHeader>
        <div className="py-4">Loading...</div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Dhor Book Entry</DialogTitle>
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
