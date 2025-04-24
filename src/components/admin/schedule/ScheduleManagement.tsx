
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
import { Schedule } from "@/types/progress";

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
        .from('schedules')
        .select(`
          *,
          teachers(name)
        `)
        .order('day_of_week', { ascending: true })
        .order('time_slot', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
  
  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('schedules')
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
  const filteredSchedules = schedules?.filter((schedule: any) => {
    const searchText = searchTerm.toLowerCase();
    return (
      schedule.class_name.toLowerCase().includes(searchText) ||
      schedule.day_of_week.toLowerCase().includes(searchText) ||
      schedule.room.toLowerCase().includes(searchText) ||
      (schedule.teachers?.name && schedule.teachers.name.toLowerCase().includes(searchText))
    );
  });
  
  // Group schedules by day
  const groupedSchedules = filteredSchedules?.reduce((acc: any, schedule: any) => {
    const day = schedule.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {});
  
  // Order days of the week
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
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
                if (!groupedSchedules[day]) return null;
                
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
                          {groupedSchedules[day].map((schedule: any) => (
                            <TableRow key={schedule.id}>
                              <TableCell>{schedule.time_slot}</TableCell>
                              <TableCell className="font-medium">{schedule.class_name}</TableCell>
                              <TableCell>
                                {schedule.teachers?.name || <Badge variant="outline">Unassigned</Badge>}
                              </TableCell>
                              <TableCell>{schedule.room}</TableCell>
                              <TableCell>
                                <Badge variant={schedule.current_students >= schedule.capacity ? "destructive" : "outline"}>
                                  {schedule.current_students} / {schedule.capacity}
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
