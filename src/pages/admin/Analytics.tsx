/**
 * Main Analytics Dashboard Page - Redesigned
 * Layer-based navigation: Executive → Students → Teachers → Classes → Alerts
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { OptimizedDashboard } from "@/components/analytics/OptimizedDashboard.tsx";
import { StudentMetricsView } from "@/components/analytics/StudentMetricsView.tsx";
import { TeacherMetricsView } from "@/components/analytics/TeacherMetricsView.tsx";
import { ClassMetricsView } from "@/components/analytics/ClassMetricsView.tsx";
import { AlertsPanel } from "@/components/analytics/AlertsPanel.tsx";
import { useAnalyticsAlertsSummary } from "@/hooks/useAnalyticsAlertsSummary.ts";
import { useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell.tsx";
import { AlertTriangle } from "lucide-react";

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const { data: alerts = [] } = useAnalyticsAlertsSummary(undefined, "active");

  const activeAlerts = alerts || [];
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical" || a.severity === "high");

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AdminPageShell
      title="Analytics Dashboard"
      subtitle="Executive decision-making interface for your madrassah"
      actions={
        criticalAlerts.length > 0 ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? "s" : ""}
          </div>
        ) : undefined
      }
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="border-b border-gray-100 px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-1 rounded-none flex">
              {[
                { value: "overview", label: "Overview" },
                { value: "students", label: "Students" },
                { value: "teachers", label: "Teachers" },
                { value: "classes", label: "Classes" },
                { value: "alerts", label: "Alerts & Risks", badge: activeAlerts.length > 0 ? activeAlerts.length : undefined },
              ].map(({ value, label, badge }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-1.5 py-3 px-3 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none"
                >
                  {label}
                  {badge !== undefined && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <OptimizedDashboard />
            </TabsContent>
            <TabsContent value="students" className="mt-0 space-y-6">
              <StudentMetricsView />
            </TabsContent>
            <TabsContent value="teachers" className="mt-0 space-y-6">
              <TeacherMetricsView />
            </TabsContent>
            <TabsContent value="classes" className="mt-0 space-y-6">
              <ClassMetricsView />
            </TabsContent>
            <TabsContent value="alerts" className="mt-0 space-y-6">
              <AlertsPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminPageShell>
  );
}
