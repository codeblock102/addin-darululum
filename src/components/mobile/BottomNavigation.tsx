
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Book, CalendarDays, MessageSquare, Settings } from "lucide-react";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { cn } from "@/lib/utils";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTeacher, isAdmin } = useTeacherStatus();

  // Different navigation items for admin and teacher roles
  const adminNavItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Users, label: "Teachers", href: "/teachers" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: Book, label: "Progress", href: "/dhor-book" },
    { icon: Settings, label: "Settings", href: "/settings" }
  ];

  const teacherNavItems = [
    { icon: Home, label: "Dashboard", href: "/teacher-portal" },
    { icon: Users, label: "Students", href: "/teacher-portal?tab=students" },
    { icon: Book, label: "Progress", href: "/teacher-portal?tab=dhor-book" },
    { icon: CalendarDays, label: "Schedule", href: "/teacher-portal?tab=schedule" },
    { icon: MessageSquare, label: "Messages", href: "/teacher-portal?tab=messages" }
  ];

  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  const isActive = (item: { href: string }) => {
    if (item.href.includes('?tab=')) {
      const [path, search] = item.href.split('?');
      return location.pathname === path && location.search.includes(search);
    }
    
    return location.pathname === item.href;
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t lg:hidden">
      <div className="grid h-full grid-cols-5">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.href)}
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
