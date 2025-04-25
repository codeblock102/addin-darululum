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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    user_id?: string;
  } | null;
  onClose?: () => void;
}

interface ScheduleItem {
  id?: string;
  day_of_week: string;
  time_slot: string;
  class_name: string;
  room: string;
  capacity: number;
}

export const TeacherDialog = ({ selectedTeacher, onClose }: TeacherDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("profile");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  
  const [formData, setFormData] = useState<TeacherFormData>({
    name: "",
    subject: "",
    experience: "",
    bio: "",
    email: "",
    phone: "",
  });

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

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
      
      fetchTeacherSchedules(selectedTeacher.id);
    } else {
      setFormData({
        name: "",
        subject: "",
        experience: "",
        bio: "",
        email: "",
        phone: "",
      });
      setSchedules([{
        day_of_week: "Monday",
        time_slot: "09:00 AM - 10:00 AM",
        class_name: "",
        room: "",
        capacity: 20
      }]);
    }
    setErrors({});
  }, [selectedTeacher]);

  const fetchTeacherSchedules = async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_id', teacherId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSchedules(data);
      } else {
        setSchedules([{
          day_of_week: "Monday",
          time_slot: "09:00 AM - 10:00 AM",
          class_name: "",
          room: "",
          capacity: 20
        }]);
      }
    } catch (error: any) {
      console.error("Error fetching schedules:", error);
      toast({
        variant: "destructive",
        title: "Error fetching schedules",
        description: error.message,
      });
    }
  };

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

  const validateSchedules = () => {
    const invalidSchedules = schedules.filter(
      schedule => !schedule.class_name || !schedule.room || !schedule.time_slot
    );
    
    if (invalidSchedules.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please complete all schedule fields",
      });
      return false;
    }
    
    return true;
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

  const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: any) => {
    setSchedules(prevSchedules => {
      const newSchedules = [...prevSchedules];
      newSchedules[index] = { ...newSchedules[index], [field]: value };
      return newSchedules;
    });
  };

  const addScheduleRow = () => {
    setSchedules([
      ...schedules,
      {
        day_of_week: "Monday",
        time_slot: "09:00 AM - 10:00 AM",
        class_name: "",
        room: "",
        capacity: 20
      }
    ]);
  };

  const removeScheduleRow = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
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
    
    if (activeTab === "schedule" && !validateSchedules()) {
      return;
    }
    
    setIsProcessing(true);

    try {
      if (selectedTeacher) {
        const { error: profileError } = await supabase
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

        if (profileError) throw profileError;

        for (const schedule of schedules) {
          if (schedule.id) {
            const { error: scheduleError } = await supabase
              .from('schedules')
              .update({
                day_of_week: schedule.day_of_week,
                time_slot: schedule.time_slot,
                class_name: schedule.class_name,
                room: schedule.room,
                capacity: schedule.capacity
              })
              .eq('id', schedule.id);
            
            if (scheduleError) throw scheduleError;
          } else {
            const { error: scheduleError } = await supabase
              .from('schedules')
              .insert({
                teacher_id: selectedTeacher.id,
                day_of_week: schedule.day_of_week,
                time_slot: schedule.time_slot,
                class_name: schedule.class_name,
                room: schedule.room,
                capacity: schedule.capacity
              });
            
            if (scheduleError) throw scheduleError;
          }
        }

        toast({
          title: "Success",
          description: "Teacher profile and schedule updated successfully",
        });
      } else {
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

        const { data: userData, error: userError } = await supabase.rpc(
          "create_teacher_user",
          {
            teacher_email: formData.email,
            teacher_name: formData.name,
            teacher_id: teacherData.id
          }
        );

        if (userError) throw userError;

        for (const schedule of schedules) {
          const { error: scheduleError } = await supabase
            .from('schedules')
            .insert({
              teacher_id: teacherData.id,
              day_of_week: schedule.day_of_week,
              time_slot: schedule.time_slot,
              class_name: schedule.class_name,
              room: schedule.room,
              capacity: schedule.capacity
            });
          
          if (scheduleError) throw scheduleError;
        }

        toast({
          title: "Success",
          description: "Teacher added successfully with user account and schedule",
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

  const handleCreateUser = async (email: string, password: string, teacherId: string) => {
    try {
      const { error } = await supabase.functions.invoke('create-teacher-user', {
        body: { email, password, teacherId }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "User account created for this teacher",
      });
      
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {selectedTeacher ? "Edit Teacher" : "Add New Teacher"}
        </DialogTitle>
        <DialogDescription>
          {selectedTeacher 
            ? "Update the teacher's information and schedule." 
            : "Fill in the details to add a new teacher to the system."}
        </DialogDescription>
      </DialogHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="profile" className="space-y-4">
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
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
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
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              {schedules.map((schedule, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Schedule #{index + 1}</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeScheduleRow(index)}
                      disabled={schedules.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`day-${index}`}>Day of Week</Label>
                      <Select 
                        value={schedule.day_of_week} 
                        onValueChange={(value) => handleScheduleChange(index, 'day_of_week', value)}
                      >
                        <SelectTrigger id={`day-${index}`}>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`time-${index}`}>Time Slot</Label>
                      <Input
                        id={`time-${index}`}
                        value={schedule.time_slot}
                        onChange={(e) => handleScheduleChange(index, 'time_slot', e.target.value)}
                        placeholder="e.g. 09:00 AM - 10:00 AM"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`class-${index}`}>Class Name</Label>
                      <Input
                        id={`class-${index}`}
                        value={schedule.class_name}
                        onChange={(e) => handleScheduleChange(index, 'class_name', e.target.value)}
                        placeholder="Enter class name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`room-${index}`}>Room</Label>
                      <Input
                        id={`room-${index}`}
                        value={schedule.room}
                        onChange={(e) => handleScheduleChange(index, 'room', e.target.value)}
                        placeholder="Enter room number/name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`capacity-${index}`}>Capacity</Label>
                      <Input
                        id={`capacity-${index}`}
                        type="number"
                        min="1"
                        value={schedule.capacity}
                        onChange={(e) => handleScheduleChange(index, 'capacity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addScheduleRow}
                className="w-full"
              >
                Add Another Schedule
              </Button>
            </div>
          </TabsContent>
          
          <DialogFooter className="mt-6">
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
      </Tabs>
    </DialogContent>
  );
};
