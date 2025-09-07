import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { adminNavItems, teacherNavItems, parentNavItems } from "@/config/navigation.ts";
import { NavItem } from "@/types/navigation.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { isAdmin, isTeacher, isParent, isAttendanceTaker, hasCapability } = useRBAC();

  // Build role-based items exactly like Sidebar
  let items: NavItem[] = [];
  if (isAdmin) {
    items = adminNavItems;
  } else if (isTeacher) {
    items = teacherNavItems
      // Attendance by capability
      .filter((item) => isAttendanceTaker || hasCapability("attendance_access") || item.href !== "/attendance")
      // Progress by capability (match both direct route and dashboard tab link)
      .filter((item) => isAdmin || hasCapability("progress_access") || !item.href?.includes("progress-book"))
      // Assignments by capability
      .filter((item) => isAdmin || hasCapability("assignments_access") || !item.href?.includes("assignments"));
  } else if (isParent) {
    items = parentNavItems;
  }

  // Limit to 5 items to fit the bottom bar
  const navItems = items.slice(0, 5);

  const isNavItemActive = (item: NavItem) => {
    if (!item.href) return false;
    if (item.exact) {
      return location.pathname === item.href && !location.search;
    }
    if (item.href.includes("?tab=")) {
      const [path, search] = item.href.split("?");
      return location.pathname === path && location.search.includes(search);
    }
    return location.pathname === item.href;
  };

  const handleNavigation = (href?: string) => {
    if (!href) return;
    navigate(href);
  };

  const gridColsClass = navItems.length === 5
    ? "grid-cols-5"
    : navItems.length === 4
      ? "grid-cols-4"
      : navItems.length === 3
        ? "grid-cols-3"
        : navItems.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t lg:hidden">
      <div className={cn("grid h-full", gridColsClass)}>
        {navItems.map((item, index) => {
          const active = isNavItemActive(item);
          const Icon = item.icon as React.ComponentType<{ className?: string }>;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              type="button"
              className={cn(
                "inline-flex flex-col items-center justify-center px-1 hover:bg-gray-50 dark:hover:bg-gray-800 group",
                active && (isAdmin
                  ? "text-amber-500 bg-black/5 dark:bg-white/10"
                  : "text-primary bg-primary/5"),
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-1 group-hover:text-primary",
                  active
                    ? isAdmin ? "text-amber-500" : "text-primary"
                    : "text-gray-500 dark:text-gray-400",
                )}
              />
              <span className="text-xs whitespace-nowrap truncate max-w-[5rem]">
                {t(item.label)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
