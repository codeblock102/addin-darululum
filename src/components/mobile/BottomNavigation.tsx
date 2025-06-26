import { useLocation, useNavigate } from "react-router-dom";
import { Book, ClipboardList, Home, LogOut, Users } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { cn } from "@/lib/utils.ts";
import { useAuth } from "@/hooks/use-auth.ts";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useRBAC();
  const { signOut } = useAuth();

  // Different navigation items for admin and teacher roles
  const adminNavItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Teachers", href: "/teachers" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: ClipboardList, label: "Attendance", href: "/attendance" },
    { icon: LogOut, label: "Logout", action: signOut },
  ];

  const teacherNavItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: ClipboardList, label: "Attendance", href: "/attendance" },
    { icon: Book, label: "Progress", href: "/progress-book" },
    { icon: LogOut, label: "Logout", action: signOut },
  ];

  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  const isActive = (item: { href?: string; label?: string }) => {
    if (!item.href) return false;
    // Exact match for all paths now, as query params are removed
    return location.pathname === item.href;
  };

  const handleNavigation = (
    item: { href?: string; action?: () => Promise<void> },
  ) => {
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
                : "text-primary bg-primary/5"),
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 mb-1 group-hover:text-primary",
                isActive(item)
                  ? isAdmin ? "text-amber-500" : "text-primary"
                  : "text-gray-500 dark:text-gray-400",
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
