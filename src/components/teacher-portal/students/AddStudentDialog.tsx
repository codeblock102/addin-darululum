import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button.tsx";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { StudentForm } from "./StudentForm.tsx";
import { useStudentSubmit } from "./useStudentSubmit.ts";
import { StudentFormData } from "./studentTypes.ts";
import { useUserRole } from "@/hooks/useUserRole.ts";

interface AddStudentDialogProps {
  teacherId: string;
}

export const AddStudentDialog = ({ teacherId }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();

  const [formData, setFormData] = useState<StudentFormData>({
    studentName: "",
    dateOfBirth: "",
    enrollmentDate: new Date().toISOString().split("T")[0],
    guardianName: "",
    guardianContact: "",
    guardianEmail: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalConditions: "",
    status: "active",
    completedJuz: [],
    currentJuz: "_none_",
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
    section: "",
  });

  const { handleSubmit, isProcessing } = useStudentSubmit({
    teacherId,
    onSuccess: () => {
      toast({
        title: "Student Added",
        description: `The student has been added to your students.`,
      });
      setOpen(false);

      // Refresh queries to show the new student
      queryClient.invalidateQueries({
        queryKey: ["teacher-assigned-students"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      
      // Invalidate all student-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ["students-for-user"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-search"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-students"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      queryClient.invalidateQueries({ queryKey: ["students-for-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-progress"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-list"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-selector"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-bulk"] });
      queryClient.invalidateQueries({ queryKey: ["students-search"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student details below. You can add more information in the
            different tabs.
          </DialogDescription>
        </DialogHeader>

        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              placeholder="Enter section"
              value={formData.section}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, section: e.target.value }))
              }
            />
          </div>
        )}

        <StudentForm
          initialFormData={formData}
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          onCancel={() => setOpen(false)}
          isAdmin={isAdmin}
        />
      </DialogContent>
    </Dialog>
  );
};
