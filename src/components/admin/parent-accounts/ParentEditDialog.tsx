import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";

export interface ParentMinimal {
  id: string;
  name: string;
  email: string;
  student_ids: string[];
  phone?: string | null;
}

interface ParentEditDialogProps {
  parent: ParentMinimal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParentEditDialog({ parent, open, onOpenChange }: ParentEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (parent) {
      setFormData({
        name: parent.name || "",
        email: parent.email || "",
        phone: parent.phone || "",
      });
    }
  }, [parent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("parents")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
        })
        .eq("id", parent.id);

      if (error) throw error;

      toast({
        title: "Parent profile updated",
        description: `${formData.name}'s profile has been successfully updated.`,
      });

      queryClient.invalidateQueries({ queryKey: ["all-parents-min"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating parent:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the parent profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!parent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Parent Profile</DialogTitle>
            <DialogDescription>
              Update the parent's information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="col-span-3"
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-800 hover:bg-green-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
