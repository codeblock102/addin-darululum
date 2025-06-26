import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "title" | "card" | "circle" | "button";
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "text",
}) => {
  const variantClasses = {
    text: "skeleton-text",
    title: "skeleton-title",
    card: "skeleton-card",
    circle: "skeleton-loader w-12 h-12 rounded-full",
    button: "skeleton-loader h-10 w-24 rounded-xl",
  };

  return <div className={cn(variantClasses[variant], className)} />;
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <LoadingSkeleton variant="title" className="w-64" />
        <LoadingSkeleton variant="button" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <LoadingSkeleton variant="circle" />
              <LoadingSkeleton variant="text" className="w-16" />
            </div>
            <LoadingSkeleton variant="title" className="w-20 mb-2" />
            <LoadingSkeleton variant="text" className="w-32" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <LoadingSkeleton key={i} variant="card" className="h-64" />
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="table-enhanced">
      <table className="min-w-full">
        <thead>
          <tr>
            {[1, 2, 3, 4].map((i) => (
              <th key={i} className="px-6 py-4">
                <LoadingSkeleton variant="text" className="w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4].map((j) => (
                <td key={j} className="px-6 py-4">
                  <LoadingSkeleton variant="text" className="w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
