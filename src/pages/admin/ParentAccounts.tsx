import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { createParentWithAccount, linkParentToStudents } from "@/utils/createParentAccount.ts";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ParentAccounts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => prev.includes(id)
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

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-[hsl(142.8,64.2%,24.1%)] border-[hsl(142.8,64.2%,24.1%)] hover:bg-[hsl(142.8,64.2%,24.1%)] hover:text-white transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

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
              {(students || []).map((s: any) => (
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
    </div>
  );
};

export default ParentAccounts;


