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
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { adminNavItems, teacherNavItems, parentNavItems } from "@/config/navigation.ts";
import { type NavItem } from "@/types/navigation.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { SidebarNav } from "./sidebar/SidebarNav.tsx";
import { SidebarUser } from "./sidebar/SidebarUser.tsx";
import { cn } from "@/lib/utils.ts";

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
  const { isTeacher, isAdmin, isParent, isLoading: isRoleLoading } = useRBAC();

  let navItems: NavItem[];
  if (isAdmin) {
    navItems = adminNavItems;
  } else if (isTeacher) {
    navItems = teacherNavItems;
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
            "flex h-14 sm:h-16 items-center transition-all duration-300 ease-in-out",
            isAdmin ? "border-b border-gray-200" : "border-b border-gray-200",
            (!isMobile && isOpen === false)
              ? "justify-center px-2"
              : "justify-between px-4 sm:px-5",
          )}
        >
          {(isOpen !== false || isMobile) && (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
            >
              {isAdmin
                ? (
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 drop-shadow-sm" />
                )
                : (
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(142.8,64.2%,24.1%)] drop-shadow-sm" />
                )}
              <span
                className={cn(
                  "text-sm sm:text-base transition-all duration-300 whitespace-nowrap font-medium",
                  isAdmin ? "text-gray-900" : "text-gray-900",
                )}
              >
                {isAdmin ? "Admin Portal" : isParent ? "Parent Portal" : "Teacher Portal"}
              </span>
            </Link>
          )}

          {/* Collapsed state logo */}
          {!isMobile && isOpen === false && (
            <Link
              to="/dashboard"
              className="flex items-center justify-center w-full hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
              title={isAdmin ? "Admin Portal" : isParent ? "Parent Portal" : "Teacher Portal"}
            >
              {isAdmin
                ? (
                  <ShieldCheck className="h-6 w-6 text-amber-600 drop-shadow-sm" />
                ) : <BookOpen className="h-6 w-6 text-[hsl(142.8,64.2%,24.1%)] drop-shadow-sm" />}
            </Link>
          )}

          {!isMobile && toggleSidebar && isOpen !== false && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                isAdmin
                  ? "text-gray-700 hover:bg-gray-100 hover:text-amber-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-[hsl(142.8,64.2%,24.1%)]",
                "transition-all duration-300 hover:scale-105",
              )}
              onClick={toggleSidebar}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          )}

          {/* Expand button for collapsed state */}
          {!isMobile && toggleSidebar && isOpen === false && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md border-2",
                isAdmin
                  ? "bg-white border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                  : "bg-white border-[hsl(142.8,64.2%,24.1%)]/20 text-[hsl(142.8,64.2%,24.1%)] hover:bg-[hsl(142.8,64.2%,24.1%)]/5 hover:border-[hsl(142.8,64.2%,24.1%)]/40",
                "transition-all duration-300 hover:scale-110",
              )}
              onClick={toggleSidebar}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          )}
        </div>

        <div
          className={cn(
            "flex-1 overflow-auto transition-all duration-300",
            (!isMobile && isOpen === false) ? "py-2" : "py-2 sm:py-4",
          )}
        >
          {/* DEBUG: Log navItems for admin */}
          {isAdmin && (() => {
            console.log("Admin NavItems being passed to SidebarNav:", navItems);
            return null;
          })()}
          <SidebarNav items={navItems} isAdmin={isAdmin} isOpen={isOpen} />
        </div>

        <SidebarUser isAdmin={isAdmin} isOpen={isOpen} />
      </div>
    </div>
  );
};
