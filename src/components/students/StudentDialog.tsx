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
  status: "active" | "inactive";
  completed_juz?: number[];
  current_juz?: number | null;
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
  home_address?: string | null;
  health_card_number?: string | null;
  permanent_code?: string | null;
  guardian_phone?: string | null;
  guardian_whatsapp?: string | null;
  preferred_language?: string | null;
  secondary_guardian_name?: string | null;
  secondary_guardian_phone?: string | null;
  secondary_guardian_whatsapp?: string | null;
  secondary_guardian_email?: string | null;
  secondary_guardian_home_address?: string | null;
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
  const [formData, setFormData] = useState({
    name: selectedStudent?.name || "",
    date_of_birth: selectedStudent?.date_of_birth || "",
    enrollment_date: selectedStudent?.enrollment_date ||
      new Date().toISOString().split("T")[0],
    guardian_name: selectedStudent?.guardian_name || "",
    guardian_contact: selectedStudent?.guardian_contact || "",
    status: selectedStudent?.status || "active",
    completed_juz: selectedStudent?.completed_juz || [],
    current_juz: selectedStudent?.current_juz?.toString() || "_none_",
    madrassah_id: selectedStudent?.madrassah_id || madrassahId || "",
    section: selectedStudent?.section || "",
    medicalConditions: selectedStudent?.medical_condition || "",
    home_address: selectedStudent?.home_address || "",
    health_card_number: selectedStudent?.health_card_number || "",
    permanent_code: selectedStudent?.permanent_code || "",
    guardian_phone: selectedStudent?.guardian_phone || "",
    guardian_whatsapp: selectedStudent?.guardian_whatsapp || "",
    preferred_language: selectedStudent?.preferred_language || "",
    secondary_guardian_name: selectedStudent?.secondary_guardian_name || "",
    secondary_guardian_phone: selectedStudent?.secondary_guardian_phone || "",
    secondary_guardian_whatsapp: selectedStudent?.secondary_guardian_whatsapp || "",
    secondary_guardian_email: selectedStudent?.secondary_guardian_email || "",
    secondary_guardian_home_address: selectedStudent?.secondary_guardian_home_address || "",
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
        status: selectedStudent.status || "active",
        completed_juz: selectedStudent.completed_juz || [],
        current_juz: selectedStudent.current_juz?.toString() || "_none_",
        madrassah_id: selectedStudent.madrassah_id || "",
        section: selectedStudent.section || "",
        medicalConditions: selectedStudent.medical_condition || "",
        home_address: selectedStudent.home_address || "",
        health_card_number: selectedStudent.health_card_number || "",
        permanent_code: selectedStudent.permanent_code || "",
        guardian_phone: selectedStudent.guardian_phone || "",
        guardian_whatsapp: selectedStudent.guardian_whatsapp || "",
        preferred_language: selectedStudent.preferred_language || "",
        secondary_guardian_name: selectedStudent.secondary_guardian_name || "",
        secondary_guardian_phone: selectedStudent.secondary_guardian_phone || "",
        secondary_guardian_whatsapp: selectedStudent.secondary_guardian_whatsapp || "",
        secondary_guardian_email: selectedStudent.secondary_guardian_email || "",
        secondary_guardian_home_address: selectedStudent.secondary_guardian_home_address || "",
      });
    } else {
      // Reset form data for new student
      setFormData({
        name: "",
        date_of_birth: "",
        enrollment_date: new Date().toISOString().split("T")[0],
        guardian_name: "",
        guardian_contact: "",
        status: "active",
        completed_juz: [],
        current_juz: "_none_", // Default to special "None" value
        madrassah_id: madrassahId || "",
        section: "",
        medicalConditions: "",
        home_address: "",
        health_card_number: "",
        permanent_code: "",
        guardian_phone: "",
        guardian_whatsapp: "",
        preferred_language: "",
        secondary_guardian_name: "",
        secondary_guardian_phone: "",
        secondary_guardian_whatsapp: "",
        secondary_guardian_email: "",
        secondary_guardian_home_address: "",
      });
    }
  }, [selectedStudent, madrassahId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { medicalConditions, section, ...formDataWithoutMedical } = formData;
      const baseSubmissionData = {
        ...formDataWithoutMedical,
        current_juz: formData.current_juz === "_none_"
          ? null
          : Number(formData.current_juz),
        completed_juz: formData.completed_juz.map((juz) => Number(juz)),
        medical_condition: formData.medicalConditions || null,
      };

      // Teachers cannot modify section assignments
      const submissionData = isTeacher 
        ? baseSubmissionData 
        : { ...baseSubmissionData, section };

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
        const { error } = await supabase
          .from("students")
          .insert([submissionData])
          .select("id");

        if (error) throw error;

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
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="info">Student Info</TabsTrigger>
              <TabsTrigger value="details">Student Details</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="secondary_guardian">Secondary Guardian</TabsTrigger>
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

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="home_address">Home Address</Label>
                <Input
                  id="home_address"
                  placeholder="Enter student's home address"
                  value={formData.home_address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, home_address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health_card_number">Health Card Number</Label>
                <Input
                  id="health_card_number"
                  placeholder="Enter health card number"
                  value={formData.health_card_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, health_card_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permanent_code">Permanent Code</Label>
                <Input
                  id="permanent_code"
                  placeholder="Enter permanent code"
                  value={formData.permanent_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, permanent_code: e.target.value }))}
                />
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
                <Label htmlFor="guardian_phone">Guardian Phone</Label>
                <Input
                  id="guardian_phone"
                  placeholder="Enter guardian's phone number"
                  value={formData.guardian_phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian_phone: e.target.value,
                    }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_whatsapp">Guardian WhatsApp</Label>
                <Input
                  id="guardian_whatsapp"
                  placeholder="Enter guardian's WhatsApp number"
                  value={formData.guardian_whatsapp || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian_whatsapp: e.target.value,
                    }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Input
                  id="preferred_language"
                  placeholder="Enter preferred language"
                  value={formData.preferred_language || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferred_language: e.target.value,
                    }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="secondary_guardian" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secondary_guardian_name">Secondary Guardian Name</Label>
                <Input
                  id="secondary_guardian_name"
                  placeholder="Enter secondary guardian's name"
                  value={formData.secondary_guardian_name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, secondary_guardian_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_guardian_phone">Secondary Guardian Phone</Label>
                <Input
                  id="secondary_guardian_phone"
                  placeholder="Enter secondary guardian's phone number"
                  value={formData.secondary_guardian_phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, secondary_guardian_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_guardian_whatsapp">Secondary Guardian WhatsApp</Label>
                <Input
                  id="secondary_guardian_whatsapp"
                  placeholder="Enter secondary guardian's WhatsApp number"
                  value={formData.secondary_guardian_whatsapp || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, secondary_guardian_whatsapp: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_guardian_email">Secondary Guardian Email</Label>
                <Input
                  id="secondary_guardian_email"
                  placeholder="Enter secondary guardian's email"
                  value={formData.secondary_guardian_email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, secondary_guardian_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_guardian_home_address">Secondary Guardian Home Address</Label>
                <Input
                  id="secondary_guardian_home_address"
                  placeholder="Enter secondary guardian's home address"
                  value={formData.secondary_guardian_home_address || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, secondary_guardian_home_address: e.target.value }))}
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
