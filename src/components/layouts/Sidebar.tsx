/**
 * @file src/components/layouts/Sidebar.tsx
 * @summary This file defines the main Sidebar component for the application's dashboard layout.
 *
 * The Sidebar is responsible for displaying navigation links and user information. It adapts its appearance
 * and behavior based on the user's role (admin or teacher) and the device (mobile or desktop).
 * It can be collapsible on desktop and is typically hidden by default on mobile, requiring a toggle.
 *
 * Key Features:
 * - Role-based navigation items: Displays `adminNavItems` or `teacherNavItems` based on the user's role.
 * - Responsive design: Adapts for mobile and desktop views using `useIsMobile` hook.
 * - Collapsible: Supports an `isOpen` state and `toggleSidebar` function for desktop view.
 * - Mobile-specific close button and behavior (closes on navigation).
 * - Dynamically styled header (logo and portal name) based on admin/teacher role and collapsed state.
 * - Includes `SidebarNav` for rendering the list of navigation items and `SidebarUser` for displaying user profile/actions.
 * - Shows a loading state while the user's role is being determined.
 */
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { adminNavItems, teacherNavItems, parentNavItems } from "@/config/navigation.ts";
import { type NavItem } from "@/types/navigation.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { SidebarNav } from "./sidebar/SidebarNav.tsx";
import { SidebarUser } from "./sidebar/SidebarUser.tsx";
import { cn } from "@/lib/utils.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { NotificationBell } from "@/components/shared/NotificationBell.tsx";

interface SidebarProps {
  /** Optional callback function to be invoked when the sidebar should be closed, typically on mobile. */
  onCloseSidebar?: () => void;
  /** Optional callback function to toggle the sidebar's open/closed state, primarily for desktop. */
  toggleSidebar?: () => void;
  /** Optional boolean indicating whether the sidebar is currently open or closed (collapsed). */
  isOpen?: boolean;
}

/**
 * @component Sidebar
 * @description Renders the main application sidebar with navigation links and user information.
 *
 * This component determines the appropriate set of navigation items (`adminNavItems` or `teacherNavItems`)
 * based on the user's role fetched via the `useRBAC` hook. It handles responsive behavior, including
 * a close button for mobile and a toggle button for collapsing/expanding on desktop.
 * The sidebar's visual appearance (colors, borders) also changes depending on whether an admin or a teacher is viewing it.
 *
 * Props:
 *  - `onCloseSidebar`: Function to call when the sidebar requests to be closed (e.g., on mobile after a navigation event or pressing the close button).
 *  - `toggleSidebar`: Function to call to toggle the `isOpen` state (used by the collapse/expand button on desktop).
 *  - `isOpen`: Boolean indicating if the sidebar is currently expanded or collapsed (on desktop).
 *
 * Hooks Used:
 *  - `useIsMobile`: Detects if the current view is mobile.
 *  - `useRBAC`: Provides role information (`isAdmin`, `isTeacher`, `isRoleLoading`).
 *  - `useEffect`: Manages an event listener to close the sidebar on mobile navigation events.
 *
 * Child Components:
 *  - `SidebarNav`: Renders the actual list of navigation links.
 *  - `SidebarUser`: Renders the user information section at the bottom of the sidebar.
 *  - `Button` (from ui/button): Used for close and toggle controls.
 *  - `Link` (from react-router-dom): For the main portal link in the sidebar header.
 *  - Lucide icons: For visual elements.
 *
 * @param {SidebarProps} props - The properties for the Sidebar component.
 * @returns {JSX.Element | null} The rendered Sidebar component, or a loading indicator if role information is pending.
 */
export const Sidebar = (
  { onCloseSidebar, toggleSidebar, isOpen }: SidebarProps,
) => {
  const isMobile = useIsMobile();
  const { isTeacher, isAdmin, isParent, isAttendanceTaker, hasCapability, isLoading: isRoleLoading } = useRBAC();
  const { t } = useI18n();

  let navItems: NavItem[];
  if (isAdmin) {
    navItems = adminNavItems;
  } else if (isTeacher) {
    navItems = teacherNavItems
      // Attendance by capability
      .filter((item) => isAttendanceTaker || hasCapability("attendance_access") || item.href !== "/attendance")
      // Progress by capability (match both direct route and dashboard tab link)
      .filter((item) => isAdmin || hasCapability("progress_access") || !item.href?.includes("progress-book"))
      // Assignments by capability
      .filter((item) => isAdmin || hasCapability("assignments_access") || !item.href?.includes("assignments"));
  } else if (isParent) {
    navItems = parentNavItems;
  } else {
    navItems = [];
  }

  // Handle mobile navigation events
  useEffect(() => {
    const handleNavigation = () => {
      if (onCloseSidebar && isMobile) {
        onCloseSidebar();
      }
    };

    globalThis.addEventListener("navigate-mobile", handleNavigation);

    return () => {
      globalThis.removeEventListener("navigate-mobile", handleNavigation);
    };
  }, [onCloseSidebar, isMobile]);

  if (isRoleLoading) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center">
        {/* Optionally, a more specific sidebar loading spinner */}
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col sidebar">
      {/* Close button for mobile */}
      {isMobile && onCloseSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-3 right-3 z-50",
            isAdmin ? "text-white hover:bg-white/10" : "",
          )}
          onClick={onCloseSidebar}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      <div
        className={cn(
          "flex h-full w-full flex-col transition-all duration-300 ease-in-out",
          isAdmin ? "bg-white border-r border-gray-200" : "bg-white border-r border-gray-200",
          !isMobile && isOpen === false && "shadow-sm",
        )}
      >
        <div
          className={cn(
            "flex h-14 sm:h-16 items-center border-b border-gray-100 transition-all duration-300 ease-in-out",
            (!isMobile && isOpen === false)
              ? "justify-center px-2"
              : "justify-between px-4 sm:px-5",
          )}
        >
          {(isOpen !== false || isMobile) && (
            <Link
              to={isParent ? "/parent" : "/dashboard"}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #14532d, #166534)" }}>
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                {isAdmin ? "Admin Portal" : isParent ? t("portal.parent") : t("portal.teacher")}
              </span>
            </Link>
          )}

          {/* Collapsed state */}
          {!isMobile && isOpen === false && (
            <div className="flex flex-col items-center gap-2 w-full py-1">
              <Link
                to={isParent ? "/parent" : "/dashboard"}
                className="flex items-center justify-center hover:bg-gray-50 rounded-xl p-2 transition-colors"
                title={isAdmin ? "Admin Portal" : isParent ? t("portal.parent") : t("portal.teacher")}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #14532d, #166534)" }}>
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
              </Link>
              {(isAdmin || isTeacher) && <NotificationBell collapsed={true} />}
            </div>
          )}

          {!isMobile && toggleSidebar && isOpen !== false && (
            <div className="flex items-center gap-1">
              {(isAdmin || isTeacher) && <NotificationBell collapsed={false} />}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-lg"
                onClick={toggleSidebar}
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Expand button */}
          {!isMobile && toggleSidebar && isOpen === false && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-green-700 hover:border-green-200 transition-colors"
              onClick={toggleSidebar}
              title="Expand sidebar"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "flex-1 transition-all duration-300 overflow-x-hidden",
            (!isMobile && isOpen === false) ? "py-2" : "py-2 sm:py-4",
          )}
          style={{ overflowY: "auto" }}
        >
          <SidebarNav items={navItems} isAdmin={isAdmin} isOpen={isOpen} />
        </div>

        <SidebarUser isAdmin={isAdmin} isOpen={isOpen} />
      </div>
    </div>
  );
};
