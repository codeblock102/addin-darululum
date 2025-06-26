import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { StudentFormData } from "./studentTypes";

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
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="basic">Student Info</TabsTrigger>
          <TabsTrigger value="guardian">Guardian</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">
              Emergency Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyContactName"
              placeholder="Enter emergency contact's name"
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
            <Label htmlFor="emergencyContactPhone">
              Emergency Contact Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyContactPhone"
              placeholder="Enter emergency contact's phone number"
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
                          return { ...prev, completedJuz: updated };
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
