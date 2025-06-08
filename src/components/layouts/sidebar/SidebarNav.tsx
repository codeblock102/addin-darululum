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
    
    if (item.href.includes('?tab=')) {
      const [path, search] = item.href.split('?');
      return location.pathname === path && location.search.includes(search);
    }
    
    return location.pathname === item.href;
  };

  const handleNavigation = (_event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && !isOpen) {
      const navEvent = new CustomEvent('navigate-mobile');
      globalThis.dispatchEvent(navEvent);
    }
  };

  return (
    <nav className="grid gap-1 px-2">
      {items.map((item, index) => {
        const isActive = isNavItemActive(item);
          
        return (
          <Link
            key={index}
            to={item.href}
            onClick={handleNavigation}
            className={cn(
              "flex items-center gap-3 rounded-lg pl-3 pr-3 py-2.5 text-sm font-medium transition-all",
              isAdmin 
                ? (isActive 
                  ? "bg-white/15 text-amber-400 font-medium backdrop-blur-sm border-l-2 border-amber-500"
                  : "text-gray-300 hover:bg-white/10 hover:text-amber-400 border-l-2 border-transparent")
                : (isActive 
                  ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-500"
                  : "text-gray-700 hover:bg-gray-100/60 hover:text-blue-600 border-l-2 border-transparent")
            )}
            title={item.description}
          >
            <item.icon className={cn(
              "h-5 w-5 min-w-5",
              isAdmin 
                ? (isActive ? "text-amber-400" : "text-gray-400")
                : (isActive ? "text-blue-600" : "text-gray-500")
            )} />
            {(isOpen !== false || isMobile) && (
              <span className="truncate transition-opacity duration-300">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};
