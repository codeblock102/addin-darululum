import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { useRevisionData } from "./useRevisionData.ts";
import { RevisionForm } from "./RevisionForm.tsx";
import { Button } from "@/components/ui/button.tsx";
import { RevisionFormValues } from "@/types/dhor-book.ts";
import { DeleteRevisionDialog } from "./DeleteRevisionDialog.tsx";

interface EditRevisionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  revisionId: string;
  refetch: () => void;
}

export function EditRevisionDialog({
  open,
  setOpen,
  revisionId,
  refetch,
}: EditRevisionDialogProps) {
  const {
    revision,
    isLoading,
    handleSave,
    handleDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  } = useRevisionData(revisionId, () => {
    refetch();
    setOpen(false);
  });

  const {
    juz_revised,
    memorization_quality,
    notes,
    revision_date,
    time_spent,
  } = revision || {};

  const defaultValues = {
    date: revision_date ? new Date(revision_date) : new Date(),
    memorization_quality:
      (memorization_quality as RevisionFormValues["memorization_quality"]) ||
      "average",
    time_spent: time_spent || 30,
    notes: notes || "",
    juz_number: juz_revised || 0,
    quarters_revised: "1st_quarter",
    status: "completed",
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
            <Button form="revision-form" type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
      {isDeleteDialogOpen && (
        <DeleteRevisionDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirmDelete={handleDelete}
        />
      )}
    </AlertDialog>
  );
}
