import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  guardian_email?: string | null;
  status: "active" | "inactive";
  completed_juz?: number[];
  current_juz?: number | null;
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
}

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  onClose: () => void;
  madrassahId?: string;
  isTeacher?: boolean;
}

export const StudentDialog = (
  { open, onOpenChange, selectedStudent, onClose, madrassahId, isTeacher = false }: StudentDialogProps,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: selectedStudent?.name || "",
    date_of_birth: selectedStudent?.date_of_birth || "",
    enrollment_date: selectedStudent?.enrollment_date ||
      new Date().toISOString().split("T")[0],
    guardian_name: selectedStudent?.guardian_name || "",
    guardian_contact: selectedStudent?.guardian_contact || "",
    guardian_email: selectedStudent?.guardian_email || "",
    status: selectedStudent?.status || "active",
    completed_juz: selectedStudent?.completed_juz || [],
    current_juz: selectedStudent?.current_juz?.toString() || "_none_",
    madrassah_id: selectedStudent?.madrassah_id || madrassahId || "",
    section: selectedStudent?.section || "",
    medicalConditions: selectedStudent?.medical_condition || "",
  });

  // Update form data when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        name: selectedStudent.name || "",
        date_of_birth: selectedStudent.date_of_birth || "",
        enrollment_date: selectedStudent.enrollment_date ||
          new Date().toISOString().split("T")[0],
        guardian_name: selectedStudent.guardian_name || "",
        guardian_contact: selectedStudent.guardian_contact || "",
        guardian_email: selectedStudent.guardian_email || "",
        status: selectedStudent.status || "active",
        completed_juz: selectedStudent.completed_juz || [],
        current_juz: selectedStudent.current_juz?.toString() || "_none_",
        madrassah_id: selectedStudent.madrassah_id || "",
        section: selectedStudent.section || "",
        medicalConditions: selectedStudent.medical_condition || "",
      });
    } else {
      // Reset form data for new student
      setFormData({
        name: "",
        date_of_birth: "",
        enrollment_date: new Date().toISOString().split("T")[0],
        guardian_name: "",
        guardian_contact: "",
        guardian_email: "",
        status: "active",
        completed_juz: [],
        current_juz: "_none_", // Default to special "None" value
        madrassah_id: madrassahId || "",
        section: "",
        medicalConditions: "",
      });
    }
  }, [selectedStudent, madrassahId]);

  // Load available sections for this madrassah (admin view only)
  useEffect(() => {
    const loadSections = async () => {
      try {
        if (isTeacher) return; // Teachers cannot edit sections
        const resolvedMadrassahId = formData.madrassah_id || madrassahId;
        if (!resolvedMadrassahId) return;
        const { data, error } = await supabase
          .from("madrassahs")
          .select("section")
          .eq("id", resolvedMadrassahId)
          .maybeSingle();
        if (error) return;
        const sections = (data?.section as string[] | null) || [];
        setAvailableSections(Array.isArray(sections) ? sections.filter(Boolean) : []);
      } catch (_) {}
    };
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.madrassah_id, madrassahId, isTeacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Basic validation
      if (!formData.name || !formData.name.trim()) {
        throw new Error("Student name is required");
      }

      const { medicalConditions: _medicalConditions, section, ...formDataWithoutMedical } = formData;
      const baseSubmissionData = {
        ...formDataWithoutMedical,
        current_juz: formData.current_juz === "_none_"
          ? null
          : Number(formData.current_juz),
        completed_juz: formData.completed_juz.map((juz) => Number(juz)),
        medical_condition: formData.medicalConditions || null,
        guardian_email: formData.guardian_email || null,
        // Normalize empty strings to null for optional fields
        date_of_birth: formData.date_of_birth || null,
        enrollment_date: formData.enrollment_date || new Date().toISOString().split("T")[0],
      };

      // Teachers cannot modify section assignments
      let submissionData: any = isTeacher 
        ? baseSubmissionData 
        : { ...baseSubmissionData, section: section || null };

      // Ensure madrassah_id is set; resolve from current user profile if missing/empty
      try {
        let effectiveMadrassahId = (formData.madrassah_id && formData.madrassah_id.trim()) ? formData.madrassah_id : null;
        if (!effectiveMadrassahId) {
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth.user?.id;
          if (uid) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("madrassah_id")
              .eq("id", uid)
              .maybeSingle();
            if (profile?.madrassah_id) {
              effectiveMadrassahId = profile.madrassah_id as string;
            }
          }
        }
        if (!effectiveMadrassahId) {
          throw new Error("Could not determine madrassah. Please try reloading or set it manually.");
        }
        submissionData = { ...submissionData, madrassah_id: effectiveMadrassahId };
      } catch (resolveErr: any) {
        console.error("Failed to resolve madrassah_id for student create/update:", resolveErr);
        throw resolveErr instanceof Error ? resolveErr : new Error("Failed to resolve madrassah");
      }

      if (selectedStudent) {
        const { error } = await supabase
          .from("students")
          .update(submissionData)
          .eq("id", selectedStudent.id)
          .select("id");

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        const { data: created, error } = await supabase
          .from("students")
          .insert([submissionData])
          .select("id")
          .single();

        if (error) throw error;

        // Optionally create/link parent account if guardian email is provided
        try {
          const guardianEmail = (formData.guardian_email || "").trim();
          const newStudentId = created?.id as string | undefined;
          if (guardianEmail && newStudentId) {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token || "";
            const { data, error } = await supabase.functions.invoke("create-parent", {
              body: {
                email: guardianEmail,
                name: formData.guardian_name || guardianEmail,
                madrassah_id: submissionData.madrassah_id || null,
                student_ids: [newStudentId],
                phone: formData.guardian_contact || null,
              },
              headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
                apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
            });
            let result = data;
            let err = error as unknown;
            if (!result && err) {
              const token = accessToken;
              const base = (await import("@/integrations/supabase/client.ts")).SUPABASE_URL;
              const resp = await fetch(`${base}/functions/v1/create-parent`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                  apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  email: guardianEmail,
                  name: formData.guardian_name || guardianEmail,
                  madrassah_id: submissionData.madrassah_id || null,
                  student_ids: [newStudentId],
                  phone: formData.guardian_contact || null,
                }),
              });
              result = resp.ok ? await resp.json() : null;
              err = resp.ok ? null : await resp.text();
            }
            console.log("create-parent result:", { data: result, error: err });
            if (result?.credentials) {
              console.log(
                `Parent credentials -> username: ${result.credentials.username}, password: ${result.credentials.password}`,
              );
            }
          }
        } catch (_e) {
          // Non-fatal: ignore parent creation error here
        }

        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["students"] });
      onClose();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "An unknown error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedStudent ? "Edit Student" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info">Student Info</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="quran">Quran Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter student's full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        date_of_birth: e.target.value,
                      }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment_date">Enrollment Date</Label>
                  <Input
                    id="enrollment_date"
                    type="date"
                    value={formData.enrollment_date || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enrollment_date: e.target.value,
                      }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">
                  Section
                  {isTeacher && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Admin only)
                    </span>
                  )}
                </Label>
                {(!isTeacher && availableSections.length > 0) ? (
                  <Select
                    value={formData.section || ""}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, section: value }))
                    }
                  >
                    <SelectTrigger id="section">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((sec) => (
                        <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="section"
                    placeholder={isTeacher ? "Managed by administrator" : "Enter section"}
                    value={formData.section}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        section: e.target.value,
                      }))}
                    disabled={isTeacher}
                    className={isTeacher ? "bg-muted cursor-not-allowed" : ""}
                  />
                )}
                {isTeacher && (
                  <p className="text-xs text-muted-foreground">
                    Section assignments are managed by administrators
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea
                  id="medicalConditions"
                  placeholder="Any medical conditions or allergies that teachers should know about"
                  value={formData.medicalConditions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      medicalConditions: e.target.value,
                    }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="guardian" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guardian_name">Guardian Name</Label>
                <Input
                  id="guardian_name"
                  placeholder="Enter guardian's name"
                  value={formData.guardian_name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian_name: e.target.value,
                    }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_contact">Guardian Contact</Label>
                <Input
                  id="guardian_contact"
                  placeholder="Enter guardian's contact number"
                  value={formData.guardian_contact || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian_contact: e.target.value,
                    }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_email">Guardian Email</Label>
                <Input
                  id="guardian_email"
                  type="email"
                  placeholder="Enter guardian's email address"
                  value={formData.guardian_email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian_email: e.target.value,
                    }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="quran" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_juz">Current Juz</Label>
                <Select
                  value={formData.current_juz}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, current_juz: value }))}
                >
                  <SelectTrigger id="current_juz">
                    <SelectValue placeholder="Select current Juz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">None</SelectItem>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                      <SelectItem key={juz} value={juz.toString()}>
                        Juz {juz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Completed Ajza</Label>
                <div className="grid grid-cols-6 gap-x-4 gap-y-2 rounded-md border p-4">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                    const isCurrentJuz = formData.current_juz !== "_none_" &&
                      parseInt(formData.current_juz) === juz;
                    return (
                      <div
                        key={juz}
                        className={`flex items-center space-x-2 ${
                          isCurrentJuz ? "opacity-50" : ""
                        }`}
                      >
                        <Checkbox
                          id={`juz-${juz}`}
                          checked={formData.completed_juz.includes(juz)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => {
                              const current = prev.completed_juz;
                              const updated = checked
                                ? [...current, juz].sort((a, b) => a - b)
                                : current.filter((j) => j !== juz);
                              return { ...prev, completed_juz: updated };
                            });
                          }}
                          disabled={isCurrentJuz}
                        />
                        <Label
                          htmlFor={`juz-${juz}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Juz {juz}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing..."
                : selectedStudent
                ? "Update Student"
                : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
