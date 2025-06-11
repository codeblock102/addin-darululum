
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { NavItem } from "@/types/navigation.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface SidebarNavProps {
  items: NavItem[];
  isAdmin: boolean;
  isOpen?: boolean;
}

export const SidebarNav = ({ items, isAdmin, isOpen }: SidebarNavProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const isNavItemActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.href && !location.search;
    }

    if (item.href.includes("?tab=")) {
      const [path, search] = item.href.split("?");
      return location.pathname === path && location.search.includes(search);
    }

    return location.pathname === item.href;
  };

  const handleNavigation = (_event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && !isOpen) {
      const navEvent = new CustomEvent("navigate-mobile");
      globalThis.dispatchEvent(navEvent);
    }
  };

  return (
    <nav className={cn(
      "grid gap-1 transition-all duration-300",
      (!isMobile && isOpen === false) ? "px-1" : "px-2"
    )}>
      {items.map((item, index) => {
        const isActive = isNavItemActive(item);

        return (
          <Link
            key={index}
            to={item.href}
            onClick={handleNavigation}
            className={cn(
              "flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative",
              (!isMobile && isOpen === false) 
                ? "justify-center p-3 mx-1 my-1" 
                : "gap-3 pl-3 pr-3 py-2.5",
              isAdmin
                ? (isActive
                  ? "bg-white/15 text-amber-400 font-medium backdrop-blur-sm border-l-2 border-amber-500 shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:text-amber-400 border-l-2 border-transparent hover:shadow-sm")
                : (isActive
                  ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-500 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100/60 hover:text-blue-600 border-l-2 border-transparent hover:shadow-sm"),
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            title={(!isMobile && isOpen === false) ? item.label : item.description}
          >
            <item.icon
              className={cn(
                "min-w-5 transition-all duration-200",
                (!isMobile && isOpen === false) ? "h-6 w-6" : "h-5 w-5",
                isAdmin
                  ? (isActive ? "text-amber-400 drop-shadow-sm" : "text-gray-400 group-hover:text-amber-400")
                  : (isActive ? "text-blue-600 drop-shadow-sm" : "text-gray-500 group-hover:text-blue-600"),
              )}
            />
            {(isOpen !== false || isMobile) && (
              <span className="truncate transition-all duration-300 font-medium">
                {item.label}
              </span>
            )}
            
            {/* Tooltip for collapsed state */}
            {(!isMobile && isOpen === false) && (
              <div className={cn(
                "absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap",
                "before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-gray-900"
              )}>
                {item.label}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};
