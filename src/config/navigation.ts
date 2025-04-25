
import { Home, Users, School, LineChart, FileText, LayoutDashboard, Settings, BookOpen, User } from "lucide-react";
import { NavItem } from "@/types/navigation";

export const adminNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, description: "Overview of all activities" },
  { href: "/students", label: "Students", icon: Users, description: "Manage student profiles" },
  { href: "/teachers", label: "Teachers", icon: School, description: "Manage teaching staff" },
  { href: "/teacher-accounts", label: "Teacher Accounts", icon: User, description: "Teacher account control center" },
  { href: "/progress", label: "Progress", icon: LineChart, description: "Student progress tracker" },
  { href: "/attendance", label: "Attendance", icon: FileText, description: "Track attendance records" },
  { href: "/teacher-portal", label: "Teacher Portal", icon: LayoutDashboard, description: "Access teacher dashboard" },
  { href: "/settings", label: "Settings", icon: Settings, description: "System configuration" },
];
