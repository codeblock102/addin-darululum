import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client.ts";
import { Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TodayStudentsProps {
  teacherId?: string;
  isAdmin?: boolean;
}

export const TodayStudents = ({ teacherId, isAdmin = false }: TodayStudentsProps) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ["today-attendance", teacherId, today, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("id, student_id, status, students(name)")
        .eq("date", today);

      // For teachers, scope to their students via classes
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

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin || !!teacherId,
  });

  const present = todayAttendance?.filter((a) => a.status?.toLowerCase() === "present").length ?? 0;
  const absent = todayAttendance?.filter((a) => a.status?.toLowerCase() === "absent").length ?? 0;
  const total = todayAttendance?.length ?? 0;

  return (
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 font-semibold text-gray-800 text-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
        ) : total === 0 ? (
          <div className="text-center p-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-1">No attendance recorded today</div>
            <div className="text-xs text-muted-foreground">Check back once attendance has been marked</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="text-muted-foreground">{present} present</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="text-muted-foreground">{absent} absent</span>
              </span>
              <span className="ml-auto text-muted-foreground text-xs">{total} total</span>
            </div>
            <ul className="space-y-1.5">
              {todayAttendance?.slice(0, 8).map((record) => {
                const name = (record.students as { name?: string } | null)?.name ?? "Unknown";
                const status = record.status?.toLowerCase() ?? "";
                const dot = status === "present" ? "bg-green-500" : status === "absent" ? "bg-red-400" : "bg-amber-400";
                return (
                  <li
                    key={record.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/students/${record.student_id}`)}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="truncate">{name}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">{record.status}</span>
                  </li>
                );
              })}
            </ul>
            {total > 8 && (
              <p className="text-xs text-muted-foreground text-right">+{total - 8} more</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
