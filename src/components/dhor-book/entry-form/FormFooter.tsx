import { Button } from "@/components/ui/button.tsx";
import { DialogFooter } from "@/components/ui/dialog.tsx";

interface FormFooterProps {
  isPending: boolean;
  onCancel: () => void;
}

export function FormFooter({ isPending, onCancel }: FormFooterProps) {
  return (
    <DialogFooter>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Entry"}
      </Button>
    </DialogFooter>
  );
}
