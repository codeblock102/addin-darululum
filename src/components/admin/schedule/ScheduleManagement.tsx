
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ScheduleDialog } from "./ScheduleDialog";
import { Schedule } from "@/types/teacher";
import { ScheduleSearch } from "./ScheduleSearch";
import { ScheduleActions } from "./ScheduleActions";
import { ScheduleGroupedList } from "./ScheduleGroupedList";

export const ScheduleManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
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
        day_of_week: Array.isArray(item.days_of_week) && item.days_of_week.length > 0 ? 
          item.days_of_week[0] : '',
        time_slot: Array.isArray(item.time_slots) && item.time_slots.length > 0 ? 
          `${item.time_slots[0].start_time} - ${item.time_slots[0].end_time}` : '',
      }));
    }
  });
  
  const handleOpenDialog = (schedule?: Schedule) => {
    setSelectedSchedule(schedule || null);
    setIsDialogOpen(true);
  };
  
  const filteredSchedules = schedules?.filter((schedule: Schedule) => {
    const searchText = searchTerm.toLowerCase();
    return (
      schedule.name.toLowerCase().includes(searchText) ||
      (schedule.day_of_week && schedule.day_of_week.toLowerCase().includes(searchText)) ||
      (schedule.room && schedule.room.toLowerCase().includes(searchText))
    );
  });
  
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
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Unspecified"];
  
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-primary">Class Schedule</CardTitle>
              <CardDescription className="text-lg mt-2">
                Manage and organize teaching schedules efficiently
              </CardDescription>
            </div>
            <ScheduleActions 
              onRefresh={refetch}
              onAddSchedule={() => handleOpenDialog()}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <ScheduleSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSchedules && filteredSchedules.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm">
                <ScheduleGroupedList
                  groupedSchedules={groupedSchedules || {}}
                  daysOfWeek={daysOfWeek}
                  onEdit={handleOpenDialog}
                  onDelete={(id) => {
                    if (confirm("Are you sure you want to delete this schedule?")) {
                      supabase
                        .from('classes')
                        .delete()
                        .eq('id', id)
                        .then(() => {
                          refetch();
                        });
                    }
                  }}
                  isDeleting={false}
                />
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-muted-foreground text-lg">
                  No schedules found matching your search.
                </p>
              </div>
            )}
          </div>
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
