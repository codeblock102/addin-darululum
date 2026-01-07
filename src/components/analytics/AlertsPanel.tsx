/**
 * Alerts Panel Component - Immediate Action
 * Purpose: "What requires action right now?"
 * Shows pre-computed alerts from summary table
 * Fast load: ≤2 queries (summary + alerts)
 */

import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary.ts";
import { useAnalyticsAlertsSummary } from "@/hooks/useAnalyticsAlertsSummary.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { AlertTriangle, X, CheckCircle, Loader2 } from "lucide-react";
import type { AlertType, AlertSeverity } from "@/types/analytics.ts";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";

interface AlertsPanelProps {
  className?: string;
}

export function AlertsPanel({
  className,
}: AlertsPanelProps) {
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: alerts = [], isLoading: alertsLoading } = useAnalyticsAlertsSummary(undefined, "active");
  
  const isLoading = summaryLoading || alertsLoading;
  const [filterType, setFilterType] = useState<AlertType | "all">("all");
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"active" | "all">("active");

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType !== "all" && alert.type !== filterType) return false;
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && alert.status !== filterStatus) return false;
    return true;
  });

  const severityColors: Record<AlertSeverity, string> = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const typeLabels: Record<AlertType, string> = {
    missed_sessions_threshold: "Missed Sessions",
    memorization_pace_drop: "Pace Drop",
    high_at_risk_concentration: "At-Risk Concentration",
    class_overcapacity: "Class Overcapacity",
    excessive_teacher_cancellations: "Excessive Cancellations",
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-600">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Alerts & Triggers
            {filteredAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {filteredAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </div>
        <div className="flex gap-2 mt-4">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as AlertType | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as AlertSeverity | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "active" | "all")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredAlerts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {alerts.length === 0 ? "No alerts" : "No alerts match the current filters"}
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={severityColors[alert.severity]}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">{typeLabels[alert.type]}</Badge>
                      {alert.status === "active" && (
                        <Badge variant="destructive">Active</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{alert.entityType}: {alert.entityName}</span>
                      <span>•</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span>•</span>
                      <span>Current: {alert.currentValue}</span>
                      <span>•</span>
                      <span>{format(new Date(alert.createdAt), "MMM dd, yyyy HH:mm")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await supabase
                            .from("analytics_alerts")
                            .update({ 
                              status: "acknowledged",
                              acknowledged_at: new Date().toISOString(),
                            })
                            .eq("id", alert.id);
                          window.location.reload();
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    {alert.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await supabase
                            .from("analytics_alerts")
                            .update({ 
                              status: "resolved",
                              resolved_at: new Date().toISOString(),
                            })
                            .eq("id", alert.id);
                          window.location.reload();
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

