
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserFormData {
  email: string;
  username: string;
  password: string;
  teacherId: string | null;
}

interface UserDialogProps {
  selectedUser?: {
    id: string;
    email: string;
    username: string;
    teacherId: string | null;
  } | null;
  teachers: {
    id: string;
    name: string;
  }[];
  onSuccess: () => void;
}

export const UserDialog = ({ selectedUser, teachers, onSuccess }: UserDialogProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    username: "",
    password: "",
    teacherId: null
  });

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || "",
        username: selectedUser.username || "",
        password: "", // Don't populate password for security reasons
        teacherId: selectedUser.teacherId || null
      });
    } else {
      setFormData({
        email: "",
        username: "",
        password: "",
        teacherId: null
      });
    }
    setErrors({});
  }, [selectedUser]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!selectedUser && !formData.password.trim()) {
      newErrors.password = "Password is required for new users";
    } else if (!selectedUser && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleTeacherChange = (value: string) => {
    setFormData(prev => ({ ...prev, teacherId: value === "none" ? null : value }));
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
      if (selectedUser) {
        // Update existing user
        if (formData.password) {
          // Update password if provided
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            selectedUser.id,
            { password: formData.password }
          );
          
          if (passwordError) throw passwordError;
        }
        
        // Update user metadata
        const { error: userError } = await supabase.auth.admin.updateUserById(
          selectedUser.id,
          { 
            email: formData.email,
            user_metadata: { 
              username: formData.username,
              teacher_id: formData.teacherId
            }
          }
        );
        
        if (userError) throw userError;
        
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: { 
            username: formData.username,
            teacher_id: formData.teacherId
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: selectedUser ? "Error updating user" : "Error creating user",
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
          {selectedUser ? "Edit User" : "Add New User"}
        </DialogTitle>
        <DialogDescription>
          {selectedUser 
            ? "Update the user's information and credentials." 
            : "Create a new user account with access to the system."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
          <Input
            id="username"
            name="username"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleInputChange}
            className={errors.username ? "border-red-500" : ""}
          />
          {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">
            Password {!selectedUser && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={selectedUser ? "Leave blank to keep current password" : "Enter password"}
            value={formData.password}
            onChange={handleInputChange}
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          {selectedUser && (
            <p className="text-xs text-gray-500">Leave blank to keep the current password.</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="teacherId">Assign to Teacher</Label>
          <Select
            value={formData.teacherId || "none"}
            onValueChange={handleTeacherChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a teacher (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Linking a user to a teacher allows them to access the teacher portal with that teacher's data.
          </p>
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
                {selectedUser ? "Updating..." : "Creating..."}
              </>
            ) : (
              selectedUser ? "Update User" : "Create User"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
