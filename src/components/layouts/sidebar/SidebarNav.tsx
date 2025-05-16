
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarNavProps {
  items: NavItem[];
  isAdmin: boolean;
}

export const SidebarNav = ({ items, isAdmin }: SidebarNavProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const styles = {
    navItem: {
      active: isAdmin 
        ? "bg-white/15 text-amber-400 font-medium backdrop-blur-sm border-l-2 border-amber-500" 
        : "bg-accent text-accent-foreground",
      inactive: isAdmin 
        ? "text-gray-300 hover:bg-white/10 hover:text-amber-400 border-l-2 border-transparent" 
        : "hover:bg-accent/50 hover:text-accent-foreground"
    }
  };

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

  const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile) {
      // Only dispatch on mobile to close sidebar
      const navEvent = new CustomEvent('navigate-mobile');
      window.dispatchEvent(navEvent);
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
              "flex items-center gap-3 rounded-lg pl-3 pr-3 py-3 text-sm font-medium transition-all",
              isActive ? styles.navItem.active : styles.navItem.inactive
            )}
            title={item.description}
          >
            <item.icon className="h-5 w-5 min-w-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
