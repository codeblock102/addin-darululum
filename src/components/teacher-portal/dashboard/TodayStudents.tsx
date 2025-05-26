import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";

interface TodayStudentsProps {
  teacherId?: string;
}

export const TodayStudents = ({ teacherId }: TodayStudentsProps) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  const { data: todayStudents, isLoading } = useQuery({
    queryKey: ["today-students", teacherId, today],
    queryFn: async () => {
      // Here you would fetch actual data from your database
      // For now, returning sample data
      return [
        { name: "Ahmad Hassan", class: "Morning Hifz", time: "8:00 AM - 9:30 AM", status: "present" },
        { name: "Fatima Ahmed", class: "Morning Hifz", time: "8:00 AM - 9:30 AM", status: "absent" },
        { name: "Mohammed Ali", class: "Afternoon Tajweed", time: "2:00 PM - 3:30 PM", status: "pending" },
        { name: "Sara Mahmoud", class: "Afternoon Tajweed", time: "2:00 PM - 3:30 PM", status: "pending" }
      ];
    }
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'late':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <Card className="h-auto">
      <CardHeader className="">
        <CardTitle className="text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Today's Students
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : !todayStudents?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No students scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayStudents.map((student, i) => (
              <div key={i} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.class} • {student.time}</p>
                  </div>
                  <Badge className={getStatusColor(student.status)} variant="outline">
                    {student.status === 'pending' ? 'Not recorded' : student.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
