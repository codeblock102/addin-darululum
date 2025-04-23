
import { useLocation } from "react-router-dom";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { NavItem } from "@/types/navigation";
import { useNavigate } from "react-router-dom";

interface NavigationMenuProps {
  items: NavItem[];
}

export const NavigationMenu = ({ items }: NavigationMenuProps) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <SidebarMenu>
      {items.map((item, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton 
            isActive={isNavItemActive(item)}
            onClick={() => navigate(item.href)}
            className="transition-all duration-200 hover:translate-x-1"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};
