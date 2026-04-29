import {
  Book,
  CalendarDays,
  CalendarOff,
  CheckSquare,
  Clock,
  ClipboardList,
  FileText,
  Home,
  Library,
  MessageSquare,
  School,
  Users,
  UserCheck,
  Activity as ActivityIcon,
  Calendar,
} from "lucide-react";
import { NavItem } from "@/types/navigation.ts";

/**
 * Admin nav — grouped into sections.
 * Profile and Settings live in the user dropdown, not here.
 */
export const adminNavItems: NavItem[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    href: "/dashboard",
    label: "nav.dashboard",
    icon: Home,
    description: "Overview of all activities",
    exact: true,
  },

  // ── People ────────────────────────────────────────────────────────────────
  {
    href: "/students",
    label: "nav.students",
    icon: Users,
    description: "Manage student profiles",
    section: "People",
  },
  {
    href: "/teachers",
    label: "nav.teachers",
    icon: School,
    description: "Manage teaching staff",
  },
  {
    href: "/classes",
    label: "nav.classes",
    icon: Library,
    description: "Manage classes",
  },

  // ── Operations ────────────────────────────────────────────────────────────
  {
    href: "/progress-book",
    label: "nav.progressBook",
    icon: Book,
    description: "Student progress tracker",
    section: "Operations",
  },
  {
    href: "/attendance",
    label: "nav.attendance",
    icon: FileText,
    description: "Track attendance records",
  },
  {
    href: "/calendar",
    label: "nav.calendar",
    icon: Calendar,
    description: "School events, holidays, and PD days",
  },
  {
    href: "/admin/teacher-schedules",
    label: "nav.teacherSchedules",
    icon: CalendarDays,
    description: "View teachers' weekly schedules",
  },

  // ── Admin Tools ───────────────────────────────────────────────────────────
  {
    href: "/tasks",
    label: "nav.tasks",
    icon: CheckSquare,
    description: "Assign and track teacher tasks",
    section: "Admin",
  },
  {
    href: "/admin/parent-accounts",
    label: "nav.parentAccounts",
    icon: UserCheck,
    description: "Manage parent accounts",
  },
  {
    href: "/admin/bulk-student-import",
    label: "nav.bulkStudentImport",
    icon: Users,
    description: "Upload CSV to add students",
  },
  {
    href: "/absence-requests",
    label: "nav.absenceRequests",
    icon: CalendarOff,
    description: "Review teacher absence requests",
  },
  {
    href: "/activity",
    label: "nav.activityFeed",
    icon: ActivityIcon,
    description: "Live app activity feed",
  },
];

/**
 * Teacher nav — trimmed. Profile/Preferences are in the user dropdown.
 * "My Students" removed (it's a tab inside Dashboard — redundant).
 */
export const teacherNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "nav.dashboard",
    icon: Home,
    description: "Teacher dashboard",
    exact: true,
  },

  // ── Daily ─────────────────────────────────────────────────────────────────
  {
    href: "/attendance",
    label: "nav.attendance",
    icon: Clock,
    description: "Track student attendance",
    section: "Daily",
  },
  {
    href: "/dashboard?tab=progress-book",
    label: "nav.progressBook",
    icon: Book,
    description: "Record student progress",
  },
  {
    href: "/dashboard?tab=assignments",
    label: "nav.assignments",
    icon: ClipboardList,
    description: "Create and track assignments",
  },

  // ── Communication ─────────────────────────────────────────────────────────
  {
    href: "/messages",
    label: "nav.messages",
    icon: MessageSquare,
    description: "Message parents of your class",
    section: "Communication",
  },
  {
    href: "/schedule",
    label: "nav.schedule",
    icon: CalendarDays,
    description: "View your class schedule",
  },
  {
    href: "/calendar",
    label: "nav.calendar",
    icon: Calendar,
    description: "School events and holidays",
  },
];

/**
 * Parent nav — essentials only.
 */
export const parentNavItems: NavItem[] = [
  {
    href: "/parent",
    label: "nav.parentDashboard",
    icon: Home,
    description: "Overview of your children",
    exact: true,
  },
  {
    href: "/parent/progress",
    label: "nav.quranProgress",
    icon: Book,
    description: "View memorization and revision",
  },
  {
    href: "/parent/attendance",
    label: "nav.attendance",
    icon: Clock,
    description: "Attendance history",
  },
  {
    href: "/parent/academics",
    label: "nav.academics",
    icon: ClipboardList,
    description: "Assessments and grades",
  },
  {
    href: "/parent/messages",
    label: "nav.messages",
    icon: MessageSquare,
    description: "Message your child's teacher",
  },
];
