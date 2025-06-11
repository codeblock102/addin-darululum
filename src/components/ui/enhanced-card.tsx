import React from "react";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className,
  hover = true,
  gradient = false,
}) => {
  return (
    <div
      className={cn(
        "modern-card",
        hover && "hover:shadow-xl hover:-translate-y-1",
        gradient &&
          "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "purple" | "amber";
}

export const EnhancedStatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className="stats-card-enhanced group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "stats-card-icon",
            `bg-gradient-to-br ${colorClasses[color]}`,
          )}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center text-sm font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600",
            )}
          >
            <span className="mr-1">
              {trend.isPositive ? "↗" : "↘"}
            </span>
            {trend.value}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {title}
        </p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EnhancedEmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="empty-state-enhanced">
      <div className="empty-state-icon">
        {icon}
      </div>

      <h3 className="empty-state-title">
        {title}
      </h3>

      <p className="empty-state-description">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary-enhanced"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
