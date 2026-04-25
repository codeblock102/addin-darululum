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
import { CalendarCheck, CalendarDays, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminPageShell.tsx";

const Attendance = () => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  const [longTermOpen, setLongTermOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isAttendanceTaker, isLoading } = useRBAC();

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin && !isAttendanceTaker) navigate("/");
  }, [isLoading, isAdmin, isAttendanceTaker, navigate]);

  const todayYmd = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgoYmd = format(subDays(new Date(), 6), "yyyy-MM-dd");

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

  const attendedStatuses = new Set(["present", "late", "excused", "early_departure"]);
  const attendedToday = todayRows.filter((r) => attendedStatuses.has(r.status?.toLowerCase?.() || "")).length;
  const todayPct = activeStudentsCount > 0 ? Math.round((attendedToday / activeStudentsCount) * 1000) / 10 : 0;
  const weekAttended = weekRows.filter((r) => attendedStatuses.has(r.status?.toLowerCase?.() || "")).length;
  const weekTotal = weekRows.length;
  const weekPct = weekTotal > 0 ? Math.round((weekAttended / weekTotal) * 1000) / 10 : 0;

  return (
    <AdminPageShell
      title={t("pages.attendance.headerTitle")}
      subtitle={t("pages.attendance.headerDesc")}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLongTermOpen(true)}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-9 text-xs"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Multi-day Absence
          </Button>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2 h-9 flex items-center">
            <CalendarCheck className="h-3.5 w-3.5 mr-1.5 text-green-600" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
      }
    >
      <LongTermAbsenceModal open={longTermOpen} onClose={() => setLongTermOpen(false)} />

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AdminStatCard
          label={t("pages.attendance.statToday")}
          value={`${attendedToday} / ${activeStudentsCount}`}
          meta={`${todayPct.toFixed(1)}% attendance rate`}
          metaColor="text-green-700"
          icon={<Users className="h-4 w-4 text-green-700" />}
          iconBg="bg-green-50"
        />
        <AdminStatCard
          label={t("pages.attendance.statWeek")}
          value={`${weekAttended} / ${weekTotal}`}
          meta={`${weekPct.toFixed(1)}% over last 7 days`}
          metaColor="text-blue-600"
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-50"
        />
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cutoff settings strip */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <AttendanceCutoffSettings />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="border-b border-gray-100 px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none">
              <TabsTrigger
                value="take-attendance"
                className="flex items-center gap-2 py-3 px-0 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none"
              >
                <CalendarCheck className="h-4 w-4" />
                {t("pages.attendance.tabs.take")}
              </TabsTrigger>
              <TabsTrigger
                value="records"
                className="flex items-center gap-2 py-3 px-0 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none"
              >
                <Users className="h-4 w-4" />
                {t("pages.attendance.tabs.records")}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="take-attendance" className="mt-0">
              <AttendanceForm />
            </TabsContent>
            <TabsContent value="records" className="mt-0">
              <AttendanceTable />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminPageShell>
  );
};

export default Attendance;
