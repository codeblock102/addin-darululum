
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RevisionForm, revisionSchema } from "./RevisionForm";
import { DeleteRevisionDialog } from "./DeleteRevisionDialog";
import { useRevisionData } from "./useRevisionData";

interface EditRevisionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  revisionId: string;
  studentId: string;
  refetch: () => void;
}

export function EditRevisionDialog({ 
  open, 
  setOpen, 
  revisionId, 
  studentId, 
  refetch 
}: EditRevisionDialogProps) {
  const { 
    revision, 
    isLoading, 
    handleSave, 
    handleDelete, 
    isDeleteDialogOpen, 
    setIsDeleteDialogOpen 
  } = useRevisionData(revisionId, studentId, () => {
    refetch();
    setOpen(false);
  });

  const handleClose = () => {
    setOpen(false);
  };

  const defaultValues = {
    date: revision?.date ? new Date(revision.date) : new Date(),
    memorization_quality: revision?.memorization_quality || "average",
    time_spent: revision?.time_spent || 30,
    notes: revision?.notes || "",
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Revision</AlertDialogTitle>
          <AlertDialogDescription>
            Make changes to the revision. Click save when you're done.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <RevisionForm 
          defaultValues={defaultValues} 
          onSubmit={handleSave} 
          isLoading={isLoading} 
        />
        
        <AlertDialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
      
      <DeleteRevisionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirmDelete={handleDelete}
      />
    </AlertDialog>
  );
}
