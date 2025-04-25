import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BookOpen, Clock, Calendar } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityRecord {
  id: string;
  type: 'login' | 'class' | 'student' | 'progress' | 'attendance';
  description: string;
  timestamp: string;
  entity?: string;
}

interface TeacherActivityTabProps {
  teacherId: string;
}

export function TeacherActivityTab({ teacherId }: TeacherActivityTabProps) {
  const [period, setPeriod] = useState<'7days' | '30days' | '3months' | 'all'>('30days');
  
  // This would be a real query to an activity log in a full implementation
  // Here we're generating mock data
  const { data: activities, isLoading } = useQuery({
    queryKey: ['teacher-activity', teacherId, period],
    queryFn: async () => {
      // Mock data generator for demo purpose
      const now = new Date();
      const cutoffDate = period === '7days' ? subDays(now, 7) : 
                         period === '30days' ? subDays(now, 30) :
                         period === '3months' ? subDays(now, 90) : new Date(0);
      
      // Sample activity types
      const activityTypes = [
        { type: 'login' as const, description: 'Logged in to the system' },
        { type: 'login' as const, description: 'Changed password' },
        { type: 'class' as const, description: 'Added new class schedule' },
        { type: 'class' as const, description: 'Updated class information' },
        { type: 'student' as const, description: 'Assigned new student' },
        { type: 'progress' as const, description: 'Recorded student progress' },
        { type: 'attendance' as const, description: 'Marked attendance' }
      ];
      
      // Generate random dates within the period
      const mockActivities: ActivityRecord[] = [];
      for (let i = 0; i < 15; i++) {
        const daysAgo = Math.floor(Math.random() * 120); // 0-120 days ago
        const timestamp = subDays(now, daysAgo);
        
        if (timestamp >= cutoffDate) {
          const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
          mockActivities.push({
            id: `activity-${i}`,
            ...activityType,
            timestamp: timestamp.toISOString(),
            entity: activityType.type !== 'login' ? `${activityType.type}-entity-${i}` : undefined
          });
        }
      }
      
      // Sort by timestamp (newest first)
      return mockActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get activity icon by type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Clock className="h-4 w-4" />;
      case 'class':
        return <Calendar className="h-4 w-4" />;
      case 'student':
      case 'progress':
      case 'attendance':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Activity Log</h3>
        <div className="w-[180px]">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {!activities || activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
            <h3 className="text-lg font-medium mb-2">No Activity Found</h3>
            <p className="text-muted-foreground">
              No activity records found for this teacher in the selected time period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date & Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    {format(parseISO(activity.timestamp), 'PPP p')}
                  </TableCell>
                  <TableCell>{activity.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getActivityIcon(activity.type)}
                      <span className="capitalize">{activity.type}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
