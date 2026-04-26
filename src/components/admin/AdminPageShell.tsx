/**
 * AdminPageShell — shared page wrapper for every admin view.
 * Provides the consistent Donezo-style page header (title + subtitle + actions)
 * and the correct padding/max-width.
 *
 * Usage:
 *   <AdminPageShell
 *     title="Students"
 *     subtitle="Manage and view all enrolled students"
 *     actions={<button ...>Add Student</button>}
 *   >
 *     {content}
 *   </AdminPageShell>
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  /** Slot for top-right action buttons */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Remove max-w constraint for full-width pages */
  fullWidth?: boolean;
}

export const AdminPageShell = ({
  title,
  subtitle,
  actions,
  children,
  className,
  fullWidth = false,
}: AdminPageShellProps) => (
  <div className="min-h-screen bg-[#f5f6fa] p-6 md:p-8">
    <div className={cn(fullWidth ? "w-full" : "max-w-7xl mx-auto", "space-y-6", className)}>
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-wrap">{actions}</div>
        )}
      </div>

      {/* Page content */}
      {children}
    </div>
  </div>
);

// ─── Reusable action button styles ───────────────────────────────────────────

export const AdminPrimaryBtn = ({
  onClick,
  children,
  className,
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm",
      className,
    )}
  >
    {children}
  </button>
);

export const AdminSecondaryBtn = ({
  onClick,
  children,
  className,
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors",
      className,
    )}
  >
    {children}
  </button>
);

// ─── Stat card (Donezo metric card — white, soft shadow) ─────────────────────

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconBg?: string;
  meta?: string;
  metaColor?: string;
  onClick?: () => void;
}

export const AdminStatCard = ({
  label,
  value,
  icon,
  iconBg = "bg-gray-100",
  meta,
  metaColor = "text-gray-500",
  onClick,
}: AdminStatCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow w-full"
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={cn("p-2.5 rounded-xl", iconBg)}>{icon}</div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
    {meta && (
      <p className={cn("text-xs font-medium", metaColor)}>{meta}</p>
    )}
  </button>
);
