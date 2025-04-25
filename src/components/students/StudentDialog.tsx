
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

interface StudentDialogProps {
  selectedStudent: Student | null;
  onClose: () => void;
}

export const StudentDialog = ({ selectedStudent, onClose }: StudentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: selectedStudent?.name || "",
    date_of_birth: selectedStudent?.date_of_birth || "",
    enrollment_date: selectedStudent?.enrollment_date || new Date().toISOString().split('T')[0],
    guardian_name: selectedStudent?.guardian_name || "",
    guardian_contact: selectedStudent?.guardian_contact || "",
    status: selectedStudent?.status || "active",
  });

  // Update form data when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        name: selectedStudent.name || "",
        date_of_birth: selectedStudent.date_of_birth || "",
        enrollment_date: selectedStudent.enrollment_date || new Date().toISOString().split('T')[0],
        guardian_name: selectedStudent.guardian_name || "",
        guardian_contact: selectedStudent.guardian_contact || "",
        status: selectedStudent.status || "active",
      });
    }
  }, [selectedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (selectedStudent) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', selectedStudent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('students')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {selectedStudent ? "Edit Student" : "Add New Student"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter student's full name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="enrollment_date">Enrollment Date</Label>
          <Input
            id="enrollment_date"
            type="date"
            value={formData.enrollment_date || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, enrollment_date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian_name">Guardian Name</Label>
          <Input
            id="guardian_name"
            placeholder="Enter guardian's name"
            value={formData.guardian_name || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian_contact">Guardian Contact</Label>
          <Input
            id="guardian_contact"
            placeholder="Enter guardian's contact number"
            value={formData.guardian_contact || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, guardian_contact: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
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
        <div className="flex justify-end space-x-2">
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
            {isProcessing ? "Processing..." : selectedStudent ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};
