import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  ClipboardList,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

/**
 * BottomTabBar
 * ────────────
 * Mobile-only (sm:hidden) bottom tab bar for the teacher/parent shell.
 * Pairs with <LogLessonFAB />, which sits above the centre slot.
 *
 * Design contract:
 *   - 4–5 items, fixed grid (no horizontal scroll on phones)
 *   - 44×44px touch targets (Apple HIG / Material guidance)
 *   - Honors prefers-reduced-motion (no transitions when set)
 *   - Visible only below the `sm` breakpoint (640px) — desktop keeps the sidebar
 */

interface TabItem {
  href: string;
  labelKey: string;
  fallback: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const teacherTabs: TabItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", fallback: "Home", icon: Home, exact: true },
  { href: "/dashboard?tab=progress-book", labelKey: "nav.progressBook", fallback: "Progress", icon: ClipboardList },
  // Centre slot is reserved for the FAB — rendered as a spacer.
  { href: "/messages", labelKey: "nav.messages", fallback: "Messages", icon: MessageSquare },
  { href: "/schedule", labelKey: "nav.schedule", fallback: "Schedule", icon: CalendarDays },
];

const parentTabs: TabItem[] = [
  { href: "/parent", labelKey: "nav.parentDashboard", fallback: "Home", icon: Home, exact: true },
  { href: "/parent/progress", labelKey: "nav.quranProgress", fallback: "Progress", icon: ClipboardList },
  { href: "/parent/agenda", labelKey: "nav.agenda", fallback: "Agenda", icon: CalendarDays },
  { href: "/parent/messages", labelKey: "nav.messages", fallback: "Messages", icon: MessageSquare },
];

const adminTabs: TabItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", fallback: "Home", icon: Home, exact: true },
  { href: "/students", labelKey: "nav.students", fallback: "Students", icon: Users },
  { href: "/progress-book", labelKey: "nav.progressBook", fallback: "Progress", icon: ClipboardList },
  { href: "/messages", labelKey: "nav.messages", fallback: "Messages", icon: MessageSquare },
];

export const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { isAdmin, isTeacher, isParent } = useRBAC();

  // Pick tab set for the active role. Default to teacher.
  let tabs: TabItem[] = teacherTabs;
  let showFab = true;
  if (isAdmin) {
    tabs = adminTabs;
    showFab = false; // admin doesn't log lessons
  } else if (isParent) {
    tabs = parentTabs;
    showFab = false; // parent has no log-lesson action
  } else if (isTeacher) {
    tabs = teacherTabs;
    showFab = true;
  }

  const isActive = (item: TabItem) => {
    const normalize = (p?: string) => (p || "").replace(/\/+$/, "");
    const currentPath = normalize(location.pathname);
    const [targetPath, targetQuery] = item.href.split("?");
    if (normalize(targetPath) !== currentPath && !currentPath.startsWith(normalize(targetPath) + "/")) {
      return false;
    }
    if (item.exact) {
      return currentPath === normalize(targetPath) && !location.search;
    }
    if (targetQuery) {
      return location.search.includes(targetQuery);
    }
    return true;
  };

  // Split tabs around the centre slot for the FAB (teacher only).
  // For teacher: [tab0, tab1, FAB, tab2, tab3]
  // For others: render all tabs evenly without a centre slot.
  const renderTab = (item: TabItem, key: number | string) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <button
        key={key}
        type="button"
        onClick={() => navigate(item.href)}
        aria-label={t(item.labelKey, item.fallback)}
        aria-current={active ? "page" : undefined}
        className={cn(
          // 44px min touch target
          "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 gap-0.5 px-1",
          "text-[11px] font-medium",
          // motion: skip transitions when user prefers reduced motion
          "motion-safe:transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            active ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <span className="truncate max-w-[5rem]">
          {t(item.labelKey, item.fallback)}
        </span>
      </button>
    );
  };

  return (
    <nav
      className={cn(
        // Mobile only — desktop keeps the sidebar untouched.
        "sm:hidden",
        "fixed bottom-0 inset-x-0 z-40",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "border-t border-border",
        "pb-[env(safe-area-inset-bottom)]",
      )}
      role="navigation"
      aria-label={t("nav.mobileTabBar", "Bottom navigation")}
    >
      <div className="flex items-stretch h-16 max-w-screen-sm mx-auto">
        {showFab && tabs.length >= 4 ? (
          <>
            {renderTab(tabs[0], 0)}
            {renderTab(tabs[1], 1)}
            {/* Spacer for the FAB — sits in the centre slot above the bar. */}
            <div className="flex-1 min-w-[44px]" aria-hidden="true" />
            {renderTab(tabs[2], 2)}
            {renderTab(tabs[3], 3)}
          </>
        ) : (
          tabs.map((item, i) => renderTab(item, i))
        )}
      </div>
    </nav>
  );
};

export default BottomTabBar;
