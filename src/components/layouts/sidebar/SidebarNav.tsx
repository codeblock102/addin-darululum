
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types/navigation";

interface SidebarNavProps {
  items: NavItem[];
  isAdmin: boolean;
}

export const SidebarNav = ({ items, isAdmin }: SidebarNavProps) => {
  const location = useLocation();
  
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

  return (
    <nav className="grid gap-1 px-2">
      {items.map((item, index) => {
        const isActive = item.href.includes('?tab=')
          ? location.pathname === '/teacher-portal' && location.search.includes(item.href.split('?')[1])
          : location.pathname === item.href;
          
        return (
          <Link
            key={index}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg pl-3 pr-3 py-3 text-sm font-medium transition-all",
              isActive ? styles.navItem.active : styles.navItem.inactive
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden md:block">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
