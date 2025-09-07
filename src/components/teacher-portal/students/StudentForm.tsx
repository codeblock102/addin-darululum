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
import { useI18n } from "@/contexts/I18nContext.tsx";

interface StudentFormProps {
  initialFormData: StudentFormData;
  onSubmit: (formData: StudentFormData) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

export const StudentForm = ({
  initialFormData,
  onSubmit,
  isProcessing,
  onCancel,
}: StudentFormProps) => {
  const { t } = useI18n();
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
          <TabsTrigger value="basic">{t("pages.teacherPortal.students.form.tabs.basic", "Student Info")}</TabsTrigger>
          <TabsTrigger value="guardian">{t("pages.teacherPortal.students.form.tabs.guardian", "Guardian")}</TabsTrigger>
          <TabsTrigger value="emergency">{t("pages.teacherPortal.students.form.tabs.emergency", "Emergency")}</TabsTrigger>
          <TabsTrigger value="address">{t("pages.teacherPortal.students.form.tabs.address", "Address")}</TabsTrigger>
          <TabsTrigger value="quran">{t("pages.teacherPortal.students.form.tabs.quran", "Quran Progress")}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">{t("pages.teacherPortal.students.form.fullName", "Full Name")} <span className="text-red-500">*</span></Label>
            <Input
              id="studentName"
              placeholder={t("pages.teacherPortal.students.form.fullNamePlaceholder", "Enter student's full name")}
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
              <Label htmlFor="dateOfBirth">{t("pages.teacherPortal.students.form.dob", "Date of Birth")}</Label>
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
              <Label htmlFor="enrollmentDate">{t("pages.teacherPortal.students.form.enrollmentDate", "Enrollment Date")} <span className="text-red-500">*</span></Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">{t("pages.teacherPortal.students.form.gender", "Gender")}</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t("pages.teacherPortal.students.form.genderPlaceholder", "Select gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("common.male", "Male")}</SelectItem>
                  <SelectItem value="female">{t("common.female", "Female")}</SelectItem>
                  <SelectItem value="other">{t("common.other", "Other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">{t("pages.teacherPortal.students.form.grade", "Grade")}</Label>
              <Input
                id="grade"
                placeholder={t("pages.teacherPortal.students.form.gradePlaceholder", "Enter grade")}
                value={formData.grade}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    grade: e.target.value,
                  }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("pages.teacherPortal.students.table.status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") =>
                setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t("pages.teacherPortal.students.form.statusPlaceholder", "Select status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("pages.teacherPortal.students.statusActive")}</SelectItem>
                <SelectItem value="inactive">{t("pages.teacherPortal.students.statusInactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="healthCard">{t("pages.teacherPortal.students.form.healthCard", "Health Card")}</Label>
              <Input
                id="healthCard"
                placeholder={t("pages.teacherPortal.students.form.healthCardPlaceholder", "Enter health card number")}
                value={formData.healthCard}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    healthCard: e.target.value,
                  }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permanentCode">{t("pages.teacherPortal.students.form.permanentCode", "Permanent Code")}</Label>
              <Input
                id="permanentCode"
                placeholder={t("pages.teacherPortal.students.form.permanentCodePlaceholder", "Enter permanent code")}
                value={formData.permanentCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    permanentCode: e.target.value,
                  }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalConditions">{t("pages.teacherPortal.students.form.medical", "Medical Conditions")}</Label>
            <Textarea
              id="medicalConditions"
              placeholder={t("pages.teacherPortal.students.form.medicalPlaceholder", "Any medical conditions or allergies the teacher should know about")}
              value={formData.medicalConditions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  medicalConditions: e.target.value,
                }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="guardian" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardianName">{t("pages.teacherPortal.students.form.guardianName", "Guardian Name")} <span className="text-red-500">*</span></Label>
            <Input
              id="guardianName"
              placeholder={t("pages.teacherPortal.students.form.guardianNamePlaceholder", "Enter guardian's name")}
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
            <Label htmlFor="guardianContact">{t("pages.teacherPortal.students.form.guardianPhone", "Guardian Phone")} <span className="text-red-500">*</span></Label>
            <Input
              id="guardianContact"
              placeholder={t("pages.teacherPortal.students.form.guardianPhonePlaceholder", "Enter guardian's phone number")}
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
            <Label htmlFor="guardianEmail">{t("pages.teacherPortal.students.form.guardianEmail", "Guardian Email")} <span className="text-red-500">*</span></Label>
            <Input
              id="guardianEmail"
              type="email"
              placeholder={t("pages.teacherPortal.students.form.guardianEmailPlaceholder", "Enter guardian's email address")}
              value={formData.guardianEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  guardianEmail: e.target.value,
                }))}
              required
            />
          </div>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="street">{t("pages.teacherPortal.students.form.street", "Street")}</Label>
              <Input
                id="street"
                placeholder={t("pages.teacherPortal.students.form.streetPlaceholder", "Enter street address")}
                value={formData.street}
                onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t("pages.teacherPortal.students.form.city", "City")}</Label>
              <Input
                id="city"
                placeholder={t("pages.teacherPortal.students.form.cityPlaceholder", "Enter city")}
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">{t("pages.teacherPortal.students.form.province", "Province")}</Label>
              <Input
                id="province"
                placeholder={t("pages.teacherPortal.students.form.provincePlaceholder", "Enter province/state")}
                value={formData.province}
                onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{t("pages.teacherPortal.students.form.postalCode", "Postal Code")}</Label>
              <Input
                id="postalCode"
                placeholder={t("pages.teacherPortal.students.form.postalCodePlaceholder", "Enter postal code")}
                value={formData.postalCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">{t("pages.teacherPortal.students.form.emergencyName", "Emergency Contact Name")} <span className="text-red-500">*</span></Label>
            <Input
              id="emergencyContactName"
              placeholder={t("pages.teacherPortal.students.form.emergencyNamePlaceholder", "Enter emergency contact's name")}
              value={formData.emergencyContactName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  emergencyContactName: e.target.value,
                }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">{t("pages.teacherPortal.students.form.emergencyPhone", "Emergency Contact Phone")} <span className="text-red-500">*</span></Label>
            <Input
              id="emergencyContactPhone"
              placeholder={t("pages.teacherPortal.students.form.emergencyPhonePlaceholder", "Enter emergency contact's phone number")}
              value={formData.emergencyContactPhone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  emergencyContactPhone: e.target.value,
                }))}
              required
            />
          </div>
        </TabsContent>

        <TabsContent value="quran" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentJuz">{t("pages.teacherPortal.students.form.currentJuz", "Current Juz")}</Label>
            <Select
              value={formData.currentJuz}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, currentJuz: value }))}
            >
              <SelectTrigger id="currentJuz">
                <SelectValue placeholder={t("pages.teacherPortal.students.form.currentJuzPlaceholder", "Select current Juz")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">{t("pages.teacherPortal.students.form.none", "None")}</SelectItem>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                  <SelectItem key={juz} value={juz.toString()}>
                    {t("pages.teacherPortal.students.form.juz", "Juz")} {juz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("pages.teacherPortal.students.form.completedAjza", "Completed Ajza")}</Label>
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
                          return { ...prev, completedJuz: updated };
                        });
                      }}
                      disabled={isCurrentJuz}
                    />
                    <Label
                      htmlFor={`juz-${juz}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {t("pages.teacherPortal.students.form.juz", "Juz")} {juz}
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
          {t("pages.teacherPortal.students.form.cancel", "Cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
        >
          {isProcessing ? t("pages.teacherPortal.students.mobile.adding") : t("pages.teacherPortal.students.table.add")}
        </Button>
      </DialogFooter>
    </form>
  );
};
