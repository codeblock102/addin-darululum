
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Users, MapPin } from "lucide-react";

interface TeacherScheduleProps {
  teacherId: string;
}

export const TeacherSchedule = ({ teacherId }: TeacherScheduleProps) => {
  // Define days of the week for ordering
  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  // Get current day for highlighting
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Fetch teacher's schedule
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['teacher-schedule', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_id', teacherId);
      
      if (error) {
        console.error('Error fetching teacher schedule:', error);
        return [];
      }
      
      // Sort by day of week
      return data.sort((a, b) => 
        daysOfWeek.indexOf(a.day_of_week.toLowerCase()) - 
        daysOfWeek.indexOf(b.day_of_week.toLowerCase())
      );
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No classes are currently scheduled for you.
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Students</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedule.map((item) => (
          <TableRow 
            key={item.id}
            className={item.day_of_week.toLowerCase() === currentDay ? "bg-muted/50" : ""}
          >
            <TableCell>
              <Badge 
                variant={item.day_of_week.toLowerCase() === currentDay ? "default" : "outline"}
                className="capitalize"
              >
                {item.day_of_week}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{item.class_name}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                {item.time_slot}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                {item.room}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                {item.current_students} / {item.capacity}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
