/**
 * Reusable Metric Card Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  status?: "excellent" | "good" | "warning" | "critical";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  status,
  className,
}: MetricCardProps) {
  const statusColors = {
    excellent: "border-green-200 bg-green-50",
    good: "border-blue-200 bg-blue-50",
    warning: "border-yellow-200 bg-yellow-50",
    critical: "border-red-200 bg-red-50",
  };

  const statusTextColors = {
    excellent: "text-green-700",
    good: "text-blue-700",
    warning: "text-yellow-700",
    critical: "text-red-700",
  };

  return (
    <Card className={cn("border", status ? statusColors[status] : "border-gray-200 bg-white", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn(
                "text-2xl font-bold",
                status ? statusTextColors[status] : "text-gray-900"
              )}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              status === "excellent" ? "bg-green-100" :
              status === "good" ? "bg-blue-100" :
              status === "warning" ? "bg-yellow-100" :
              status === "critical" ? "bg-red-100" :
              "bg-gray-100"
            )}>
              {icon}
            </div>
          )}
        </div>
        {status === "critical" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="h-3 w-3" />
            <span>Requires immediate attention</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

