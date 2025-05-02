
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, BookOpen, Calendar, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentActivityProps {
  teacherId: string;
}

// Define activity types properly to avoid infinite type instantiation
interface ActivityItem {
  id: string;
  type: 'progress' | 'dhor' | 'attendance' | 'message';
  date: string;
  studentId: string;
  studentName: string;
  detail: string;
}

// Define types for data coming from the database
interface ProgressData {
  id: string;
  created_at: string;
  student_id: string;
  current_surah?: number;
  current_juz?: number;
  students?: {
    name: string;
  };
}

interface DhorData {
  id: string;
  created_at: string;
  student_id: string;
  entry_date: string;
  students?: {
    name: string;
  };
}

interface AttendanceData {
  id: string;
  created_at: string;
  student_id: string;
  date: string;
  status: string;
  students?: {
    name: string;
  };
}

export const RecentActivity = ({ teacherId }: RecentActivityProps) => {
  const navigate = useNavigate();
  
  const { data: recentActivities, isLoading } = useQuery({
    queryKey: ['recent-activities', teacherId],
    queryFn: async () => {
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      
      // Fetch recent progress entries
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('id, created_at, student_id, current_surah, current_juz, students(name)')
        .eq('contributor_id', teacherId)
        .gte('created_at', threeWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (progressError) {
        console.error('Error fetching progress entries:', progressError);
      }
      
      // Fetch dhor book entries
      const { data: dhorData, error: dhorError } = await supabase
        .from('dhor_book_entries')
        .select('id, created_at, student_id, entry_date, students(name)')
        .eq('teacher_id', teacherId)
        .gte('created_at', threeWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (dhorError) {
        console.error('Error fetching dhor entries:', dhorError);
      }
      
      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, created_at, student_id, date, status, students(name)')
        .gte('created_at', threeWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError);
      }
      
      // Combine and format activities
      const progressActivities: ActivityItem[] = (progressData || []).map((item: ProgressData) => ({
        id: `progress-${item.id}`,
        type: 'progress',
        date: item.created_at,
        studentId: item.student_id,
        studentName: item.students?.name || 'Unknown Student',
        detail: `Recorded progress - Surah ${item.current_surah}, Juz ${item.current_juz}`
      }));
      
      const dhorActivities: ActivityItem[] = (dhorData || []).map((item: DhorData) => ({
        id: `dhor-${item.id}`,
        type: 'dhor',
        date: item.created_at,
        studentId: item.student_id,
        studentName: item.students?.name || 'Unknown Student',
        detail: `Dhor Book entry for ${new Date(item.entry_date).toLocaleDateString()}`
      }));
      
      const attendanceActivities: ActivityItem[] = (attendanceData || []).map((item: AttendanceData) => ({
        id: `attendance-${item.id}`,
        type: 'attendance',
        date: item.created_at,
        studentId: item.student_id,
        studentName: item.students?.name || 'Unknown Student',
        detail: `Marked as ${item.status} for ${new Date(item.date).toLocaleDateString()}`
      }));
      
      // Combine all activities, sort by date (newest first), and limit to 10
      const allActivities = [...progressActivities, ...dhorActivities, ...attendanceActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
        
      return allActivities;
    }
  });
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'progress':
        return <ClipboardList className="h-4 w-4 text-green-600" />;
      case 'dhor':
        return <BookOpen className="h-4 w-4 text-amber-600" />;
      case 'attendance':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!recentActivities || recentActivities.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mb-2" />
          <p>No recent activities found</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {recentActivities.map((activity: ActivityItem) => (
          <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
            <div className="mt-1 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{activity.studentName}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(activity.date)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{activity.detail}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="border border-purple-100 dark:border-purple-900/30 shadow-sm">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
        <CardTitle className="flex items-center justify-between text-purple-700 dark:text-purple-300">
          <div>Recent Activity</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/teacher-portal?tab=performance")}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
