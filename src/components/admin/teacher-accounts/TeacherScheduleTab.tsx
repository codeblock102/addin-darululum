
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Calendar } from "lucide-react";
import { TimeSlot } from "@/types/teacher";
import { useState } from "react";
import { ScheduleDialog } from "@/components/admin/schedule/ScheduleDialog";

interface TeacherScheduleTabProps {
  teacherId: string;
}

export function TeacherScheduleTab({ teacherId }: TeacherScheduleTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Fetch classes for this teacher
  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId);
        
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
        <h3 className="text-lg font-medium">No Classes Assigned</h3>
        <p className="text-muted-foreground mt-2 mb-6">
          This teacher doesn't have any classes assigned yet.
        </p>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign New Class
        </Button>
      </div>
    );
  }

  const formatTimeSlot = (timeSlot: TimeSlot) => {
    return `${timeSlot.start_time} - ${timeSlot.end_time}`;
  };
  
  const formatDays = (days: string[]) => {
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Classes ({classes.length})</h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Assign Class
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="p-4">
            <div className="flex justify-between">
              <h4 className="font-medium">{classItem.name}</h4>
              <span className={
                classItem.status === 'active' 
                  ? "text-sm text-green-600" 
                  : "text-sm text-amber-600"
              }>
                {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
              </span>
            </div>
            
            <div className="mt-2 text-sm">
              <div className="flex items-start gap-2 mt-1.5">
                <span className="font-medium w-20">Days:</span>
                <span>{formatDays(classItem.days_of_week)}</span>
              </div>
              
              <div className="flex items-start gap-2 mt-1.5">
                <span className="font-medium w-20">Time:</span>
                <div>
                  {classItem.time_slots && classItem.time_slots.length > 0 ? (
                    classItem.time_slots.map((slot, index) => {
                      // Convert the database JSON to TimeSlot type
                      const timeSlot: TimeSlot = {
                        days: Array.isArray((slot as any).days) ? (slot as any).days : [],
                        start_time: (slot as any).start_time || '',
                        end_time: (slot as any).end_time || ''
                      };
                      
                      return (
                        <div key={index} className="mb-0.5">
                          {formatTimeSlot(timeSlot)}
                        </div>
                      );
                    })
                  ) : (
                    <span>No time slots specified</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-2 mt-1.5">
                <span className="font-medium w-20">Room:</span>
                <span>{classItem.room || "Not specified"}</span>
              </div>
              
              <div className="flex items-start gap-2 mt-1.5">
                <span className="font-medium w-20">Students:</span>
                <span>{classItem.current_students}/{classItem.capacity}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ScheduleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        schedule={selectedSchedule}
        onSuccess={refetch}
        teacherId={teacherId}
      />
    </div>
  );
}
