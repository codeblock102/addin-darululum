import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client.ts";
import { TrendingUp, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  teacherId?: string;
  isAdmin?: boolean;
}

type ProgressEntry = {
  id: string;
  created_at: string;
  current_surah: number | null;
  current_juz: number | null;
  memorization_quality: string | null;
  student_id: string;
  students: { name: string } | null;
};

export const RecentActivity = ({ teacherId, isAdmin = false }: RecentActivityProps) => {
  const navigate = useNavigate();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["recent-progress-activity", teacherId, isAdmin],
    queryFn: async (): Promise<ProgressEntry[]> => {
      let query = supabase
        .from("progress")
        .select("id, created_at, current_surah, current_juz, memorization_quality, student_id, students(name)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!isAdmin && teacherId) {
        const { data: classes } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", [teacherId]);
        const studentIds = (classes || [])
          .flatMap((c: { current_students?: string[] }) => c.current_students || [])
          .filter((id: string, i: number, arr: string[]) => id && arr.indexOf(id) === i);
        if (studentIds.length > 0) {
          query = query.in("student_id", studentIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ProgressEntry[];
    },
    enabled: isAdmin || !!teacherId,
  });

  const qualityColor = (q: string | null) => {
    switch (q?.toLowerCase()) {
      case "excellent": return "text-green-600";
      case "good": return "text-blue-500";
      case "fair": return "text-amber-500";
      case "poor": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 font-semibold text-gray-800 text-lg">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          Recent Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
        ) : !activity || activity.length === 0 ? (
          <div className="text-center p-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-1">No recent progress entries</div>
            <div className="text-xs text-muted-foreground">Entries will appear here as they are logged</div>
          </div>
        ) : (
          <ul className="space-y-2">
            {activity.map((entry) => {
              const name = entry.students?.name ?? "Unknown";
              const ago = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-2 text-sm cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => navigate(`/students/${entry.student_id}`)}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate block">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      Juz {entry.current_juz ?? "—"}, Surah {entry.current_surah ?? "—"}
                      {entry.memorization_quality && (
                        <span className={` · ${qualityColor(entry.memorization_quality)}`}>
                          {entry.memorization_quality}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{ago}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
