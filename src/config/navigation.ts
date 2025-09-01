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
  ClipboardList,
  FileText,
  Home,
  School,
  Settings,
  Users,
  UserCircle2 as _UserCircle2,
  UserCheck,
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
  // Removed Add Parent from admin nav; only parents should invite other parents
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
    href: "/classes",
    label: "Classes",
    icon: School,
    description: "Manage classes",
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
    href: "/admin/parent-accounts",
    label: "Parent Accounts",
    icon: UserCheck,
    description: "Manage parent accounts",
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
 * Updated to use consistent routes and provide direct access to attendance.
 */
export const teacherNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Teacher dashboard",
    exact: true,
  },
  // Removed Add Parent from teacher nav; only parents should invite other parents
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
    href: "/dashboard?tab=assignments",
    label: "Assignments",
    icon: ClipboardList,
    description: "Create and track assignments",
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: Clock,
    description: "Track student attendance",
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: Clock,
    description: "View your class schedule",
  },
  {
    href: "/preferences",
    label: "Preferences",
    icon: Settings,
    description: "Account preferences",
  },
];

/**
 * @const parentNavItems
 * @description Navigation items for the parent sidebar.
 */
export const parentNavItems: NavItem[] = [
  {
    href: "/parent",
    label: "Parent Dashboard",
    icon: Home,
    description: "Overview of your children",
    exact: true,
  },
  {
    href: "/add-parent",
    label: "Add Parent",
    icon: Users,
    description: "Add another guardian for your child",
  },
  {
    href: "/parent/progress",
    label: "Qur'an Progress",
    icon: Book,
    description: "View memorization and revision",
  },
  {
    href: "/parent/academics",
    label: "Academics",
    icon: ClipboardList,
    description: "Assessments and grades",
  },
  {
    href: "/parent/attendance",
    label: "Attendance",
    icon: Clock,
    description: "Attendance history",
  },
];
