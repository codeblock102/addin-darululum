import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { ScheduleCalendar } from "@/components/teacher-portal/schedule/ScheduleCalendar.tsx";

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

  const { data: classes = [], isLoading: loadingClasses } = useQuery<ClassLite[]>({
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Schedules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Label>Select Teacher</Label>
            <Select value={selectedTeacherId} onValueChange={(v) => setSelectedTeacherId(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Choose a teacher"} />
              </SelectTrigger>
              <SelectContent>
                {teacherList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-[70vh]">
            <ScheduleCalendar classes={calendarClasses as any} teacherId={selectedTeacherId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



