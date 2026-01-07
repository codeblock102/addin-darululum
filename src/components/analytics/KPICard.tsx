/**
 * Enhanced KPI Card Component
 * With threshold colors, trend arrows, comparisons, and actions
 */

import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { ThresholdStatus, TrendData, KPIDefinition } from "@/types/dashboard.ts";

interface KPICardProps {
  definition: KPIDefinition;
  value: number;
  trend?: TrendData;
  status: ThresholdStatus;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function KPICard({
  definition,
  value,
  trend,
  status,
  onClick,
  className,
  icon,
}: KPICardProps) {
  const statusStyles = {
    green: {
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
      iconBg: "bg-green-100",
    },
    yellow: {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      iconBg: "bg-yellow-100",
    },
    red: {
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-700",
      iconBg: "bg-red-100",
    },
  };

  const style = statusStyles[status];

  const formatValue = () => {
    switch (definition.displayType) {
      case "percentage":
        return `${Math.round(value)}${definition.unit || "%"}`;
      case "number":
        return `${value.toFixed(definition.unit === "pages/week" ? 1 : 0)}${definition.unit ? ` ${definition.unit}` : ""}`;
      case "count":
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:shadow-md",
        style.border,
        style.bg,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 mb-1">{definition.name}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn("text-2xl font-bold", style.text)}>
                {formatValue()}
              </p>
              {trend && definition.comparisonPeriod !== "none" && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend.change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            {trend && definition.comparisonPeriod !== "none" && (
              <p className="text-xs text-gray-500 mt-1">
                {trend.isPositive ? "Up" : "Down"} from {definition.comparisonPeriod === "week" ? "last week" : "last month"}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", style.iconBg)}>
              {icon}
            </div>
          )}
        </div>

        {status === "red" && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-red-700 mb-1">Action Required</p>
                <p className="text-xs text-red-600">{definition.redAction}</p>
              </div>
            </div>
          </div>
        )}

        {onClick && definition.drillDown?.enabled && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

