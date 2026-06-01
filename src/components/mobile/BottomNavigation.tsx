import { useState } from "react";
import type { ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { adminNavItems, teacherNavItems, parentNavItems } from "@/config/navigation.ts";
import { NavItem } from "@/types/navigation.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { ChevronRight, LogOut, Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { isAdmin, isTeacher, isParent, isAttendanceTaker, hasCapability } = useRBAC();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  // Build role-based items exactly like Sidebar
  let items: NavItem[] = [];
  if (isAdmin) {
    items = adminNavItems;
  } else if (isTeacher) {
    items = teacherNavItems
      .filter((item) => isAttendanceTaker || hasCapability("attendance_access") || item.href !== "/attendance")
      .filter((item) => isAdmin || hasCapability("progress_access") || !item.href?.includes("progress-book"))
      .filter((item) => isAdmin || hasCapability("assignments_access") || !item.href?.includes("assignments"));
  } else if (isParent) {
    items = parentNavItems;
  }

  // Split into primary (priority 1-4) and overflow
  const primary = [...items]
    .filter((i) => typeof i.priority === "number")
    .sort((a, b) => (a.priority! - b.priority!))
    .slice(0, 4);
  const primaryHrefs = new Set(primary.map((i) => i.href).filter((h) => !!h));
  const overflow = items.filter((i) => !primaryHrefs.has(i.href));

  const isNavItemActive = (item: NavItem) => {
    if (!item.href) return false;
    const normalize = (p?: string) => (p || "").replace(/\/+$/, "");
    const currentPath = normalize(location.pathname);
    const targetHref = normalize(item.href);
    if (item.exact) {
      return currentPath === targetHref && !location.search;
    }
    if (item.href.includes("?tab=")) {
      const [path, search] = item.href.split("?");
      return currentPath === normalize(path) && location.search.includes(search);
    }
    return currentPath === targetHref || currentPath.startsWith(targetHref + "/");
  };

  const handleNavigation = (href?: string) => {
    if (!href) return;
    navigate(href);
  };

  const handleLogout = async () => {
    setMoreOpen(false);
    await signOut();
    navigate("/auth");
  };

  // Group overflow items by section for the More sheet
  const overflowGroups: { section: string; items: NavItem[] }[] = [];
  let currentSection = "More";
  for (const item of overflow) {
    if (item.section) {
      currentSection = item.section;
    }
    let group = overflowGroups.find((g) => g.section === currentSection);
    if (!group) {
      group = { section: currentSection, items: [] };
      overflowGroups.push(group);
    }
    group.items.push(item);
  }

  // Is any overflow item active? Then "More" tab shows active.
  const moreActive = overflow.some(isNavItemActive);

  const renderTab = (
    key: string,
    label: string,
    Icon: ComponentType<{ className?: string }>,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={key}
      onClick={onClick}
      type="button"
      className={cn(
        "flex-1 min-w-0 inline-flex flex-col items-center justify-center gap-1 px-1 border-b-2 border-transparent",
        active
          ? "text-foreground border-foreground"
          : "text-muted-foreground",
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[10px] leading-none truncate max-w-full">
        {label}
      </span>
    </button>
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t lg:hidden pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5 h-full items-stretch">
          {primary.map((item, index) =>
            renderTab(
              item.label || `item-${index}`,
              t(item.label),
              item.icon as ComponentType<{ className?: string }>,
              isNavItemActive(item),
              () => handleNavigation(item.href),
            ),
          )}
          {renderTab(
            "__more__",
            t("nav.more", "More"),
            Menu,
            moreActive || moreOpen,
            () => setMoreOpen(true),
          )}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden max-h-[85vh] overflow-y-auto rounded-t-xl p-0"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>{t("nav.more", "More")}</SheetTitle>
          </SheetHeader>

          <div className="px-2 pb-2">
            {overflowGroups.map((group) => (
              <div key={group.section} className="mt-3">
                <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {group.section}
                </div>
                <ul className="flex flex-col">
                  {group.items.map((item, index) => {
                    const Icon = item.icon as ComponentType<{ className?: string }>;
                    const active = isNavItemActive(item);
                    return (
                      <li key={item.label || `item-${index}`}>
                        <SheetClose asChild>
                          <button
                            type="button"
                            onClick={() => handleNavigation(item.href)}
                            className={cn(
                              "w-full min-h-[48px] flex items-center gap-3 px-3 rounded-md text-left",
                              active
                                ? "text-foreground bg-accent"
                                : "text-foreground hover:bg-accent",
                            )}
                          >
                            <Icon className="w-5 h-5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 text-sm truncate">
                              {t(item.label)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </SheetClose>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-4 border-t pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full min-h-[48px] flex items-center gap-3 px-3 rounded-md text-left text-foreground hover:bg-accent"
              >
                <LogOut className="w-5 h-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm">
                  {t("auth.logout", "Log out")}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
