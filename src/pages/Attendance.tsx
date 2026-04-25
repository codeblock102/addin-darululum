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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  List,
  Settings,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminPageShell.tsx";

const Attendance = () => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  const [longTermOpen, setLongTermOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  // Derived stats — all from already-fetched data, zero extra queries
  const attendedStatuses = new Set(["present", "late", "excused", "early_departure"]);
  const sl = (s: string) => s?.toLowerCase() ?? "";

  const attendedToday  = todayRows.filter((r) => attendedStatuses.has(sl(r.status))).length;
  const absentToday    = todayRows.filter((r) => sl(r.status) === "absent").length;
  const lateToday      = todayRows.filter((r) => sl(r.status) === "late").length;
  const weekAttended   = weekRows.filter((r) => attendedStatuses.has(sl(r.status))).length;
  const weekTotal      = weekRows.length;

  const todayPct  = activeStudentsCount > 0 ? Math.round((attendedToday / activeStudentsCount) * 1000) / 10 : 0;
  const absentPct = activeStudentsCount > 0 ? Math.round((absentToday   / activeStudentsCount) * 1000) / 10 : 0;
  const latePct   = attendedToday       > 0 ? Math.round((lateToday     / attendedToday)       * 1000) / 10 : 0;
  const weekPct   = weekTotal           > 0 ? Math.round((weekAttended  / weekTotal)            * 1000) / 10 : 0;

  const TAB_TRIGGER = "flex items-center gap-2 py-3 px-0 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none";

  return (
    <AdminPageShell
      title={t("pages.attendance.headerTitle")}
      subtitle={t("pages.attendance.headerDesc")}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl border-gray-200 h-9 w-9 p-0 text-gray-500 hover:text-gray-700"
            title="Attendance settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLongTermOpen(true)}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-9 text-xs"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Multi-day Absence
          </Button>
        </div>
      }
    >
      {/* Modals */}
      <LongTermAbsenceModal open={longTermOpen} onClose={() => setLongTermOpen(false)} />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Attendance Settings</DialogTitle>
          </DialogHeader>
          <AttendanceCutoffSettings />
        </DialogContent>
      </Dialog>

      {/* 4-card KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Present Today"
          value={`${attendedToday} / ${activeStudentsCount}`}
          meta={`${todayPct.toFixed(1)}% attendance rate`}
          metaColor="text-green-700"
          icon={<UserCheck className="h-4 w-4 text-green-700" />}
          iconBg="bg-green-50"
        />
        <AdminStatCard
          label="Absent Today"
          value={String(absentToday)}
          meta={`${absentPct.toFixed(1)}% of enrolled`}
          metaColor="text-red-600"
          icon={<UserX className="h-4 w-4 text-red-600" />}
          iconBg="bg-red-50"
        />
        <AdminStatCard
          label="Late Today"
          value={String(lateToday)}
          meta={`${latePct.toFixed(1)}% of present`}
          metaColor="text-amber-600"
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <AdminStatCard
          label="7-Day Average"
          value={`${weekPct.toFixed(1)}%`}
          meta={`${weekAttended} of ${weekTotal} records`}
          metaColor="text-blue-600"
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-50"
        />
      </div>

      {/* Progress bar strip */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-4">
        <span className="text-xs font-medium text-gray-500 shrink-0">Today's attendance</span>
        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${todayPct}%`,
              background: "linear-gradient(90deg, #15803d, #166534)",
            }}
          />
        </div>
        <span className="text-xs font-bold text-green-800 shrink-0 w-10 text-right">
          {todayPct.toFixed(1)}%
        </span>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="border-b border-gray-100 px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none">
              <TabsTrigger value="take-attendance" className={TAB_TRIGGER}>
                <CalendarCheck className="h-4 w-4" />
                {t("pages.attendance.tabs.take")}
              </TabsTrigger>
              <TabsTrigger value="records" className={TAB_TRIGGER}>
                <List className="h-4 w-4" />
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
