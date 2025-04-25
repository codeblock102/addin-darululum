
import { Home, Users, School, Calendar, LineChart, FileText, LayoutDashboard, Settings, BookOpen } from "lucide-react";
import { NavItem } from "@/types/navigation";

export const adminNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, description: "Overview of all activities" },
  { href: "/students", label: "Students", icon: Users, description: "Manage student profiles" },
  { href: "/teachers", label: "Teachers", icon: School, description: "Manage teaching staff" },
  { href: "/schedule", label: "Schedule", icon: Calendar, description: "View and manage classes" },
  { href: "/progress", label: "Progress", icon: LineChart, description: "Student progress tracker" },
  { href: "/attendance", label: "Attendance", icon: FileText, description: "Track attendance records" },
  { href: "/teacher-portal", label: "Teacher Portal", icon: LayoutDashboard, description: "Access teacher dashboard" },
  { href: "/settings", label: "Settings", icon: Settings, description: "System configuration" },
];

export const teacherNavItems: NavItem[] = [
  { href: "/teacher-portal", exact: true, label: "Dashboard", icon: Home, description: "Teacher overview" },
  { href: "/teacher-portal?tab=students", label: "My Students", icon: Users, description: "View assigned students" },
  { href: "/teacher-portal?tab=progress", label: "Record Progress", icon: LineChart, description: "Log student progress" },
  { href: "/teacher-portal?tab=grading", label: "Grading", icon: FileText, description: "Evaluate performances" },
  { href: "/teacher-portal?tab=analytics", label: "Analytics", icon: LineChart, description: "Performance insights" },
  { href: "/teacher-portal?tab=messages", label: "Messages", icon: BookOpen, description: "Communication hub" },
  { href: "/teacher-portal?tab=profile", label: "My Profile", icon: Settings, description: "Account settings" },
];
