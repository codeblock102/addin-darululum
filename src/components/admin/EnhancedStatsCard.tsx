
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

export const EnhancedStatsCard = ({
  title,
  value,
  change,
  icon: Icon,
  className,
  children,
}: EnhancedStatsCardProps) => {
  return (
    <div className={cn("admin-stats-card group", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="admin-stats-label mb-2">{title}</p>
          <div className="flex items-baseline space-x-3">
            <p className="admin-stats-value">{value}</p>
            {change && (
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  change.trend === "up" && "bg-green-100 text-green-800",
                  change.trend === "down" && "bg-red-100 text-red-800",
                  change.trend === "neutral" && "bg-gray-100 text-gray-800"
                )}
              >
                {change.value}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Icon className="w-6 h-6 text-slate-900" />
            </div>
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
