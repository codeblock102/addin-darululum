import React from 'react';
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
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
  SelectValue 
} from "@/components/ui/select.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
  completed_juz?: number[];
  current_juz?: number | null;
}

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  onClose: () => void;
}

export const StudentDialog = ({ open, onOpenChange, selectedStudent, onClose }: StudentDialogProps) => {
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
    completed_juz: selectedStudent?.completed_juz || [],
    current_juz: selectedStudent?.current_juz?.toString() || "_none_",
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
        completed_juz: selectedStudent.completed_juz || [],
        current_juz: selectedStudent.current_juz?.toString() || "_none_",
      });
    } else {
      // Reset form data for new student
      setFormData({
        name: "",
        date_of_birth: "",
        enrollment_date: new Date().toISOString().split('T')[0],
        guardian_name: "",
        guardian_contact: "",
        status: "active",
        completed_juz: [],
        current_juz: "_none_", // Default to special "None" value
      });
    }
  }, [selectedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const submissionData = {
        ...formData,
        current_juz: formData.current_juz === "_none_" ? null : Number(formData.current_juz),
        completed_juz: formData.completed_juz.map(juz => Number(juz)),
      };

      if (selectedStudent) {
        const { error } = await supabase
          .from('students')
          .update(submissionData)
          .eq('id', selectedStudent.id)
          .select('id');

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('students')
          .insert([submissionData])
          .select('id');

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedStudent ? "Edit Student" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info">Student Info</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="quran">Quran Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
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
            </TabsContent>

            <TabsContent value="guardian" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="quran" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_juz">Current Juz</Label>
                <Select 
                  value={formData.current_juz}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, current_juz: value }))}
                >
                  <SelectTrigger id="current_juz">
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
                    const isCurrentJuz = formData.current_juz !== "_none_" && parseInt(formData.current_juz) === juz;
                    return (
                      <div key={juz} className={`flex items-center space-x-2 ${isCurrentJuz ? 'opacity-50' : ''}`}>
                        <Checkbox
                          id={`juz-${juz}`}
                          checked={formData.completed_juz.includes(juz)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => {
                              const current = prev.completed_juz;
                              const updated = checked
                                ? [...current, juz].sort((a,b) => a-b)
                                : current.filter(j => j !== juz);
                              return { ...prev, completed_juz: updated };
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
              {isProcessing ? "Processing..." : selectedStudent ? "Update Student" : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
