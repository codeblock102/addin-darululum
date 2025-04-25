
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ScheduleDialog } from "./ScheduleDialog";
import { Schedule } from "@/types/teacher";
import { ScheduleSearch } from "./ScheduleSearch";
import { ScheduleActions } from "./ScheduleActions";
import { ScheduleGroupedList } from "./ScheduleGroupedList";

export const ScheduleManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // Fetch all schedules
  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['admin-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*');
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        class_name: item.name,
        days_of_week: item.days_of_week || [],
        time_slots: Array.isArray(item.time_slots) ? item.time_slots.map((slot: any) => ({
          days: slot.days || [],
          start_time: slot.start_time || '',
          end_time: slot.end_time || ''
        })) : [],
        room: item.room || '',
        capacity: item.capacity || 0,
        current_students: item.current_students || 0,
        teacher_id: item.teacher_id || null,
        // For compatibility with older components
        day_of_week: Array.isArray(item.days_of_week) && item.days_of_week.length > 0 ? 
          item.days_of_week[0] : '',
        time_slot: Array.isArray(item.time_slots) && item.time_slots.length > 0 ? 
          `${item.time_slots[0].start_time} - ${item.time_slots[0].end_time}` : '',
      }));
    }
  });
  
  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast({
        title: "Schedule deleted",
        description: "The schedule has been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete schedule: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle adding/editing schedule
  const handleOpenDialog = (schedule?: Schedule) => {
    setSelectedSchedule(schedule || null);
    setIsDialogOpen(true);
  };
  
  // Handle deleting schedule
  const handleDeleteSchedule = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate(id);
    }
  };
  
  // Filter schedules based on search term
  const filteredSchedules = schedules?.filter((schedule: Schedule) => {
    const searchText = searchTerm.toLowerCase();
    return (
      schedule.name.toLowerCase().includes(searchText) ||
      (schedule.day_of_week && schedule.day_of_week.toLowerCase().includes(searchText)) ||
      (schedule.room && schedule.room.toLowerCase().includes(searchText))
    );
  });
  
  // Group schedules by day
  const groupedSchedules = filteredSchedules?.reduce((acc: Record<string, Schedule[]>, schedule: Schedule) => {
    const primaryDay = schedule.days_of_week && schedule.days_of_week.length > 0 
      ? schedule.days_of_week[0] 
      : schedule.day_of_week || 'Unspecified';
    
    if (!acc[primaryDay]) {
      acc[primaryDay] = [];
    }
    acc[primaryDay].push(schedule);
    return acc;
  }, {});
  
  // Order days of the week
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Unspecified"];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Schedule Management</CardTitle>
              <CardDescription>
                Manage and organize teaching schedules
              </CardDescription>
            </div>
            <ScheduleActions 
              onRefresh={refetch}
              onAddSchedule={() => handleOpenDialog()}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <ScheduleSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSchedules && filteredSchedules.length > 0 ? (
            <ScheduleGroupedList
              groupedSchedules={groupedSchedules || {}}
              daysOfWeek={daysOfWeek}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteSchedule}
              isDeleting={deleteScheduleMutation.isPending}
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No schedules found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ScheduleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        schedule={selectedSchedule}
      />
    </div>
  );
};
