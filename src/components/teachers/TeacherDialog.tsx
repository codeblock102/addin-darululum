
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface TeacherFormData {
  name: string;
  subject: string;
  experience: string;
  bio?: string;
  email: string;
  phone?: string;
}

interface TeacherDialogProps {
  selectedTeacher?: {
    id: string;
    name: string;
    subject: string;
    experience: string;
    bio?: string;
    email?: string;
    phone?: string;
  } | null;
}

export const TeacherDialog = ({ selectedTeacher }: TeacherDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<TeacherFormData>({
    name: "",
    subject: "",
    experience: "",
    bio: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (selectedTeacher) {
      setFormData({
        name: selectedTeacher.name || "",
        subject: selectedTeacher.subject || "",
        experience: selectedTeacher.experience || "",
        bio: selectedTeacher.bio || "",
        email: selectedTeacher.email || "",
        phone: selectedTeacher.phone || "",
      });
    } else {
      setFormData({
        name: "",
        subject: "",
        experience: "",
        bio: "",
        email: "",
        phone: "",
      });
    }
    setErrors({});
  }, [selectedTeacher]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!formData.experience.trim()) {
      newErrors.experience = "Experience is required";
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form",
      });
      return;
    }
    
    setIsProcessing(true);

    try {
      if (selectedTeacher) {
        const { error } = await supabase
          .from('teachers')
          .update({
            name: formData.name,
            subject: formData.subject,
            experience: formData.experience,
            bio: formData.bio,
            email: formData.email,
            phone: formData.phone
          })
          .eq('id', selectedTeacher.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Teacher updated successfully",
        });
      } else {
        // First create the teacher record
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .insert([{
            name: formData.name,
            subject: formData.subject,
            experience: formData.experience,
            bio: formData.bio,
            email: formData.email,
            phone: formData.phone
          }])
          .select()
          .single();

        if (teacherError) throw teacherError;

        // Then create the user account using our custom function
        const { data: userData, error: userError } = await supabase.rpc(
          'create_teacher_user',
          {
            teacher_email: formData.email,
            teacher_name: formData.name,
            teacher_id: teacherData.id
          }
        );

        if (userError) throw userError;

        toast({
          title: "Success",
          description: "Teacher added successfully and user account created",
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
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {selectedTeacher ? "Edit Teacher" : "Add New Teacher"}
        </DialogTitle>
        <DialogDescription>
          {selectedTeacher 
            ? "Update the teacher's information in the system." 
            : "Fill in the details to add a new teacher to the system."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter teacher's name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
          <Input
            id="subject"
            name="subject"
            placeholder="Enter subject"
            value={formData.subject}
            onChange={handleInputChange}
            className={errors.subject ? "border-red-500" : ""}
          />
          {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience">Experience <span className="text-red-500">*</span></Label>
          <Input
            id="experience"
            name="experience"
            placeholder="Years of experience"
            value={formData.experience}
            onChange={handleInputChange}
            className={errors.experience ? "border-red-500" : ""}
          />
          {errors.experience && <p className="text-sm text-red-500">{errors.experience}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="Email address"
            type="email"
            value={formData.email || ""}
            onChange={handleInputChange}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="Phone number"
            value={formData.phone || ""}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Short biography or additional information"
            value={formData.bio || ""}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedTeacher ? "Updating..." : "Adding..."}
              </>
            ) : (
              selectedTeacher ? "Update Teacher" : "Add Teacher"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
