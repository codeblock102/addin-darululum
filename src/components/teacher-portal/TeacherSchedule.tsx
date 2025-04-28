
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Schedule, TimeSlot } from '@/types/teacher';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface TeacherScheduleProps {
  teacherId: string;
  limit?: number;
  dashboard?: boolean;
}

export const TeacherSchedule = ({ teacherId, limit, dashboard = false }: TeacherScheduleProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    data: classes, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['teacher-schedule', teacherId],
    queryFn: async () => {
      try {
        const query = supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', teacherId);
          
        if (limit) {
          query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          // No real data, use placeholder data for now until database is populated
          return [
            {
              id: "placeholder-1",
              name: "Hifz Morning Class",
              class_name: "Hifz Morning Class",
              days_of_week: ["Monday", "Wednesday", "Friday"],
              time_slots: [
                { 
                  days: ["Monday", "Wednesday", "Friday"],
                  start_time: "08:00", 
                  end_time: "10:00" 
                }
              ],
              room: "Room A",
              capacity: 15,
              current_students: 12,
              teacher_id: teacherId
            },
            {
              id: "placeholder-2",
              name: "Tajweed Class",
              class_name: "Tajweed Class",
              days_of_week: ["Tuesday", "Thursday"],
              time_slots: [
                { 
                  days: ["Tuesday", "Thursday"],
                  start_time: "11:00", 
                  end_time: "13:00" 
                }
              ],
              room: "Room B",
              capacity: 20,
              current_students: 15,
              teacher_id: teacherId
            },
            {
              id: "placeholder-3",
              name: "Advanced Hifz",
              class_name: "Advanced Hifz",
              days_of_week: ["Friday"],
              time_slots: [
                { 
                  days: ["Friday"],
                  start_time: "14:00", 
                  end_time: "16:00" 
                }
              ],
              room: "Room C",
              capacity: 8,
              current_students: 5,
              teacher_id: teacherId
            }
          ] as Schedule[];
        }
        
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
      } catch (error) {
        console.error("Error fetching teacher schedule:", error);
        return [] as Schedule[];
      }
    },
    enabled: !!teacherId,
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  const today = format(new Date(), 'EEEE'); // e.g., "Monday"
  
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
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {!dashboard && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      )}
      
      {classes.map((classItem) => {
        const isToday = classItem.days_of_week?.includes(today);
        
        return (
          <Card 
            key={classItem.id} 
            className={`${dashboard ? 'border-l-4' : ''} ${
              isToday ? 'border-l-primary' : dashboard ? 'border-l-muted' : ''
            }`}
          >
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
        );
      })}
    </div>
  );
};
