import React from "react";
import { Card } from "@/components/ui/card.tsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole.ts";

interface TrendProps {
  value: number;
  isPositive: boolean;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: TrendProps;
}

export const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => {
  const { isAdmin } = useUserRole();

  return (
    <Card
      className={`stats-card ${isAdmin ? "glass-effect" : ""} overflow-hidden`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3
            className={`text-sm font-medium ${
              isAdmin ? "text-amber-400" : "text-muted-foreground"
            }`}
          >
            {title}
          </h3>
          {icon && (
            <div
              className={`${
                isAdmin ? "bg-amber-500/10 p-1.5 rounded-full" : ""
              }`}
            >
              <div
                className={`${
                  isAdmin ? "text-amber-500" : "text-muted-foreground"
                }`}
              >
                {icon}
              </div>
            </div>
          )}
        </div>
        <div className={`mt-2 flex items-baseline`}>
          <p
            className={`text-2xl font-semibold ${isAdmin ? "text-white" : ""}`}
          >
            {value}
          </p>
          {trend && (
            <span
              className={`ml-2 text-xs flex items-center ${
                trend.isPositive
                  ? isAdmin ? "text-green-400" : "text-green-500"
                  : isAdmin
                  ? "text-red-400"
                  : "text-red-500"
              }`}
            >
              {trend.isPositive
                ? <ArrowUp className="mr-1 h-3 w-3" />
                : <ArrowDown className="mr-1 h-3 w-3" />}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
