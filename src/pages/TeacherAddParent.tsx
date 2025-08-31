import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";

interface StudentOption {
  id: string;
  name: string;
}

const TeacherAddParent = () => {
  const { toast } = useToast();
  const { isTeacher, isParent, isAdmin } = useRBAC();
  const { children } = useParentChildren();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [form, setForm] = useState({ email: "", name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (isParent && !isTeacher && !isAdmin) {
          const opts = (children || []).map((c) => ({ id: c.id, name: c.name }));
          setStudents(opts);
          if (opts[0]) setSelectedStudentId(opts[0].id);
          return;
        }
        // Teacher/admin: load via assignment table (teacher) or all students (admin minimal)
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("students_teachers")
          .select("student_name")
          .eq("teacher_id", uid);
        if (error) throw error;
        const names = Array.from(new Set((data || []).map((r: { student_name: string }) => r.student_name).filter(Boolean)));
        if (names.length === 0) return;
        const { data: studs, error: sErr } = await supabase
          .from("students")
          .select("id, name")
          .in("name", names);
        if (sErr) throw sErr;
        const opts = (studs || []).map((s) => ({ id: s.id as string, name: s.name as string }));
        setStudents(opts);
        if (opts[0]) setSelectedStudentId(opts[0].id);
      } catch (_e) {
        // non-fatal
      }
    })();
  }, [isParent, isTeacher, isAdmin, children]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    const name = (form.name || email).trim();
    const phone = form.phone.trim() || null;
    if (!email || !selectedStudentId) {
      toast({ title: "Missing info", description: "Select a student and enter email.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      const body = { email, name, phone, madrassah_id: null, student_ids: [selectedStudentId] };
      const { data, error } = await supabase.functions.invoke("create-parent", {
        body,
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });
      let result = data;
      let err = error as unknown;
      if (!result && err) {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-parent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(body),
        });
        result = resp.ok ? await resp.json() : null;
        err = resp.ok ? null : await resp.text();
      }
      if (result && !err) {
        toast({ title: "Parent added", description: `Linked ${email} to student.` });
        setForm({ email: "", name: "", phone: "" });
      } else {
        throw new Error(typeof err === "string" ? err : "Failed to add parent");
      }
    } catch (ex) {
      toast({ title: "Error", description: ex instanceof Error ? ex.message : String(ex), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card>
        <CardHeader>
          <CardTitle>Add Parent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.length > 1 && (
                <div>
                  <label className="text-sm block mb-1">Student</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm block mb-1">Parent Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Full Name (optional)</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Parent Name"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Phone (optional)</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="555-555-5555"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Parent"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAddParent;


