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
  onOpenChange,
}: NewProgressEntryProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { submitProgress, isProcessing, contributorName } = useProgressSubmit(
    studentId,
  );

  const handleOpenChange = (newOpen: boolean) => {
    setIsDialogOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog
      open={open !== undefined ? open : isDialogOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}
          variant="outline"
          className="hover:opacity-90 font-semibold"
        >
          <BookOpen className="mr-2 h-4 w-4" style={{ color: "#ffffff" }} />
          <span style={{ color: "#ffffff" }}>Add Progress</span>
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
        {contributorName && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Entry will be recorded as submitted by {contributorName}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
