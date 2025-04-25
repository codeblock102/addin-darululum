
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Search, 
  RefreshCcw, 
  Loader2 
} from "lucide-react";
import { ScheduleDialog } from "./ScheduleDialog";
import { Schedule, TimeSlot } from "@/types/teacher";

export const ScheduleManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  
  // Fetch all schedules
  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['admin-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teachers(name)
        `);
      
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
        teachers: item.teachers,
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
  const handleOpenDialog = (schedule?: any) => {
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
      (schedule.room && schedule.room.toLowerCase().includes(searchText)) ||
      (schedule.teachers?.name && schedule.teachers.name.toLowerCase().includes(searchText))
    );
  });
  
  // Helper function to format time slot for display
  const formatTimeSlot = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return '';
    return `${timeSlots[0].start_time} - ${timeSlots[0].end_time}`;
  };
  
  // Group schedules by day
  const groupedSchedules = filteredSchedules?.reduce((acc: Record<string, Schedule[]>, schedule: Schedule) => {
    // Get the first day from days_of_week as our primary day
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => handleOpenDialog()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedules..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSchedules && filteredSchedules.length > 0 ? (
            <div className="space-y-6">
              {daysOfWeek.map((day) => {
                if (!groupedSchedules?.[day] || groupedSchedules[day].length === 0) return null;
                
                return (
                  <div key={day} className="space-y-4">
                    <h3 className="text-lg font-medium">{day}</h3>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time Slot</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedSchedules[day].map((schedule: Schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell>{formatTimeSlot(schedule.time_slots)}</TableCell>
                              <TableCell className="font-medium">{schedule.name}</TableCell>
                              <TableCell>
                                {schedule.teachers?.name || <Badge variant="outline">Unassigned</Badge>}
                              </TableCell>
                              <TableCell>{schedule.room}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  schedule.current_students && schedule.capacity && 
                                  schedule.current_students >= schedule.capacity ? "destructive" : "outline"
                                }>
                                  {schedule.current_students || 0} / {schedule.capacity || 0}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(schedule)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                    disabled={deleteScheduleMutation.isPending}
                                  >
                                    {deleteScheduleMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
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
