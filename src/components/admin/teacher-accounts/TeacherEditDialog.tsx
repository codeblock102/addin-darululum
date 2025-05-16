
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TeacherAccount } from "@/types/teacher";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface TeacherEditDialogProps {
  teacher: TeacherAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherEditDialog({
  teacher,
  open,
  onOpenChange
}: TeacherEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string | undefined;
    phone: string | undefined;
    subject: string;
    experience: string;
    bio: string | undefined;
  }>({
    name: teacher?.name || "",
    email: teacher?.email || "",
    phone: teacher?.phone || "",
    subject: teacher?.subject || "",
    experience: teacher?.experience || "",
    bio: teacher?.bio || ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when teacher changes
  useState(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        subject: teacher.subject || "",
        experience: teacher.experience || "",
        bio: teacher.bio || ""
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    setLoading(true);
    try {
      // Update teacher information in the database
      const { error } = await supabase
        .from('teachers')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          experience: formData.experience,
          bio: formData.bio
        })
        .eq('id', teacher.id);

      if (error) {
        throw error;
      }

      // If the email was changed, also update the user record
      if (teacher.email !== formData.email && teacher.userId) {
        // This is a simplified example - in a real app, you might need more 
        // complex logic for updating user emails in the auth system
        const { error: userError } = await supabase
          .from('users')
          .update({ email: formData.email })
          .eq('id', teacher.userId);

        if (userError) {
          console.error("Error updating user email:", userError);
          // Continue anyway since the teacher record was updated
        }
      }

      toast({
        title: "Teacher account updated",
        description: `${formData.name}'s account has been successfully updated.`
      });

      // Refresh the teacher accounts data
      queryClient.invalidateQueries({ queryKey: ['teacher-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-detail', teacher.id] });

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the teacher account.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Teacher Account</DialogTitle>
            <DialogDescription>
              Update the teacher information. Click save when you're done.
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
                value={formData.email || ""}
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
                value={formData.phone || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience" className="text-right">
                Experience (years)
              </Label>
              <Input
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right">
                Biography
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={handleChange}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
