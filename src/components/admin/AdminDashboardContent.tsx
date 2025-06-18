
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <AdminStatsCards />

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary transition-all duration-200"
                onClick={action.action}
              >
                <action.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Management Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="ghost"
              className="h-16 flex flex-col gap-2"
              onClick={() => navigate("/teacher-accounts")}
            >
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm">Teacher Accounts</span>
            </Button>
            <Button
              variant="ghost"
              className="h-16 flex flex-col gap-2"
              onClick={() => navigate("/classes")}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-sm">Classes</span>
            </Button>
            <Button
              variant="ghost"
              className="h-16 flex flex-col gap-2"
              onClick={() => navigate("/admin/database-seeder")}
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">Database Tools</span>
            </Button>
            <Button
              variant="ghost"
              className="h-16 flex flex-col gap-2"
              onClick={() => navigate("/preferences")}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm">Preferences</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
