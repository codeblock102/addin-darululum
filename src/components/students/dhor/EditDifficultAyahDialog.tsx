import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { DifficultAyahEntry } from "@/types/dhor-book.ts";

interface EditDifficultAyahDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  difficultAyah: DifficultAyahEntry | null;
  onSuccess: () => void;
}

export const EditDifficultAyahDialog = ({
  open,
  onOpenChange,
  difficultAyah,
  onSuccess,
}: EditDifficultAyahDialogProps) => {
  const [notes, setNotes] = useState(difficultAyah?.notes || "");
  const [isResolved, setIsResolved] = useState(
    difficultAyah?.status === "resolved",
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (open && difficultAyah) {
      setNotes(difficultAyah.notes || "");
      setIsResolved(difficultAyah.status === "resolved");
    }
    onOpenChange(open);
  };

  const handleSave = async () => {
    if (!difficultAyah) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("difficult_ayahs")
        .update({
          notes,
          status: isResolved ? "resolved" : "active",
          last_revised: isResolved
            ? new Date().toISOString().split("T")[0]
            : difficultAyah.last_revised,
          revision_count: isResolved
            ? (difficultAyah.revision_count || 0) + 1
            : difficultAyah.revision_count,
        })
        .eq("id", difficultAyah.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Difficult ayah updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating difficult ayah:", error);
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: "There was an error updating the difficult ayah.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!difficultAyah) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Difficult Ayah</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="surah">Surah</Label>
              <Input
                id="surah"
                value={difficultAyah.surah_number}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="ayah">Ayah</Label>
              <Input
                id="ayah"
                value={difficultAyah.ayah_number}
                disabled
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="resolved"
              checked={isResolved}
              onCheckedChange={setIsResolved}
            />
            <Label htmlFor="resolved">Mark as resolved</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
