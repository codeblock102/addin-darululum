import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Sticky page header used across madrasah dashboards.
 *
 * Mobile: title → description → actions stacked vertically.
 * Desktop (lg+): title/description on the left, actions on the right.
 *
 * Sticks to the top of the scroll container; padding tightens once
 * stuck to reduce vertical footprint.
 */
export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  function PageHeader(
    { title, description, icon, actions, className, ...rest },
    ref,
  ) {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-20",
          "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "border-b border-border",
          "px-4 py-4 lg:px-8 lg:py-3",
          "transition-[padding] duration-200",
          className,
        )}
        {...rest}
      >
        <div
          className={cn(
            "flex flex-col gap-3",
            "lg:flex-row lg:items-center lg:justify-between lg:gap-6",
          )}
        >
          <div className="flex items-start gap-3 lg:items-center">
            {icon ? (
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
              >
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-display text-2xl font-semibold tracking-tight text-foreground lg:text-3xl",
                  "truncate",
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground lg:text-base">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="flex flex-row flex-wrap items-center gap-2 lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
    );
  },
);

PageHeader.displayName = "PageHeader";

export default PageHeader;
