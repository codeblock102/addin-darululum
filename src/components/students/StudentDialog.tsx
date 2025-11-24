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
import { getErrorMessage } from "@/utils/stringUtils.ts";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  guardian_email?: string | null;
  guardian2_name?: string | null;
  guardian2_contact?: string | null;
  guardian2_email?: string | null;
    status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated";
  status_start_date?: string | null;
  status_end_date?: string | null;
  status_notes?: string | null;
  completed_juz?: number[];
  current_juz?: number | null;
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
  gender?: string | null;
  grade?: string | null;
  health_card?: string | null;
  permanent_code?: string | null;
  street?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
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
  type FormState = {
    name: string;
    date_of_birth: string | null;
    enrollment_date: string | null;
    guardian_name: string | null;
    guardian_contact: string | null;
    guardian_email: string | null;
    guardian2_name: string | null;
    guardian2_contact: string | null;
    guardian2_email: string | null;
    status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated";
    completed_juz: number[];
    current_juz: string;
    madrassah_id: string;
    section: string;
    medicalConditions: string | null;
    status_start_date: string | null;
    status_end_date: string | null;
    status_notes: string | null;
    gender: string | null;
    grade: string | null;
    health_card: string | null;
    permanent_code: string | null;
    street: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
  };

  const [formData, setFormData] = useState<FormState>({
    name: selectedStudent?.name || "",
    date_of_birth: selectedStudent?.date_of_birth || "",
    enrollment_date: selectedStudent?.enrollment_date ||
      new Date().toISOString().split("T")[0],
    gender: selectedStudent?.gender || "",
    grade: selectedStudent?.grade || "",
    health_card: selectedStudent?.health_card || "",
    permanent_code: selectedStudent?.permanent_code || "",
    street: selectedStudent?.street || "",
    city: selectedStudent?.city || "",
    province: selectedStudent?.province || "",
    postal_code: selectedStudent?.postal_code || "",
    guardian_name: selectedStudent?.guardian_name || "",
    guardian_contact: selectedStudent?.guardian_contact || "",
    guardian_email: selectedStudent?.guardian_email || "",
    guardian2_name: selectedStudent?.guardian2_name || "",
    guardian2_contact: selectedStudent?.guardian2_contact || "",
    guardian2_email: selectedStudent?.guardian2_email || "",
    status: selectedStudent?.status || "active",
    completed_juz: selectedStudent?.completed_juz || [],
    current_juz: selectedStudent?.current_juz?.toString() || "_none_",
    madrassah_id: selectedStudent?.madrassah_id || madrassahId || "",
    section: selectedStudent?.section || "",
    medicalConditions: selectedStudent?.medical_condition || "",
    status_start_date: selectedStudent?.status_start_date || null,
    status_end_date: selectedStudent?.status_end_date || null,
    status_notes: selectedStudent?.status_notes || "",
  });

  // Update form data when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        name: selectedStudent.name || "",
        date_of_birth: selectedStudent.date_of_birth || "",
        enrollment_date: selectedStudent.enrollment_date ||
          new Date().toISOString().split("T")[0],
        gender: selectedStudent.gender || "",
        grade: selectedStudent.grade || "",
        health_card: selectedStudent.health_card || "",
        permanent_code: selectedStudent.permanent_code || "",
        street: selectedStudent.street || "",
        city: selectedStudent.city || "",
        province: selectedStudent.province || "",
        postal_code: selectedStudent.postal_code || "",
        guardian_name: selectedStudent.guardian_name || "",
        guardian_contact: selectedStudent.guardian_contact || "",
        guardian_email: selectedStudent.guardian_email || "",
        guardian2_name: selectedStudent.guardian2_name || "",
        guardian2_contact: selectedStudent.guardian2_contact || "",
        guardian2_email: selectedStudent.guardian2_email || "",
        status: selectedStudent.status || "active",
        completed_juz: selectedStudent.completed_juz || [],
        current_juz: selectedStudent.current_juz?.toString() || "_none_",
        madrassah_id: selectedStudent.madrassah_id || "",
        section: selectedStudent.section || "",
        medicalConditions: selectedStudent.medical_condition || "",
        status_start_date: selectedStudent.status_start_date || null,
        status_end_date: selectedStudent.status_end_date || null,
        status_notes: selectedStudent.status_notes || "",
      });
    } else {
      // Reset form data for new student
      setFormData({
        name: "",
        date_of_birth: "",
        enrollment_date: new Date().toISOString().split("T")[0],
        gender: "",
        grade: "",
        health_card: "",
        permanent_code: "",
        street: "",
        city: "",
        province: "",
        postal_code: "",
        guardian_name: "",
        guardian_contact: "",
        guardian_email: "",
        guardian2_name: "",
        guardian2_contact: "",
        guardian2_email: "",
        status: "active",
        completed_juz: [],
        current_juz: "_none_", // Default to special "None" value
        madrassah_id: madrassahId || "",
        section: "",
        medicalConditions: "",
        status_start_date: null,
        status_end_date: null,
        status_notes: "",
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
      } catch (_err) {
        // Non-fatal; leave sections empty on error
      }
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
        // Map secondary guardian fields to actual DB columns
        secondary_guardian_name: formData.guardian2_name || null,
        secondary_guardian_phone: formData.guardian2_contact || null,
        secondary_guardian_whatsapp: formData.guardian2_email || null,
        // Normalize empty strings to null for optional fields
        date_of_birth: formData.date_of_birth || null,
        enrollment_date: formData.enrollment_date || new Date().toISOString().split("T")[0],
        gender: (formData as any).gender || null,
        grade: (formData as any).grade || null,
        health_card: (formData as any).health_card || null,
        permanent_code: (formData as any).permanent_code || null,
        street: (formData as any).street || null,
        city: (formData as any).city || null,
        province: (formData as any).province || null,
        postal_code: (formData as any).postal_code || null,
        status: formData.status,
        status_start_date: formData.status_start_date || null,
        status_end_date: formData.status_end_date || null,
        status_notes: formData.status_notes || null,
      } as Record<string, unknown>;

      // Teachers cannot modify section assignments
      let submissionData: Record<string, unknown> = isTeacher 
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
      } catch (resolveErr: unknown) {
        console.error("Failed to resolve madrassah_id for student create/update:", resolveErr);
        throw resolveErr instanceof Error ? resolveErr : new Error("Failed to resolve madrassah");
      }

      if (selectedStudent) {
        // Update with graceful fallback if guardian2_* columns are missing in DB
        let updateError: unknown | null = null;
        try {
          const { error } = await supabase
            .from("students")
            .update(submissionData)
            .eq("id", selectedStudent.id)
            .select("id");
          updateError = error;
          if (error) throw error;
        } catch (err) {
          const msg = getErrorMessage(err, "");
          if (/guardian2_/i.test(msg) || /secondary_guardian_/i.test(msg) || /column .* does not exist/i.test(msg)) {
            const { guardian2_name: _gn, guardian2_contact: _gc, guardian2_email: _ge, secondary_guardian_name: _sgn, secondary_guardian_phone: _sgp, secondary_guardian_whatsapp: _sgw, ...cleaned } = submissionData as Record<string, unknown>;
            const { error: retryError } = await supabase
              .from("students")
              .update(cleaned)
              .eq("id", selectedStudent.id)
              .select("id");
            if (retryError) throw retryError;
          } else {
            throw err;
          }
        }

        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        // Insert with graceful fallback if guardian2_* columns are missing in DB
        let created: { id: string } | null = null;
        try {
          const { data, error } = await supabase
            .from("students")
            .insert([submissionData])
            .select("id")
            .single();
          if (error) throw error;
          created = data as { id: string } | null;
        } catch (err) {
          const msg = getErrorMessage(err, "");
          if (/guardian2_/i.test(msg) || /secondary_guardian_/i.test(msg) || /column .* does not exist/i.test(msg)) {
            const { guardian2_name: _gn, guardian2_contact: _gc, guardian2_email: _ge, secondary_guardian_name: _sgn, secondary_guardian_phone: _sgp, secondary_guardian_whatsapp: _sgw, ...cleaned } = submissionData as Record<string, unknown>;
            const { data, error: retryError } = await supabase
              .from("students")
              .insert([cleaned])
              .select("id")
              .single();
            if (retryError) throw retryError;
            created = data as { id: string } | null;
          } else {
            throw err;
          }
        }

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
            let err: unknown = error;
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
      const message = getErrorMessage(error, "Failed to save student");
      console.error("Student create/update failed:", error);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900 border border-gray-200 shadow-2xl dark:bg-slate-900 dark:text-white dark:border-slate-700">
        <DialogHeader>
          <DialogTitle>
            {selectedStudent ? "Edit Student" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="info">Student Info</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
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
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    placeholder="Enter grade"
                    value={formData.grade || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, grade: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="health_card">Health Card</Label>
                  <Input
                    id="health_card"
                    placeholder="Enter health card number"
                    value={formData.health_card || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, health_card: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permanent_code">Permanent Code</Label>
                  <Input
                    id="permanent_code"
                    placeholder="Enter permanent code"
                    value={formData.permanent_code || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, permanent_code: e.target.value }))}
                  />
                </div>
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
                  value={formData.medicalConditions || ""}
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
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="hospitalized">Hospitalized</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Status Fields */}
              {(formData.status === "vacation" || formData.status === "hospitalized" || formData.status === "suspended") && (
                <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status_start_date">
                        Start Date
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="status_start_date"
                        type="date"
                        value={formData.status_start_date || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status_start_date: e.target.value,
                          }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status_end_date">End Date (Optional)</Label>
                      <Input
                        id="status_end_date"
                        type="date"
                        value={formData.status_end_date || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status_end_date: e.target.value,
                          }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_notes">Status Notes / Reason</Label>
                    <Textarea
                      id="status_notes"
                      placeholder={`Enter details for ${formData.status}...`}
                      value={formData.status_notes || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status_notes: e.target.value,
                        }))}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    placeholder="Enter street address"
                    value={formData.street || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    placeholder="Enter province/state"
                    value={formData.province || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    placeholder="Enter postal code"
                    value={formData.postal_code || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="guardian2_name">Secondary Guardian Name</Label>
                  <Input
                    id="guardian2_name"
                    placeholder="Enter secondary guardian's name"
                    value={formData.guardian2_name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardian2_name: e.target.value,
                      }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian2_contact">Secondary Guardian Contact</Label>
                  <Input
                    id="guardian2_contact"
                    placeholder="Enter secondary guardian's contact number"
                    value={formData.guardian2_contact || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardian2_contact: e.target.value,
                      }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian2_email">Secondary Guardian Email</Label>
                  <Input
                    id="guardian2_email"
                    type="email"
                    placeholder="Enter secondary guardian's email address"
                    value={formData.guardian2_email || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardian2_email: e.target.value,
                      }))}
                  />
                </div>
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
