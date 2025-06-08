/**
 * @file src/config/navigation.ts
 * @summary This file defines the navigation structures for different user roles in the application.
 *
 * It exports arrays of `NavItem` objects, which are used to build the sidebar navigation menus.
 * Each `NavItem` typically includes a path (`href`), a display label, an icon, a description, and an optional `exact` flag for route matching.
 * - `adminNavItems`: Defines the navigation links available to users with an admin role.
 * - `teacherNavItems`: Defines the navigation links available to users with a teacher role.
 *
 * Icons are imported from the `lucide-react` library.
 */
import {
  Book,
  Clock,
  FileText,
  Home,
  School,
  Settings,
  Users,
} from "lucide-react"; // Simplified imports based on usage
import { NavItem } from "@/types/navigation.ts";

/**
 * @const adminNavItems
 * @description Navigation items for the admin sidebar.
 * Defines the primary navigation links available to administrators.
 */
export const adminNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Overview of all activities",
    exact: true,
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
    description: "Manage student profiles",
  },
  {
    href: "/teachers",
    label: "Teachers",
    icon: School,
    description: "Manage teaching staff",
  },
  {
    href: "/progress-book",
    label: "Progress Book",
    icon: Book,
    description: "Student progress tracker",
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: FileText,
    description: "Track attendance records",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "System configuration",
  },
];

/**
 * @const teacherNavItems
 * @description Navigation items for the teacher sidebar.
 * Defines the primary navigation links available to teachers.
 * Note: Many teacher links point to the same `/dashboard` route but use different query parameters (`?tab=...`)
 * to show specific content within the teacher dashboard.
 */
export const teacherNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Teacher dashboard",
    exact: true,
  },
  {
    href: "/dashboard?tab=students",
    label: "My Students",
    icon: Users,
    description: "Manage your students",
  },
  {
    href: "/dashboard?tab=progress-book",
    label: "Progress Book",
    icon: Book,
    description: "Record student progress",
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: Clock,
    description: "Track student attendance",
  },
  {
    href: "/preferences",
    label: "Preferences",
    icon: Settings,
    description: "Account preferences",
  },
];
