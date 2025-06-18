
import { ReactNode } from "react";
import { EnhancedAdminHeader } from "./EnhancedAdminHeader";
import { cn } from "@/lib/utils";

interface EnhancedAdminDashboardProps {
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
  className?: string;
}

export const EnhancedAdminDashboard = ({
  title,
  description,
  badge,
  action,
  breadcrumbs,
  children,
  className,
}: EnhancedAdminDashboardProps) => {
  return (
    <div className={cn("min-h-screen admin-theme", className)}>
      <EnhancedAdminHeader
        title={title}
        description={description}
        badge={badge}
        action={action}
        breadcrumbs={breadcrumbs}
      />
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {children}
      </div>
    </div>
  );
};
