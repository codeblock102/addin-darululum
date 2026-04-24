import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { AttendanceForm } from "@/components/attendance/AttendanceForm.tsx";
import { AttendanceTable } from "@/components/attendance/AttendanceTable.tsx";
import { AttendanceCutoffSettings } from "@/components/attendance/AttendanceCutoffSettings.tsx";
import { LongTermAbsenceModal } from "@/components/attendance/LongTermAbsenceModal.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminPageShell.tsx";

const Attendance = () => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  const [longTermOpen, setLongTermOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAdmin, isAttendanceTaker, isLoading } = useRBAC();

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin && !isAttendanceTaker) {
      navigate("/");
    }
  }, [isLoading, isAdmin, isAttendanceTaker, navigate]);

  // Dates
  const todayYmd = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgoYmd = format(subDays(new Date(), 6), "yyyy-MM-dd");

  // Active students count
  const { data: activeStudentsCount = 0 } = useQuery({
    queryKey: ["active-students-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count || 0;
    },
  });

  // Today's attendance records
  type TodayRow = { id: string; status: string };
  const { data: todayRows = [] } = useQuery<TodayRow[]>({
    queryKey: ["attendance-today", todayYmd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, status")
        .eq("date", todayYmd);
      if (error) throw error;
      return (data || []) as TodayRow[];
    },
  });

  // Last 7 days attendance records (including today)
  type WeekRow = { id: string; status: string };
  const { data: weekRows = [] } = useQuery<WeekRow[]>({
    queryKey: ["attendance-week", sevenDaysAgoYmd, todayYmd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, status, date")
        .gte("date", sevenDaysAgoYmd)
        .lte("date", todayYmd);
      if (error) throw error;
      return (data || []) as WeekRow[];
    },
  });

  // Computations
  const attendedStatuses = new Set(["present", "late", "excused", "early_departure"]);
  const attendedToday = todayRows.filter((r) => attendedStatuses.has(r.status?.toLowerCase?.() || "")).length;
  const todayPct = activeStudentsCount > 0 ? Math.round((attendedToday / activeStudentsCount) * 1000) / 10 : 0;

  const weekAttended = weekRows.filter((r) => attendedStatuses.has(r.status?.toLowerCase?.() || "")).length;
  const weekTotal = weekRows.length;
  const weekPct = weekTotal > 0 ? Math.round((weekAttended / weekTotal) * 1000) / 10 : 0;

  const statsCards = [
    {
      title: t("pages.attendance.statToday"),
      value: `${attendedToday}/${activeStudentsCount}`,
      percentage: `${todayPct.toFixed(1)}%`,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      title: t("pages.attendance.statWeek"),
      value: `${weekAttended}/${weekTotal}`,
      percentage: `${weekPct.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
  ];

  return (
    <AdminPageShell
      title={t("pages.attendance.headerTitle")}
      subtitle={t("pages.attendance.headerDesc")}
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <CalendarCheck className="h-3.5 w-3.5 inline mr-1.5 text-green-600" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {statsCards.map((stat, index) => (
          <AdminStatCard
            key={index}
            label={stat.title}
            value={`${stat.value} (${stat.percentage})`}
            icon={<stat.icon className="h-4 w-4" style={{ color: index === 0 ? "#16a34a" : "#2563eb" }} />}
            iconBg={index === 0 ? "bg-green-50" : "bg-blue-50"}
          />
        ))}
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <Users className="h-4 w-4 text-green-700" />
              </div>
              {t("pages.attendance.dashboardTitle")}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("pages.attendance.dashboardDesc")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLongTermOpen(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl"
          >
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Multi-day Absence
          </Button>
        </div>

        {/* Long-term absence modal */}
        <LongTermAbsenceModal open={longTermOpen} onClose={() => setLongTermOpen(false)} />

        <div className="p-4 sm:p-6">
          <AttendanceCutoffSettings />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="border-b border-gray-100 px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none">
              <TabsTrigger
                value="take-attendance"
                className="flex items-center gap-2 py-3 px-0 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>{t("pages.attendance.tabs.take")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="records"
                className="flex items-center gap-2 py-3 px-0 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none"
              >
                <Users className="h-4 w-4" />
                <span>{t("pages.attendance.tabs.records")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="take-attendance" className="mt-0">
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">{t("pages.attendance.recordTitle")}</h3>
                  <p className="text-sm text-gray-500">{t("pages.attendance.recordDesc")}</p>
                </div>
                <AttendanceForm />
              </div>
            </TabsContent>

            <TabsContent value="records" className="mt-0">
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">{t("pages.attendance.historyTitle")}</h3>
                  <p className="text-sm text-gray-500">{t("pages.attendance.historyDesc")}</p>
                </div>
                <AttendanceTable />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminPageShell>
  );
};

export default Attendance;
