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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Executive decision-making interface for your madrassah
          </p>
        </div>
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 text-red-600">
            <span className="font-semibold">{criticalAlerts.length} Critical Alerts</span>
          </div>
        )}
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts & Risks
            {activeAlerts.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {activeAlerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OptimizedDashboard />
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <StudentMetricsView />
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <TeacherMetricsView />
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <ClassMetricsView />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
