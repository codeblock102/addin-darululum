import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  // Render the form within the dialog. 
  // The Dialog component itself handles visibility based on the `open` prop.
  // This keeps DhorBookEntryForm in the tree, preserving its state when the dialog is hidden/reshown.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>New Dhor Book Entry</DialogTitle>
          <DialogDescription>
            Fill in the details for the student's dhor (progress) for the selected date.
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
