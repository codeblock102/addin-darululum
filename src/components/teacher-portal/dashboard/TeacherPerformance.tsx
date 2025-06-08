import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

interface TeacherPerformanceProps {
  teacherId?: string;
}

interface PerformanceData {
  studentsCount: number;
  activeClasses: number;
  averageRating: number;
  completionRate: number;
  totalHours: number;
}

export const TeacherPerformance = ({ teacherId }: TeacherPerformanceProps) => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["teacher-performance", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;

      try {
        // Fetch students count for this teacher
        const { data: studentsData, error: studentsError } = await supabase
          .from("students_teachers")
          .select("id")
          .eq("teacher_id", teacherId)
          .eq("active", true);

        if (studentsError) throw studentsError;

        // Fetch classes for this teacher
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", teacherId);

        if (classesError) throw classesError;

        // In a real app, you would fetch rating data from a ratings table
        // For now, we'll use placeholder data for these metrics
        return {
          studentsCount: studentsData?.length || 0,
          activeClasses: classesData?.length || 0,
          averageRating: 4.8, // Placeholder - would come from actual ratings
          completionRate: 92.5, // Placeholder - would be calculated from progress data
          totalHours: 128, // Placeholder - would be calculated from attendance or time tracking
        } as PerformanceData;
      } catch (error) {
        console.error("Error fetching teacher performance data:", error);
        return null;
      }
    },
    enabled: !!teacherId,
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
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16">
              </div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-12">
              </div>
            </div>
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20">
              </div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-14">
              </div>
            </div>
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24">
              </div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-10">
              </div>
            </div>
            <div className="space-y-1 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20">
              </div>
              <div className="h-7 bg-gray-300 dark:bg-gray-800 rounded w-16">
              </div>
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
          <p className="text-muted-foreground text-center py-4">
            No performance data available
          </p>
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
            <p className="text-2xl font-bold">
              {performanceData.studentsCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Classes</p>
            <p className="text-2xl font-bold">
              {performanceData.activeClasses}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="text-2xl font-bold">
              {performanceData.averageRating}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold">
              {performanceData.completionRate}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
