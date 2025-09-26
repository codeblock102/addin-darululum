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
import { TeacherAccount } from "@/types/teacher.ts";
import { Textarea } from "@/components/ui/textarea.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, Copy } from "lucide-react";

interface TeacherEditDialogProps {
  teacher: TeacherAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherEditDialog({
  teacher,
  open,
  onOpenChange,
}: TeacherEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string | undefined;
    phone: string | undefined;
    subject: string;
    bio: string | undefined;
    grade: number | undefined;
  }>({
    name: teacher?.name || "",
    email: teacher?.email || "",
    phone: teacher?.phone || "",
    subject: teacher?.subject || "",
    bio: teacher?.bio || "",
    grade: teacher?.grade || undefined,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when teacher changes
  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        subject: teacher.subject || "",
        bio: teacher.bio || "",
        grade: teacher.grade || undefined,
      });
    }
  }, [teacher]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    setLoading(true);
    try {
      // Update teacher information in the profiles table
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          bio: formData.bio,
          grade: formData.grade,
        })
        .eq("id", teacher.id);

      if (error) {
        throw error;
      }

      // Update auth user email if needed - this is now commented out since users table was removed
      // We'll keep this logic commented for future reference
      /*
      if (teacher.email !== formData.email && teacher.userId) {
        const { error: userError } = await supabase
          .from('users')
          .update({ email: formData.email })
          .eq('id', teacher.userId);

        if (userError) {
          console.error("Error updating user email:", userError);
        }
      }
      */

      toast({
        title: "Teacher account updated",
        description:
          `${formData.name}'s account has been successfully updated.`,
      });

      // Refresh the teacher accounts data
      queryClient.invalidateQueries({ queryKey: ["teacher-accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-detail", teacher.id],
      });

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the teacher account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
  };

  const handleCopyPassword = async () => {
    if (!newPwd) return;
    try {
      await navigator.clipboard.writeText(newPwd);
      setCopied(true);
      toast({ title: "Copied", description: "Password copied to clipboard." });
      setTimeout(() => setCopied(false), 1500);
    } catch (_err) {
      toast({ title: "Copy failed", description: "Couldn't copy to clipboard.", variant: "destructive" });
    }
  };

  const handlePasswordChange = async () => {
    if (!teacher || !newPwd || newPwd.length < 6) return;
    setChangingPwd(true);
    try {
      const { error } = await supabase.functions.invoke("admin-update-password", {
        body: { userId: teacher.id, newPassword: newPwd },
      });
      if (error) throw new Error(error.message || "Failed to update password");
      toast({ title: "Password updated", description: `Password changed for ${formData.name}` });
      setNewPwd("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Password update failed", description: message, variant: "destructive" });
    } finally {
      setChangingPwd(false);
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
              <Label htmlFor="grade" className="text-right">
                Grade
              </Label>
              <Input
                id="grade"
                name="grade"
                type="number"
                value={formData.grade || ""}
                onChange={handleChange}
                className="col-span-3"
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

            {/* Change Password */}
            <div className="grid grid-cols-4 items-center gap-4 pt-2">
              <Label htmlFor="new-password" className="text-right flex items-center gap-1">
                <KeyRound className="h-4 w-4" /> New Password
              </Label>
              <div className="col-span-3">
                <Input
                  id="new-password"
                  type={showPwd ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setNewPwd(pwd);
                      setShowPwd(true);
                    }}
                  >
                    Generate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                    disabled={!newPwd}
                  >
                    <Copy className="mr-1 h-4 w-4" /> {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPwd((s) => !s)}
                  >
                    {showPwd ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />} {showPwd ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 -mt-2">
              <div className="col-start-2 col-span-3">
                <Button type="button" onClick={handlePasswordChange} disabled={changingPwd || !newPwd || newPwd.length < 6}>
                  {changingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save New Password
                </Button>
              </div>
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
