/**
 * Alert Banner Component
 * Always visible when critical/high alerts exist
 */

import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { AlertTriangle, X, ChevronRight } from "lucide-react";
import type { AnalyticsAlert } from "@/types/analytics.ts";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface AlertBannerProps {
  alerts: AnalyticsAlert[];
  onDismiss?: () => void;
}

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="border-2 border-red-300 bg-red-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-red-900">
                  {criticalCount > 0 && highCount > 0
                    ? `${criticalCount} Critical, ${highCount} High Priority Alerts`
                    : criticalCount > 0
                    ? `${criticalCount} Critical Alert${criticalCount > 1 ? "s" : ""}`
                    : `${highCount} High Priority Alert${highCount > 1 ? "s" : ""}`}
                </h3>
                <Badge variant="destructive">Action Required</Badge>
              </div>
              <p className="text-sm text-red-700">
                Immediate attention needed. Review and assign interventions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/analytics?tab=alerts")}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              View Alerts
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-red-600 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

