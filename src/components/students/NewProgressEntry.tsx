
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";
import { ProgressForm } from "./progress/ProgressForm";
import { useProgressSubmit } from "./progress/useProgressSubmit";
import { NewProgressEntryProps } from "./progress/types";

export const NewProgressEntry = ({ 
  studentId, 
  studentName, 
  open, 
  onOpenChange 
}: NewProgressEntryProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { submitProgress, isProcessing } = useProgressSubmit(studentId);

  const handleOpenChange = (newOpen: boolean) => {
    setIsDialogOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open !== undefined ? open : isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="mr-2" />
          Add Progress
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Progress Entry</DialogTitle>
          <DialogDescription>
            Record progress for {studentName}
          </DialogDescription>
        </DialogHeader>
        <ProgressForm 
          onSubmit={(data) => {
            submitProgress(data, () => {
              handleOpenChange(false);
            });
          }}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
};
