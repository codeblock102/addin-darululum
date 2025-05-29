import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Book, CalendarDays, LogOut } from "lucide-react";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTeacher, isAdmin } = useTeacherStatus();
  const { signOut } = useAuth();

  // Different navigation items for admin and teacher roles
  const adminNavItems = [
    { icon: Home, label: "Dashboard", href: "/admin" }, // Updated to correct admin dashboard path
    { icon: Users, label: "Teachers", href: "/teachers" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: Book, label: "Progress", href: "/dhor-book" },
    { icon: LogOut, label: "Logout", action: signOut }
  ];

  const teacherNavItems = [
    { icon: Home, label: "Dashboard", href: "/teacher-portal" },
    { icon: Users, label: "Students", href: "/teacher-portal?tab=students" },
    { icon: Book, label: "Progress", href: "/teacher-portal?tab=dhor-book" },
    { icon: LogOut, label: "Logout", action: signOut }
  ];

  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  const isActive = (item: { href?: string; label?: string }) => {
    if (!item.href) return false;

    // Specifically handle Dashboard for teachers to be exact
    if (item.label === "Dashboard" && (item.href === "/teacher-portal" || item.href === "/admin")) {
      return location.pathname === item.href && location.search === "";
    }
    
    if (item.href.includes('?tab=')) {
      const [path, search] = item.href.split('?');
      return location.pathname === path && location.search.includes(search);
    }
    
    return location.pathname === item.href && location.search === ""; // Make default check exact as well
  };

  const handleNavigation = (item: { href?: string; action?: () => Promise<void> }) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t lg:hidden">
      <div className="grid h-full grid-cols-5">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item)}
            type="button"
            className={cn(
              "inline-flex flex-col items-center justify-center px-1 hover:bg-gray-50 dark:hover:bg-gray-800 group",
              isActive(item) && (isAdmin 
                ? "text-amber-500 bg-black/5 dark:bg-white/10" 
                : "text-primary bg-primary/5")
            )}
          >
            <item.icon 
              className={cn(
                "w-5 h-5 mb-1 group-hover:text-primary", 
                isActive(item)
                  ? isAdmin 
                    ? "text-amber-500" 
                    : "text-primary"
                  : "text-gray-500 dark:text-gray-400"
              )} 
            />
            <span className="text-xs whitespace-nowrap truncate max-w-[4rem]">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
