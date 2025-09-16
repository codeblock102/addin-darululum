import { useLocation } from "react-router-dom";
import {
  SidebarButton,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar.tsx";
import { NavItem } from "@/types/navigation.ts";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface NavigationMenuProps {
  items: NavItem[];
}

export const NavigationMenu = ({ items }: NavigationMenuProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isNavItemActive = (item: NavItem) => {
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

  const handleNavigation = (href: string) => {
    navigate(href);
    // On mobile, dispatch event to close the sidebar after navigation
    if (isMobile) {
      const event = new CustomEvent("navigate-mobile");
      globalThis.dispatchEvent(event);
    }
  };

  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const isActive = isNavItemActive(item);

        return (
          <SidebarMenuItem key={index}>
            <SidebarButton
              isActive={isActive}
              onClick={() => handleNavigation(item.href)}
              tooltip={!isMobile ? item.description : undefined}
              className={`transition-all duration-200 py-3 sm:py-3 ${isActive ? "bg-primary/20 text-primary" : "text-foreground/70 hover:bg-primary/5 hover:text-primary"}`}
            >
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 min-w-5" />
              <span className="text-xs sm:text-sm font-medium truncate">
                {item.label}
              </span>
            </SidebarButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};
