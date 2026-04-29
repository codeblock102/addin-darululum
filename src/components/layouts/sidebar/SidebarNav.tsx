import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { NavItem } from "@/types/navigation.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

interface SidebarNavProps {
  items: NavItem[];
  isAdmin: boolean;
  isOpen?: boolean;
}

export const SidebarNav = ({ items, isAdmin, isOpen }: SidebarNavProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id || "";

  const isNavItemActive = (item: NavItem) => {
    const normalize = (p?: string) => (p || "").replace(/\/+$/, "");
    const currentPath = normalize(location.pathname);
    const targetHref = normalize(item.href);

    if (item.exact) {
      return currentPath === targetHref && !location.search;
    }

    if (item.href?.includes("?tab=")) {
      const [path, search] = item.href.split("?");
      return currentPath === normalize(path) && location.search.includes(search);
    }

    return currentPath === targetHref || currentPath.startsWith(targetHref + "/");
  };

  const handleNavigation = (_event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && !isOpen) {
      const navEvent = new CustomEvent("navigate-mobile");
      globalThis.dispatchEvent(navEvent);
    }
  };

  // Unread messages count for current user
  const { data: unreadCount } = useQuery<number>({
    queryKey: ["unread-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("communications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("read", false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 15_000,
  });

  // Realtime invalidate for unread count
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "communications", filter: `recipient_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-count", userId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  return (
    <nav
      className={cn(
        "flex flex-col gap-0.5 transition-all duration-300",
        (!isMobile && isOpen === false) ? "px-2" : "px-3",
      )}
    >
      {items.map((item, index) => {
        const isActive = isNavItemActive(item);
        const collapsed = !isMobile && isOpen === false;
        const showSection = !collapsed && !!item.section;

        return (
          <div key={index}>
            {/* Section label */}
            {showSection && (
              <div className={cn("pb-1 px-1", index === 0 ? "pt-0" : "pt-4")}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {item.section}
                </span>
              </div>
            )}

            <Link
              to={item.href}
              onClick={handleNavigation}
              className={cn(
                "flex items-center rounded-xl text-sm transition-colors duration-150 group relative",
                collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-green-50 text-green-900 font-semibold shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium",
              )}
              title={collapsed ? t(item.label) : item.description}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 transition-colors duration-150",
                  collapsed ? "h-5 w-5" : "h-4 w-4",
                  isActive ? "text-green-700" : "text-gray-400 group-hover:text-gray-600",
                )}
              />

              {!collapsed && (
                <span className="truncate flex-1">{t(item.label)}</span>
              )}

              {/* Unread badge — shows count now */}
              {typeof unreadCount === "number" && unreadCount > 0 &&
                item.href?.includes("/messages") && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap pointer-events-none">
                  {t(item.label)}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};
