
import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";

interface TeacherFormData {
  name: string;
  subject: string;
  experience: string;
}

interface TeacherDialogProps {
  selectedTeacher?: {
    id: string;
    name: string;
    subject: string;
    experience: string;
  } | null;
}

export const TeacherDialog = ({ selectedTeacher }: TeacherDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<TeacherFormData>({
    name: selectedTeacher?.name || "",
    subject: selectedTeacher?.subject || "",
    experience: selectedTeacher?.experience || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (selectedTeacher) {
        const { error } = await supabase
          .from('teachers')
          .update(formData)
          .eq('id', selectedTeacher.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Teacher updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('teachers')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Teacher added successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error: any) {
      toast({
        title: selectedTeacher ? "Error updating teacher" : "Error adding teacher",
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
          {selectedTeacher ? "Edit Teacher" : "Add New Teacher"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter teacher's name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Enter subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Input
            id="experience"
            placeholder="Years of experience"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : selectedTeacher ? "Update Teacher" : "Add Teacher"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};
