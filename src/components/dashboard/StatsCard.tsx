import React from "react";
import { Card } from "@/components/ui/card.tsx";
import { ArrowDown, ArrowUp } from "lucide-react";

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
  return (
    <Card className="border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <span
              className={`text-xs flex items-center font-medium ${
                trend.isPositive ? "text-green-600" : "text-red-500"
              }`}
            >
              {trend.isPositive
                ? <ArrowUp className="mr-0.5 h-3 w-3" />
                : <ArrowDown className="mr-0.5 h-3 w-3" />}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
