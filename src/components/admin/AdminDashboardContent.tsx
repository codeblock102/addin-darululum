
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Settings,
  BarChart3,
  MessageSquare,
  Plus,
} from "lucide-react";
import { AdminStatsCards } from "./AdminStatsCards";
import { AdminRecentActivity } from "./AdminRecentActivity";

export const AdminDashboardContent = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Manage Students",
      icon: Users,
      action: () => navigate("/students"),
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Add, edit, and manage student records",
    },
    {
      title: "Manage Teachers",
      icon: GraduationCap,
      action: () => navigate("/teachers"),
      color: "bg-green-500 hover:bg-green-600",
      description: "Oversee teacher accounts and assignments",
    },
    {
      title: "Progress Reports",
      icon: BookOpen,
      action: () => navigate("/progress-book"),
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Monitor student memorization progress",
    },
    {
      title: "Attendance",
      icon: Calendar,
      action: () => navigate("/attendance"),
      color: "bg-orange-500 hover:bg-orange-600",
      description: "View and manage attendance records",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      action: () => navigate("/dashboard"),
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "View detailed performance analytics",
    },
    {
      title: "Settings",
      icon: Settings,
      action: () => navigate("/settings"),
      color: "bg-gray-500 hover:bg-gray-600",
      description: "Configure system settings",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Stats Cards */}
      <AdminStatsCards />

      {/* Quick Actions Grid */}
      <Card className="admin-card">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary transition-all duration-200 p-3 admin-btn-secondary"
                onClick={action.action}
              >
                <action.icon className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                <div className="text-center">
                  <div className="font-medium text-xs md:text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* System Overview */}
        <Card className="admin-card">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Active Students</span>
                <span className="text-lg font-bold text-primary">--</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Active Teachers</span>
                <span className="text-lg font-bold text-green-600">--</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Classes Today</span>
                <span className="text-lg font-bold text-orange-600">--</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <AdminRecentActivity />
      </div>

      {/* Management Links */}
      <Card className="admin-card">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Management Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Button
              variant="ghost"
              className="h-14 md:h-16 flex flex-col gap-1 md:gap-2 p-2 admin-btn-secondary"
              onClick={() => navigate("/teacher-accounts")}
            >
              <GraduationCap className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm text-center leading-tight">Teacher Accounts</span>
            </Button>
            <Button
              variant="ghost"
              className="h-14 md:h-16 flex flex-col gap-1 md:gap-2 p-2 admin-btn-secondary"
              onClick={() => navigate("/classes")}
            >
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm text-center leading-tight">Classes</span>
            </Button>
            <Button
              variant="ghost"
              className="h-14 md:h-16 flex flex-col gap-1 md:gap-2 p-2 admin-btn-secondary"
              onClick={() => navigate("/admin/database-seeder")}
            >
              <Settings className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm text-center leading-tight">Database Tools</span>
            </Button>
            <Button
              variant="ghost"
              className="h-14 md:h-16 flex flex-col gap-1 md:gap-2 p-2 admin-btn-secondary"
              onClick={() => navigate("/preferences")}
            >
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm text-center leading-tight">Preferences</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
