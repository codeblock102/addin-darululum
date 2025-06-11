import React from "react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: "blue" | "green" | "purple" | "amber";
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  disabled = false,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "quick-action-card",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer hover:shadow-xl hover:scale-105",
      )}
    >
      <div className="relative z-10">
        <div
          className={cn(
            "quick-action-icon",
            `bg-gradient-to-br ${colorClasses[color]}`,
          )}
        >
          {icon}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

interface QuickActionsGridProps {
  actions: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    color?: "blue" | "green" | "purple" | "amber";
  }>;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = (
  { actions },
) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {actions.map((action, index) => (
        <QuickActionCard
          key={index}
          {...action}
        />
      ))}
    </div>
  );
};
