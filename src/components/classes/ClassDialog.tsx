import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClassFormData } from "./validation/classFormSchema";

export interface ClassDialogProps {
  onClose: () => void;
  selectedClass?: (Partial<ClassFormData> & { id: string }) | null;
}

export const ClassDialog = ({ onClose, selectedClass }: ClassDialogProps) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedClass ? "Edit Class" : "Add New Class"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Class dialog content goes here</p>
          {selectedClass && <p>Editing class: {selectedClass.id}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
