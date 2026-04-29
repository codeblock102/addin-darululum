import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { ScheduleCalendar } from "@/components/teacher-portal/schedule/ScheduleCalendar.tsx";
import { AdminPageShell } from "@/components/admin/AdminPageShell.tsx";
import { Calendar } from "lucide-react";

type TeacherLite = { id: string; name: string };

type ClassLite = {
  id: string;
  name: string;
  teacher_ids?: string[];
  time_slots: { days: string[]; start_time: string; end_time: string; teacher_ids?: string[] }[] | null;
};

export default function TeacherSchedules() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);

  const { data: teacherList = [], isLoading: loadingTeachers } = useQuery<TeacherLite[]>({
    queryKey: ["admin-teacher-schedule-teachers", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", session.user.id)
        .single();
      if (adminError) {
        toast({ title: "Error", description: adminError.message, variant: "destructive" });
        return [];
      }
      const madrassahId = adminProfile?.madrassah_id;
      if (!madrassahId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "teacher")
        .eq("madrassah_id", madrassahId)
        .order("name", { ascending: true });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return [];
      }
      return (data || []).map((t) => ({ id: t.id, name: t.name || "Unnamed" }));
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!selectedTeacherId && teacherList.length > 0) {
      setSelectedTeacherId(teacherList[0].id);
    }
  }, [teacherList, selectedTeacherId]);

  const { data: classes = [] } = useQuery<ClassLite[]>({
    queryKey: ["admin-teacher-schedule-classes", selectedTeacherId],
    queryFn: async () => {
      if (!selectedTeacherId) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, teacher_ids, time_slots")
        .contains("teacher_ids", `{${selectedTeacherId}}`);
      if (error) {
        toast({ title: "Error loading classes", description: error.message, variant: "destructive" });
        return [];
      }
      return (data || []) as ClassLite[];
    },
    enabled: !!selectedTeacherId,
  });

  const calendarClasses = useMemo(() => {
    // Ensure time_slots is always an array for the calendar
    return (classes || []).map((c) => ({
      ...c,
      time_slots: Array.isArray(c.time_slots) ? c.time_slots : [],
    }));
  }, [classes]);

  return (
    <AdminPageShell
      title="Teacher Schedules"
      subtitle="View and manage weekly class schedules by teacher"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-green-50 rounded-lg">
            <Calendar className="h-4 w-4 text-green-700" />
          </div>
          <div className="flex-1">
            <div className="max-w-xs">
              <Label className="text-xs font-medium text-gray-500 mb-1 block">Select Teacher</Label>
              <Select value={selectedTeacherId} onValueChange={(v) => setSelectedTeacherId(v)}>
                <SelectTrigger className="rounded-xl border-gray-200 h-9">
                  <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Choose a teacher"} />
                </SelectTrigger>
                <SelectContent>
                  {teacherList.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="p-6 h-[70vh]">
          <ScheduleCalendar classes={calendarClasses as any} teacherId={selectedTeacherId} />
        </div>
      </div>
    </AdminPageShell>
  );
}



