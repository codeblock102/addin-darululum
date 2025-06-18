
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedAdminHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  action?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export const EnhancedAdminHeader = ({
  title,
  description,
  badge,
  badgeVariant = "default",
  action,
  breadcrumbs,
  className,
}: EnhancedAdminHeaderProps) => {
  return (
    <div className={cn("admin-header p-6 mb-8", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {breadcrumbs && (
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-2 text-gray-400">/</span>
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-300">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Header Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="admin-title text-3xl sm:text-4xl font-bold tracking-tight">
                {title}
              </h1>
              {badge && (
                <Badge variant={badgeVariant} className="text-xs font-medium">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Action Button */}
          {action && (
            <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
