import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { DialogFooter } from "@/components/ui/dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { StudentFormData } from "./studentTypes.ts";

interface StudentFormProps {
  initialFormData: StudentFormData;
  onSubmit: (formData: StudentFormData) => void;
  isProcessing: boolean;
  onCancel: () => void;
  isAdmin?: boolean;
}

export const StudentForm = ({
  initialFormData,
  onSubmit,
  isProcessing,
  onCancel,
  isAdmin,
}: StudentFormProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="basic">Student Info</TabsTrigger>
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="guardian">Guardian</TabsTrigger>
          <TabsTrigger value="secondary_guardian">Secondary Guardian</TabsTrigger>
          <TabsTrigger value="quran">Quran Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="studentName"
              placeholder="Enter student's full name"
              value={formData.studentName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  studentName: e.target.value,
                }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrollmentDate">
                Enrollment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="enrollmentDate"
                type="date"
                value={formData.enrollmentDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    enrollmentDate: e.target.value,
                  }))}
                required
              />
            </div>
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

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                placeholder="Enter section"
                value={formData.section || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    section: e.target.value,
                  }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="medicalConditions">Medical Conditions</Label>
            <Textarea
              id="medicalConditions"
              placeholder="Any medical conditions or allergies the teacher should know about"
              value={formData.medicalConditions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  medicalConditions: e.target.value,
                }))}
            />
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
            <Label htmlFor="guardianName">
              Guardian Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guardianName"
              placeholder="Enter guardian's name"
              value={formData.guardianName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  guardianName: e.target.value,
                }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianContact">
              Guardian Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guardianContact"
              placeholder="Enter guardian's phone number"
              value={formData.guardianContact}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  guardianContact: e.target.value,
                }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianEmail">
              Guardian Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guardianEmail"
              type="email"
              placeholder="Enter guardian's email address"
              value={formData.guardianEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  guardianEmail: e.target.value,
                }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_phone">Guardian Phone</Label>
            <Input
              id="guardian_phone"
              placeholder="Enter guardian's phone number"
              value={formData.guardian_phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, guardian_phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_whatsapp">Guardian WhatsApp</Label>
            <Input
              id="guardian_whatsapp"
              placeholder="Enter guardian's WhatsApp number"
              value={formData.guardian_whatsapp}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, guardian_whatsapp: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred_language">Preferred Language</Label>
            <Input
              id="preferred_language"
              placeholder="Enter preferred language"
              value={formData.preferred_language}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, preferred_language: e.target.value }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="secondary_guardian" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secondary_guardian_name">Secondary Guardian Name</Label>
            <Input
              id="secondary_guardian_name"
              placeholder="Enter secondary guardian's name"
              value={formData.secondary_guardian_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, secondary_guardian_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_guardian_phone">Secondary Guardian Phone</Label>
            <Input
              id="secondary_guardian_phone"
              placeholder="Enter secondary guardian's phone number"
              value={formData.secondary_guardian_phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, secondary_guardian_phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_guardian_whatsapp">Secondary Guardian WhatsApp</Label>
            <Input
              id="secondary_guardian_whatsapp"
              placeholder="Enter secondary guardian's WhatsApp number"
              value={formData.secondary_guardian_whatsapp}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, secondary_guardian_whatsapp: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_guardian_email">Secondary Guardian Email</Label>
            <Input
              id="secondary_guardian_email"
              placeholder="Enter secondary guardian's email"
              value={formData.secondary_guardian_email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, secondary_guardian_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_guardian_home_address">Secondary Guardian Home Address</Label>
            <Input
              id="secondary_guardian_home_address"
              placeholder="Enter secondary guardian's home address"
              value={formData.secondary_guardian_home_address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, secondary_guardian_home_address: e.target.value }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="quran" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentJuz">Current Juz</Label>
            <Select
              value={formData.currentJuz}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, currentJuz: value }))}
            >
              <SelectTrigger id="currentJuz">
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
                const isCurrentJuz = formData.currentJuz !== "_none_" &&
                  parseInt(formData.currentJuz) === juz;
                return (
                  <div
                    key={juz}
                    className={`flex items-center space-x-2 ${
                      isCurrentJuz ? "opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      id={`juz-${juz}`}
                      checked={formData.completedJuz.includes(juz)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => {
                          const current = prev.completedJuz;
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

      <DialogFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
        >
          {isProcessing ? "Adding..." : "Add Student"}
        </Button>
      </DialogFooter>
    </form>
  );
};