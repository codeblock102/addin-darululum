
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface AddStudentDialogProps {
  teacherId: string;
}

export const AddStudentDialog = ({ teacherId }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    studentName: "",
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      if (!formData.studentName.trim()) {
        throw new Error("Student name is required");
      }
      
      // First, create or check if the student exists in students table
      const { data: existingStudent, error: lookupError } = await supabase
        .from('students')
        .select('id, name')
        .eq('name', formData.studentName)
        .maybeSingle();
        
      let studentId;
      
      if (lookupError) throw lookupError;
      
      // If student doesn't exist, create them
      if (!existingStudent) {
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert([{ 
            name: formData.studentName,
            enrollment_date: new Date().toISOString().split('T')[0]
          }])
          .select('id')
          .single();
          
        if (createError) throw createError;
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }
      
      // Now assign student to teacher
      const { error: assignmentError } = await supabase
        .from('students_teachers')
        .insert([{
          teacher_id: teacherId,
          student_name: formData.studentName,
          active: true
        }]);
        
      if (assignmentError) throw assignmentError;
      
      toast({
        title: "Student Added",
        description: `${formData.studentName} has been added to your students.`
      });
      
      // Reset form and close dialog
      setFormData({ studentName: "" });
      setOpen(false);
      
      // Refresh queries to show the new student
      queryClient.invalidateQueries({ queryKey: ['teacher-assigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students-details'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-student-assignments'] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      console.error("Failed to add student:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              placeholder="Enter student's full name"
              value={formData.studentName}
              onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
