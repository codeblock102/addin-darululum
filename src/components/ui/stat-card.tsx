import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type StatCardTone = "default" | "success" | "warning" | "info";

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: StatCardTone;
  index?: number;
}

/**
 * Quiet, content-first stat card.
 *
 * On mobile we render as a horizontal hairline row so a list of stats
 * stacks like a settings sheet. On desktop (lg+) we promote to a bordered
 * card. The `tone` prop only adjusts a 2px left-border accent — no
 * gradients, no decorative bubbles.
 */
const TONE_BORDER: Record<StatCardTone, string> = {
  default: "border-l-border",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  info: "border-l-sky-500",
};

const TONE_ICON: Record<StatCardTone, string> = {
  default: "text-muted-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-sky-600 dark:text-sky-400",
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  function StatCard(
    { label, value, hint, icon, tone = "default", index = 0, className, ...rest },
    ref,
  ) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 24,
          mass: 0.6,
          delay: index * 0.06,
        }}
        whileHover={{ scale: 1.01 }}
        className={cn(
          // Mobile: hairline divider row.
          "flex items-center justify-between gap-4 border-b border-border py-3",
          // Desktop: full card, no bottom rule. Subtle hover lift.
          "lg:block lg:rounded-lg lg:border lg:border-border lg:bg-card lg:p-4 lg:shadow-none lg:transition-shadow lg:hover:shadow-md",
          // Tone accent — visible at any breakpoint (2px brand-tinted strip).
          "border-l-2 pl-3 lg:pl-4",
          TONE_BORDER[tone],
          className,
        )}
        {...rest}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground",
              "mt-0 lg:mt-2",
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[12px] leading-tight text-muted-foreground/80">
              {hint}
            </p>
          ) : null}
        </div>

        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center",
              "lg:hidden",
              TONE_ICON[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </motion.div>
    );
  },
);

StatCard.displayName = "StatCard";

export default StatCard;
