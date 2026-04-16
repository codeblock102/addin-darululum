import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "./StatsCard.tsx";
import { BookOpen, Clock, GraduationCap, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useUserRole } from "@/hooks/useUserRole.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

export const DashboardStats = () => {
  const { isAdmin } = useUserRole();
  const { t } = useI18n();

  const { data: studentsCount } = useQuery({
    queryKey: ["studentsCount"],
    queryFn: async () => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: progressStats } = useQuery({
    queryKey: ["progressStats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("progress")
        .select("memorization_quality")
        .not("memorization_quality", "is", null);

      const excellentOrGood = data?.filter((p) =>
        p.memorization_quality === "excellent" ||
        p.memorization_quality === "good"
      ).length || 0;

      const total = data?.length || 0;
      return total ? Math.round((excellentOrGood / total) * 100) : 0;
    },
  });

  const { data: attendanceRate } = useQuery({
    queryKey: ["attendanceRate"],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status");
      if (!data || data.length === 0) return 0;
      const present = data.filter((a) => a.status?.toLowerCase() === "present").length;
      return Math.round((present / data.length) * 100);
    },
  });

  const { data: activeClasses } = useQuery({
    queryKey: ["activeClasses"],
    queryFn: async () => {
      const { count } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count || 0;
    },
  });

  const iconClass = isAdmin ? "text-amber-400" : "text-primary";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title={t("pages.dashboard.stats.totalStudents")}
        value={studentsCount?.toString() || "0"}
        icon={<Users className={iconClass} size={24} />}
      />
      <StatsCard
        title={t("pages.dashboard.stats.averageAttendance")}
        value={attendanceRate !== undefined ? `${attendanceRate}%` : "—"}
        icon={<Clock className={iconClass} size={24} />}
      />
      <StatsCard
        title={t("pages.dashboard.stats.completionRate")}
        value={`${progressStats || 0}%`}
        icon={<GraduationCap className={iconClass} size={24} />}
      />
      <StatsCard
        title={t("pages.dashboard.stats.activeClasses")}
        value={activeClasses?.toString() || "0"}
        icon={<BookOpen className={iconClass} size={24} />}
      />
    </div>
  );
};
