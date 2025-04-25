
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Schedule, TimeSlot } from '@/types/teacher';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface TeacherScheduleProps {
  teacherId: string;
  limit?: number;
  dashboard?: boolean;
}

export const TeacherSchedule = ({ teacherId, limit, dashboard = false }: TeacherScheduleProps) => {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['teacher-schedule', teacherId],
    queryFn: async () => {
      const query = supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId);
        
      if (limit) {
        query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our Schedule type
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        class_name: item.name, // For compatibility
        days_of_week: item.days_of_week || [],
        time_slots: Array.isArray(item.time_slots) ? item.time_slots.map((slot: any) => ({
          days: slot.days || [],
          start_time: slot.start_time || '',
          end_time: slot.end_time || ''
        })) : [],
        room: item.room,
        capacity: item.capacity,
        current_students: item.current_students,
        // For compatibility with older components
        day_of_week: Array.isArray(item.days_of_week) && item.days_of_week.length > 0 ? 
          item.days_of_week[0] : undefined,
        time_slot: Array.isArray(item.time_slots) && item.time_slots.length > 0 ? 
          `${item.time_slots[0].start_time} - ${item.time_slots[0].end_time}` : undefined,
      })) as Schedule[];
    },
    enabled: !!teacherId
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No scheduled classes found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {classes.map((classItem) => (
        <Card key={classItem.id} className={dashboard ? 'border-l-4 border-l-primary' : ''}>
          <CardContent className={dashboard ? 'py-4' : 'py-6'}>
            <h3 className="font-medium text-lg">{classItem.name}</h3>
            <div className="mt-2 space-y-2">
              {classItem.time_slots && classItem.time_slots.map((slot: TimeSlot, index: number) => (
                <div key={index} className="flex items-center text-sm text-muted-foreground">
                  <div className="flex-1">
                    <span className="font-medium">{slot.days ? slot.days.join(', ') : classItem.days_of_week?.join(', ')}</span>
                  </div>
                  <div className="flex-1 text-right">
                    {slot.start_time} - {slot.end_time}
                  </div>
                </div>
              ))}
              {classItem.room && (
                <p className="text-sm text-muted-foreground">Room: {classItem.room}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Students: {classItem.current_students || 0} / {classItem.capacity || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
