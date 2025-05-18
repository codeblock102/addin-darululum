
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DhorBookEntryForm } from "./DhorBookEntryForm";
import { useDhorEntryMutation } from "./useDhorEntryMutation";
import { toast } from "@/components/ui/use-toast";

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
      console.log("Entry created successfully:", data);
      toast({
        title: "Entry Added",
        description: "The dhor book entry has been saved successfully.",
      });
      onSuccess?.(data);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error creating entry:", error);
      toast({
        title: "Error",
        description: "There was a problem saving the entry. Please try again.",
        variant: "destructive",
      });
    }
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
