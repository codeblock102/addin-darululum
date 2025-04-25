
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { hasPermission } from "@/utils/roleUtils";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacher_id: z.string().optional(),
  room: z.string().min(1, "Room is required"),
  time_start: z.string().min(1, "Start time is required"),
  time_end: z.string().min(1, "End time is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  days_of_week: z.array(z.string()).min(1, "Select at least one day"),
});

interface ClassDialogProps {
  selectedClass: any;
  onClose: () => void;
}

export function ClassDialog({ selectedClass, onClose }: ClassDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      teacher_id: undefined,
      room: "",
      time_start: "09:00",
      time_end: "10:30",
      capacity: 20,
      days_of_week: [],
    },
  });

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
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (selectedClass) {
      form.reset({
        name: selectedClass.name,
        teacher_id: selectedClass.teacher_id || undefined,
        room: selectedClass.room,
        time_start: selectedClass.time_start,
        time_end: selectedClass.time_end,
        capacity: selectedClass.capacity,
        days_of_week: selectedClass.days_of_week,
      });
      setSelectedDays(selectedClass.days_of_week);
    }
  }, [selectedClass, form]);

  const classMutation = useMutation({
    mutationFn: async (values: any) => {
      const hasCreatePermission = await hasPermission('manage_classes');
      if (!hasCreatePermission) {
        throw new Error("You don't have permission to manage classes");
      }

      const formattedValues = {
        ...values,
        days_of_week: selectedDays,
      };

      if (selectedClass) {
        const { error } = await supabase
          .from('classes')
          .update(formattedValues)
          .eq('id', selectedClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([formattedValues]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: selectedClass ? "Class Updated" : "Class Created",
        description: `Class has been ${selectedClass ? 'updated' : 'created'} successfully.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof classSchema>) => {
    classMutation.mutate(values);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {selectedClass ? "Edit Class" : "Create New Class"}
        </DialogTitle>
        <DialogDescription>
          {selectedClass
            ? "Update the class details and schedule."
            : "Add a new class with its schedule."}
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
                <FormLabel>Teacher (Optional)</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Unassigned)</SelectItem>
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

          <FormField
            control={form.control}
            name="room"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room</FormLabel>
                <FormControl>
                  <Input placeholder="Enter room number/name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="time_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="days_of_week"
            render={() => (
              <FormItem>
                <FormLabel>Class Days</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDays.includes(day)}
                        onCheckedChange={(checked) => {
                          setSelectedDays(
                            checked
                              ? [...selectedDays, day]
                              : selectedDays.filter((d) => d !== day)
                          );
                        }}
                      />
                      <span>{day}</span>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
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
                selectedClass ? "Update Class" : "Create Class"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
