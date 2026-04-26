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
  const iconColors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-150",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer hover:shadow-md hover:border-gray-200",
      )}
    >
      <div className={cn("inline-flex p-2.5 rounded-xl mb-4", iconColors[color])}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
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

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <QuickActionCard key={index} {...action} />
      ))}
    </div>
  );
};
