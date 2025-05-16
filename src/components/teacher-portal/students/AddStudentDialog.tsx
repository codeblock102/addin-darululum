
import { useState, useEffect } from "react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AddStudentDialogProps {
  teacherId: string;
}

export const AddStudentDialog = ({ teacherId }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    studentName: "",
    dateOfBirth: "",
    enrollmentDate: new Date().toISOString().split('T')[0],
    guardianName: "",
    guardianContact: "",
    status: "active" as "active" | "inactive",
    completedJuz: [] as number[],
    currentJuz: "_none_"
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      if (!formData.studentName.trim()) {
        throw new Error("Student name is required");
      }
      
      // First, check if the student exists in students table
      const { data: existingStudent, error: lookupError } = await supabase
        .from('students')
        .select('id, name')
        .eq('name', formData.studentName)
        .maybeSingle();
        
      let studentId;
      
      if (lookupError) throw lookupError;
      
      // Map the completed Juz to numbers
      const completedJuz = formData.completedJuz.map(juz => Number(juz));
      
      // If student doesn't exist, create them
      if (!existingStudent) {
        // Create the student with all the form data
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({ 
            name: formData.studentName,
            enrollment_date: formData.enrollmentDate,
            date_of_birth: formData.dateOfBirth || null,
            guardian_name: formData.guardianName || null,
            guardian_contact: formData.guardianContact || null,
            status: formData.status,
            current_juz: formData.currentJuz === "_none_" ? null : Number(formData.currentJuz),
            completed_juz: completedJuz
          })
          .select('id')
          .single();
          
        if (createError) throw createError;
        studentId = newStudent.id;
      } else {
        // Update existing student with new information
        const { error: updateError } = await supabase
          .from('students')
          .update({
            date_of_birth: formData.dateOfBirth || null,
            guardian_name: formData.guardianName || null,
            guardian_contact: formData.guardianContact || null,
            status: formData.status,
            current_juz: formData.currentJuz === "_none_" ? null : Number(formData.currentJuz),
            completed_juz: completedJuz
          })
          .eq('id', existingStudent.id);
          
        if (updateError) throw updateError;
        studentId = existingStudent.id;
      }
      
      // Now assign student to teacher
      const { error: assignmentError } = await supabase
        .from('students_teachers')
        .insert({
          teacher_id: teacherId,
          student_name: formData.studentName,
          active: true
        });
        
      if (assignmentError) throw assignmentError;
      
      toast({
        title: "Student Added",
        description: `${formData.studentName} has been added to your students.`
      });
      
      // Reset form and close dialog
      setFormData({
        studentName: "",
        dateOfBirth: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        guardianName: "",
        guardianContact: "",
        status: "active",
        completedJuz: [],
        currentJuz: "_none_"
      });
      setActiveTab("basic");
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student details below. You can add more information in the different tabs.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Student Info</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="quran">Quran Progress</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="studentName"
                  placeholder="Enter student's full name"
                  value={formData.studentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enrollmentDate">Enrollment Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={formData.enrollmentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}
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
                <Label htmlFor="guardianName">Guardian Name</Label>
                <Input
                  id="guardianName"
                  placeholder="Enter guardian's name"
                  value={formData.guardianName}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guardianContact">Guardian Contact</Label>
                <Input
                  id="guardianContact"
                  placeholder="Enter guardian's contact number"
                  value={formData.guardianContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardianContact: e.target.value }))}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="quran" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentJuz">Current Juz</Label>
                <Select 
                  value={formData.currentJuz}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currentJuz: value }))}
                >
                  <SelectTrigger id="currentJuz">
                    <SelectValue placeholder="Select current Juz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">None</SelectItem>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
                      <SelectItem key={juz} value={juz.toString()}>Juz {juz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Completed Ajza</Label>
                <div className="grid grid-cols-6 gap-x-4 gap-y-2 rounded-md border p-4">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => {
                    const isCurrentJuz = formData.currentJuz !== "_none_" && parseInt(formData.currentJuz) === juz;
                    return (
                      <div key={juz} className={`flex items-center space-x-2 ${isCurrentJuz ? 'opacity-50' : ''}`}>
                        <Checkbox
                          id={`juz-${juz}`}
                          checked={formData.completedJuz.includes(juz)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => {
                              const current = prev.completedJuz;
                              const updated = checked
                                ? [...current, juz].sort((a,b) => a-b)
                                : current.filter(j => j !== juz);
                              return { ...prev, completedJuz: updated };
                            });
                          }}
                          disabled={isCurrentJuz}
                        />
                        <Label htmlFor={`juz-${juz}`} className="text-sm font-medium leading-none cursor-pointer">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
