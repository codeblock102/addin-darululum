import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { createParentWithAccount, linkParentToStudents } from "@/utils/createParentAccount.ts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

const ParentAccounts = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["all-students-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: parents } = useQuery({
    queryKey: ["all-parents-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parents")
        .select("id, name, email, student_ids")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const [parentSearch, setParentSearch] = useState("");
  type ParentMin = { id: string; name: string; email: string; student_ids: string[] };
  type StudentMin = { id: string; name: string };

  const filteredParents = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    if (!q) return parents || [];
    return (parents || []).filter((p: ParentMin) =>
      (p.name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q)
    );
  }, [parents, parentSearch]);

  const [selectedExistingParentId, setSelectedExistingParentId] = useState<string>("");
  const [linkStudentIds, setLinkStudentIds] = useState<string[]>([]);
  const [linkIsSubmitting, setLinkIsSubmitting] = useState(false);

  // Password change dialog state for parents
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [pwdTargetParent, setPwdTargetParent] = useState<ParentMin | null>(null);
  const [newParentPassword, setNewParentPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => prev.includes(id)
      ? prev.filter((s) => s !== id)
      : [...prev, id]);
  };

  const toggleLinkStudent = (id: string) => {
    setLinkStudentIds((prev) => prev.includes(id)
      ? prev.filter((s) => s !== id)
      : [...prev, id]);
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      if (!name || !email || !password) {
        toast({ title: "Missing fields", description: "Name, email and password are required", variant: "destructive" });
        return;
      }
      toast({ title: "Creating parent...", description: "Please wait while we create the parent account." });
      const res = await createParentWithAccount({ name, email, password, phone, address, studentIds: selectedStudentIds });
      if (!res.success || !res.parentProfileId) {
        toast({ title: "Failed", description: res.message, variant: "destructive" });
        return;
      }
      if (selectedStudentIds.length > 0) {
        const linkRes = await linkParentToStudents(res.parentProfileId, selectedStudentIds);
        if (!linkRes.success) {
          toast({ title: "Link Failed", description: linkRes.message, variant: "destructive" });
          return;
        }
      }
      toast({ title: "Parent Created", description: "Parent account and links saved" });
      setName(""); setEmail(""); setPassword(""); setPhone(""); setAddress(""); setSelectedStudentIds([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExisting = async () => {
    try {
      setLinkIsSubmitting(true);
      if (!selectedExistingParentId) {
        toast({ title: "Select a parent", description: "Please choose an existing parent to link.", variant: "destructive" });
        return;
      }
      if (linkStudentIds.length === 0) {
        toast({ title: "Select students", description: "Choose at least one student to link.", variant: "destructive" });
        return;
      }
      // Fetch existing student_ids to merge (avoid overwriting unintentionally)
      const { data: existing } = await supabase
        .from("parents")
        .select("student_ids")
        .eq("id", selectedExistingParentId)
        .maybeSingle();
      const existingIds: string[] = Array.isArray(existing?.student_ids) ? existing!.student_ids : [];
      const merged = Array.from(new Set([...(existingIds || []), ...linkStudentIds]));

      const res = await linkParentToStudents(selectedExistingParentId, merged);
      if (!res.success) {
        toast({ title: "Link Failed", description: res.message, variant: "destructive" });
        return;
      }
      toast({ title: "Linked", description: "Parent was linked to selected students." });
      setSelectedExistingParentId("");
      setLinkStudentIds([]);
      setParentSearch("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLinkIsSubmitting(false);
    }
  };

  const openPasswordDialogFor = (parent: ParentMin) => {
    setPwdTargetParent(parent);
    setNewParentPassword("");
    setPwdDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!pwdTargetParent) return;
    if (!newParentPassword || newParentPassword.length < 6) {
      toast({ title: "Invalid password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.functions.invoke("admin-update-password", {
        body: { userId: pwdTargetParent.id, newPassword: newParentPassword },
      });
      if (error) {
        toast({ title: "Password update failed", description: (error as Error).message, variant: "destructive" });
        return;
      }
      toast({ title: "Password updated", description: `Password changed for ${pwdTargetParent.name}` });
      setPwdDialogOpen(false);
      setNewParentPassword("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Password update failed", description: msg, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="link">Link</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Parent Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent Name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" type="email" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(xxx) xxx-xxxx" />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Postal Code" />
                </div>
              </div>

              <div>
                <Label>Select Children</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {(students || []).map((s: StudentMin) => (
                    <label key={s.id} className={`p-2 rounded border cursor-pointer flex items-center gap-2 ${selectedStudentIds.includes(s.id) ? 'bg-primary text-primary-foreground' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleCreate} disabled={isSubmitting}>Create Parent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card>
            <CardHeader>
              <CardTitle>Link Existing Parent to Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Find Parent</Label>
                  <Input value={parentSearch} onChange={(e) => setParentSearch(e.target.value)} placeholder="Search by name or email" />
                  <div className="mt-2 max-h-56 overflow-auto rounded border">
                    {(filteredParents || []).map((p: ParentMin) => (
                      <label key={p.id} className={`flex items-center justify-between px-3 py-2 border-b last:border-0 cursor-pointer ${selectedExistingParentId === p.id ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="existing-parent"
                            checked={selectedExistingParentId === p.id}
                            onChange={() => setSelectedExistingParentId(p.id)}
                          />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm text-muted-foreground">{p.email}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">Children: {(p.student_ids || []).length}</div>
                      </label>
                    ))}
                    {filteredParents && filteredParents.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No parents found.</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Selected Parent</Label>
                  <Input value={(filteredParents || []).find((p: ParentMin) => p.id === selectedExistingParentId)?.email || ''} readOnly placeholder="No parent selected" />
                </div>
              </div>

              <div>
                <Label>Select Children</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {(students || []).map((s: StudentMin) => (
                    <label key={s.id} className={`p-2 rounded border cursor-pointer flex items-center gap-2 ${linkStudentIds.includes(s.id) ? 'bg-primary text-primary-foreground' : ''}`}>
                      <input
                        type="checkbox"
                        checked={linkStudentIds.includes(s.id)}
                        onChange={() => toggleLinkStudent(s.id)}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleLinkExisting} disabled={linkIsSubmitting}>Link Parent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Existing Parents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Search</Label>
                <Input value={parentSearch} onChange={(e) => setParentSearch(e.target.value)} placeholder="Search by name or email" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(filteredParents || []).map((p: ParentMin) => (
                  <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.email}</div>
                      <div className="text-xs text-muted-foreground">Children: {(p.student_ids || []).length}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => openPasswordDialogFor(p)}>Change Password</Button>
                    </div>
                  </div>
                ))}
                {filteredParents && filteredParents.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No parents found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <AlertDialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              {pwdTargetParent ? `Set a new password for ${pwdTargetParent.name}.` : "Set a new password."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <input
              type="password"
              value={newParentPassword}
              onChange={(e) => setNewParentPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewParentPassword("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} className="bg-amber-600 hover:bg-amber-700" disabled={isChangingPassword}>
              {isChangingPassword ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ParentAccounts;


