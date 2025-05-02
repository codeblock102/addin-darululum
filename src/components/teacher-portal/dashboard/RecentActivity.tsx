
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIcon, BookOpen, CalendarIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { NewEntryDialog } from "@/components/dhor-book/NewEntryDialog";

interface RecentActivityProps {
  teacherId: string;
}

type ActivityItem = {
  id: string;
  created_at: string;
  type: "dhor_entry" | "attendance" | "progress";
  description: string;
  student_name: string;
  student_id: string;
};

export const RecentActivity = ({ teacherId }: RecentActivityProps) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ["teacher-recent-activities", teacherId],
    queryFn: async () => {
      // This query fetches the most recent activity across different types (dhor entries, attendance, etc)
      const { data: dhorEntries, error: dhorError } = await supabase
        .from("dhor_book_entries")
        .select(`
          id,
          created_at,
          student_id,
          students (name)
        `)
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (dhorError) console.error("Error fetching dhor entries:", dhorError);
      
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance")
        .select(`
          id,
          created_at,
          student_id,
          students (name)
        `)
        .eq("created_by", teacherId)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (attendanceError) console.error("Error fetching attendance:", attendanceError);
      
      // Format the activities in a consistent way
      const formattedActivities: ActivityItem[] = [
        ...(dhorEntries?.map((entry: any) => ({
          id: `dhor_${entry.id}`,
          created_at: entry.created_at,
          type: "dhor_entry" as const,
          description: "Added new Dhor Book entry",
          student_name: entry.students?.name || "Unknown Student",
          student_id: entry.student_id
        })) || []),
        
        ...(attendanceRecords?.map((record: any) => ({
          id: `attendance_${record.id}`,
          created_at: record.created_at,
          type: "attendance" as const,
          description: "Recorded attendance",
          student_name: record.students?.name || "Unknown Student",
          student_id: record.student_id
        })) || [])
      ];
      
      // Sort by most recent
      return formattedActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);
    }
  });
  
  const handleAddDhorEntry = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDialogOpen(true);
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "dhor_entry":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "attendance":
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
        <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <span className="text-xl">Recent Activity</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
              <p>Your recent interactions with students</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/10"
              >
                <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-sm border border-purple-100 dark:border-purple-900/30">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {activity.student_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Badge 
                      variant="outline"
                      className={`
                        text-xs font-normal
                        ${activity.type === "dhor_entry" 
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/50" 
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/50"
                        }
                      `}
                    >
                      {activity.type === "dhor_entry" ? "Dhor Book" : "Attendance"}
                    </Badge>
                    {activity.type === "dhor_entry" && (
                      <button
                        onClick={() => handleAddDhorEntry(activity.student_id)}
                        className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline-offset-2 hover:underline"
                      >
                        Add new entry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {selectedStudentId && (
        <NewEntryDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          studentId={selectedStudentId}
          teacherId={teacherId}
          onSuccess={() => {
            // Refetch activities after a successful entry
            // This will be handled by invalidating the query in useDhorEntryMutation
          }}
        />
      )}
    </Card>
  );
};
