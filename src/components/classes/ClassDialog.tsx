
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const classSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  teacher_id: z.string().uuid("Please select a teacher"),
  room: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  day_of_week: z.string(),
  time_slot: z.string().min(3, "Please enter a valid time slot"),
  status: z.enum(['active', 'inactive']).default('active')
});

export const ClassDialog = ({ selectedClass }: { selectedClass?: any }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: selectedClass ? {
      name: selectedClass.name,
      teacher_id: selectedClass.teacher_id,
      room: selectedClass.room || '',
      capacity: selectedClass.capacity,
      day_of_week: selectedClass.day_of_week,
      time_slot: selectedClass.time_slot,
      status: selectedClass.status || 'active'
    } : {
      capacity: 20,
      status: 'active'
    }
  });

  const onSubmit = async (values: z.infer<typeof classSchema>) => {
    setIsSubmitting(true);
    try {
      const method = selectedClass ? 'update' : 'insert';
      const query = supabase.from('classes')[method];
      
      const payload = {
        ...values,
        ...(selectedClass && { id: selectedClass.id })
      };

      const { error } = await query(payload);

      if (error) throw error;

      toast({
        title: `Class ${method === 'insert' ? 'Created' : 'Updated'}`,
        description: `The class ${values.name} has been successfully ${method === 'insert' ? 'created' : 'updated'}.`
      });

      // Close dialog logic would be handled by the parent component
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{selectedClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        <DialogDescription>
          {selectedClass 
            ? 'Update the details of this class' 
            : 'Create a new class with its schedule and details'}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter class name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacher_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <FormControl>
                    <Input placeholder="Room number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Week</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time_slot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Slot</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 10:00 AM - 11:30 AM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (selectedClass ? 'Updating...' : 'Creating...') 
                : (selectedClass ? 'Update Class' : 'Create Class')}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};
