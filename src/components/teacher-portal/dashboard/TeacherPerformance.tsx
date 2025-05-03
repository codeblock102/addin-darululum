
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TeacherPerformanceProps {
  teacherId?: string;
}

export const TeacherPerformance = ({ teacherId }: TeacherPerformanceProps) => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["teacher-performance", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      
      // Here you would fetch actual performance data
      // For now we'll return sample data
      return {
        studentsCount: 24,
        activeClasses: 3,
        averageRating: 4.8,
        completionRate: 92.5,
        totalHours: 128
      };
    },
    enabled: !!teacherId
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-12"></div>
            </div>
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-14"></div>
            </div>
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-10"></div>
            </div>
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No performance data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Students</p>
            <p className="text-2xl font-bold">{performanceData.studentsCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Classes</p>
            <p className="text-2xl font-bold">{performanceData.activeClasses}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="text-2xl font-bold">{performanceData.averageRating}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold">{performanceData.completionRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
