
import React from 'react';
import { cn } from '@/lib/utils';

interface EnhancedTableProps {
  children: React.ReactNode;
  className?: string;
}

export const EnhancedTable: React.FC<EnhancedTableProps> = ({ children, className }) => {
  return (
    <div className={cn("table-enhanced", className)}>
      <table className="min-w-full">
        {children}
      </table>
    </div>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'pending';
  children: React.ReactNode;
}

export const EnhancedStatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const statusClasses = {
    active: 'status-badge-active',
    inactive: 'status-badge-inactive',
    warning: 'status-badge-warning',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm border",
      statusClasses[status]
    )}>
      <span className={cn(
        "w-2 h-2 rounded-full mr-2",
        status === 'active' && "bg-emerald-500",
        status === 'inactive' && "bg-gray-400",
        status === 'warning' && "bg-amber-500",
        status === 'pending' && "bg-blue-500"
      )} />
      {children}
    </span>
  );
};

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const EnhancedProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  className,
  showLabel = false 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={cn("progress-bar-enhanced", className)}>
      <div 
        className="progress-fill"
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};
