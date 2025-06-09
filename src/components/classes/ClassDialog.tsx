
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ClassDialogProps {
  onClose: () => void;
}

export const ClassDialog = ({ onClose }: ClassDialogProps) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Class Management</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Class dialog content goes here</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
