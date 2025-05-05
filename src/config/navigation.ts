import { Home, Users, School, LineChart, FileText, LayoutDashboard, Settings, BookOpen, User, Calendar, Clock } from "lucide-react";
import { NavItem } from "@/types/navigation";

export const adminNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, description: "Overview of all activities" },
  { href: "/students", label: "Students", icon: Users, description: "Manage student profiles" },
  { href: "/teachers", label: "Teachers", icon: School, description: "Manage teaching staff" },
  { href: "/progress", label: "Progress", icon: LineChart, description: "Student progress tracker" },
  { href: "/attendance", label: "Attendance", icon: FileText, description: "Track attendance records" },
  { href: "/teacher-portal", label: "Teacher Portal", icon: LayoutDashboard, description: "Access teacher dashboard" },
  { href: "/settings", label: "Settings", icon: Settings, description: "System configuration" },
];

export const teacherNavItems: NavItem[] = [
  { href: "/teacher-portal", label: "Dashboard", icon: Home, description: "Teacher dashboard" },
  { href: "/teacher-portal?tab=students", label: "My Students", icon: Users, description: "Manage your students" },
  { href: "/teacher-portal?tab=progress", label: "Progress", icon: LineChart, description: "Record student progress" },
  { href: "/teacher-portal?tab=schedule", label: "Schedule", icon: Calendar, description: "View your teaching schedule" },
  { href: "/teacher-portal?tab=attendance", label: "Attendance", icon: Clock, description: "Track student attendance" },
  { href: "/preferences", label: "Preferences", icon: Settings, description: "Account preferences" }
];
