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
  /** Optional Lucide icon element to show in the header strip icon container */
  icon?: ReactNode;
  /** Background color class for the icon container, e.g. "bg-green-50" */
  iconBg?: string;
  children: ReactNode;
  className?: string;
  /** Remove max-w constraint for full-width pages */
  fullWidth?: boolean;
}

export const AdminPageShell = ({
  title,
  subtitle,
  actions,
  icon,
  iconBg = "bg-green-50",
  children,
  className,
  fullWidth = false,
}: AdminPageShellProps) => (
  <div className="min-h-screen bg-[#f5f6fa]">
    {/* Luxury page header strip */}
    <div className="bg-white border-b border-gray-100 px-6 sm:px-8 py-6">
      <div className={cn(fullWidth ? "w-full" : "max-w-7xl mx-auto", "flex items-center justify-between gap-4")}>
        <div className="flex items-center gap-4">
          {icon && (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#111827" }}>{title}</h1>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-wrap shrink-0">{actions}</div>
        )}
      </div>
    </div>

    {/* Page content */}
    <div className={cn(fullWidth ? "w-full" : "max-w-7xl mx-auto", "space-y-6 p-6 md:p-8", className)}>
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
      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm",
      className,
    )}
    style={{ background: "linear-gradient(135deg, #052e16 0%, #166534 100%)", color: "#ffffff" }}
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
