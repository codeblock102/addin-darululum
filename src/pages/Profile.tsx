import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Loader2, Save, KeyRound, User, Phone, Mail, BookOpen, ShieldCheck } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  parent: "Parent",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  teacher: "bg-emerald-100 text-emerald-700",
  parent: "bg-blue-100 text-blue-700",
};

export default function Profile() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, bio, role, section, subject")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const [form, setForm] = useState<{
    name: string;
    phone: string;
    bio: string;
  } | null>(null);

  // Initialize form once profile loads
  if (profile && form === null) {
    setForm({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (values: { name: string; phone: string; bio: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          name: values.name,
          phone: values.phone || null,
          bio: values.bio || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your password has been changed." });
    } catch (err: unknown) {
      toast({
        title: "Password change failed",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?";

  const role = profile?.role ?? "teacher";

  if (isLoading || form === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and account security.</p>
      </div>

      {/* Identity Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"}`}>
              {role === "admin" ? <ShieldCheck className="h-7 w-7" /> : initials}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{profile?.name ?? "—"}</p>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
              <Badge variant="outline" className={`mt-1 text-xs font-medium border-0 ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"}`}>
                {ROLE_LABELS[role] ?? role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your display name, phone number, and bio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              Email
            </Label>
            <Input id="email" value={session?.user?.email ?? ""} disabled className="bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-400">Email is managed by your account login and cannot be changed here.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              Phone
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="A short description about yourself..."
              rows={3}
              className="resize-none"
            />
          </div>

          {(profile?.subject || profile?.section) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {profile.subject && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                      Subject
                    </Label>
                    <Input value={profile.subject} disabled className="bg-gray-50 text-gray-500" />
                  </div>
                )}
                {profile.section && (
                  <div className="space-y-1.5">
                    <Label>Section</Label>
                    <Input value={profile.section} disabled className="bg-gray-50 text-gray-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">Subject and section are set by your admin.</p>
            </>
          )}

          <div className="pt-2">
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Save Changes</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gray-500" />
            Change Password
          </CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          <div className="pt-2">
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              variant="outline"
              className="border-gray-300"
            >
              {isChangingPassword ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
              ) : (
                <><KeyRound className="mr-2 h-4 w-4" />Update Password</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
