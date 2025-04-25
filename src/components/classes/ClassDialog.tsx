
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { hasPermission } from "@/utils/roleUtils";

interface Class {
  id: string;
  name: string;
  teacher_id: string | null;
  room: string;
  day_of_week: string;
  time_slot: string;
  capacity: number;
  status: string;
  description?: string;
}

interface ClassDialogProps {
  selectedClass: Class | null;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ClassDialog = ({
  selectedClass
}: ClassDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [className, setClassName] = useState("");
  const [day, setDay] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState("");
  const [room, setRoom] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form when dialog opens/closes or class changes
  useEffect(() => {
    if (selectedClass) {
      setClassName(selectedClass.name);
      setDay(selectedClass.day_of_week);
      setTimeSlot(selectedClass.time_slot);
      setRoom(selectedClass.room);
      setCapacity(selectedClass.capacity.toString());
      setTeacherId(selectedClass.teacher_id);
      setDescription(selectedClass.description || "");
      setStatus(selectedClass.status);
    } else {
      setClassName("");
      setDay("");
      setTimeSlot("");
      setRoom("");
      setCapacity("20");
      setTeacherId(null);
      setDescription("");
      setStatus("active");
    }
    
    setErrors({});
  }, [selectedClass]);
  
  // Fetch teachers for dropdown
  const { data: teachers } = useQuery({
    queryKey: ['teachers-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
  
  // Create/update class mutation
  const classMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Check permissions
      const hasClassPermission = await hasPermission('manage_classes');
      if (!hasClassPermission) {
        throw new Error("You don't have permission to manage classes");
      }
      
      if (selectedClass) {
        // Update existing class
        const { data, error } = await supabase
          .from('classes')
          .update(formData)
          .eq('id', selectedClass.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Create new class
        const { data, error } = await supabase
          .from('classes')
          .insert([formData])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      
      toast({
        title: selectedClass ? "Class updated" : "Class created",
        description: selectedClass 
          ? "The class has been updated successfully."
          : "A new class has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${selectedClass ? 'update' : 'create'} class: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Validate and submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    const formSchema = z.object({
      name: z.string().min(1, "Class name is required"),
      day_of_week: z.string().min(1, "Day of the week is required"),
      time_slot: z.string().min(1, "Time slot is required"),
      room: z.string().min(1, "Room is required"),
      capacity: z.number().min(1, "Capacity must be at least 1"),
    });
    
    try {
      formSchema.parse({
        name: className,
        day_of_week: day,
        time_slot: timeSlot,
        room,
        capacity: Number(capacity)
      });
      
      // Check for class conflicts
      if (!selectedClass) {
        const { data: conflicts } = await supabase
          .from('classes')
          .select('id')
          .eq('day_of_week', day)
          .eq('time_slot', timeSlot)
          .eq('room', room);
        
        if (conflicts && conflicts.length > 0) {
          setErrors({
            room: "This room is already scheduled for this time slot",
          });
          return;
        }
      }
      
      // Submit form data
      classMutation.mutate({
        name: className,
        day_of_week: day,
        time_slot: timeSlot,
        room,
        capacity: Number(capacity),
        teacher_id: teacherId,
        description: description || null,
        status
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
    }
  };
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {selectedClass ? "Edit Class" : "Create New Class"}
        </DialogTitle>
        <DialogDescription>
          {selectedClass 
            ? "Update the details of this class." 
            : "Add a new class to the system."}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="className">Class Name</Label>
          <Input
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="day">Day of Week</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger className={errors.day_of_week ? "border-destructive" : ""}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.day_of_week && (
              <p className="text-xs text-destructive">{errors.day_of_week}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot</Label>
            <Input
              id="timeSlot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="e.g. 9:00 AM - 10:30 AM"
              className={errors.time_slot ? "border-destructive" : ""}
            />
            {errors.time_slot && (
              <p className="text-xs text-destructive">{errors.time_slot}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className={errors.room ? "border-destructive" : ""}
            />
            {errors.room && (
              <p className="text-xs text-destructive">{errors.room}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min={1}
              className={errors.capacity ? "border-destructive" : ""}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="teacher">Assign Teacher (Optional)</Label>
          <Select value={teacherId || "unassigned"} onValueChange={(value) => setTeacherId(value === "unassigned" ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">None (Unassigned)</SelectItem>
              {teachers?.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the class"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter className="mt-6">
          <Button
            type="submit"
            disabled={classMutation.isPending}
          >
            {classMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedClass ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{selectedClass ? "Update Class" : "Create Class"}</>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
