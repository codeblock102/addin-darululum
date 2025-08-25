import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, Plus, Users, Settings, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  teacherId: string;
  isAdmin?: boolean;
}

export const QuickActions = ({ teacherId, isAdmin = false }: QuickActionsProps) => {
  const navigate = useNavigate();

  const teacherActions = [
    {
      title: "Add Student",
      icon: Plus,
      action: () => navigate("/dashboard?tab=students"),
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Register new students",
    },
    {
      title: "Take Attendance",
      icon: Calendar,
      action: () => navigate("/attendance"),
      color: "bg-green-500 hover:bg-green-600",
      description: "Mark daily attendance",
    },
    {
      title: "View Students",
      icon: Users,
      action: () => navigate("/dashboard?tab=students"),
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Browse student list",
    },
    {
      title: "Messages",
      icon: MessageSquare,
      action: () => navigate("/dashboard?tab=messages"),
      color: "bg-orange-500 hover:bg-orange-600",
      description: "Send messages",
    },
  ];

  const adminActions = [
    {
      title: "User Management",
      icon: Users,
      action: () => navigate("/teachers"),
      color: "bg-[hsl(142.8,64.2%,24.1%)] hover:bg-[hsl(142.8,64.2%,28%)]",
      description: "Manage teachers & students",
    },
    {
      title: "System Analytics",
      icon: BarChart3,
      action: () => navigate("/admin"),
      color: "bg-blue-500 hover:bg-blue-600",
      description: "View system statistics",
    },
    {
      title: "Parent Accounts",
      icon: MessageSquare,
      action: () => navigate("/admin/parent-accounts"),
      color: "bg-green-500 hover:bg-green-600",
      description: "Manage parent access",
    },
    {
      title: "Settings",
      icon: Settings,
      action: () => navigate("/settings"),
      color: "bg-purple-500 hover:bg-purple-600",
      description: "System configuration",
    },
  ];

  const actions = isAdmin ? adminActions : teacherActions;

  return (
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          <div className="p-2 bg-[hsl(142.8,64.2%,24.1%)]/10 rounded-lg">
            <Calendar className="h-5 w-5 text-[hsl(142.8,64.2%,24.1%)]" />
          </div>
          {isAdmin ? "System Actions" : "Quick Actions"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-gray-200 hover:border-[hsl(142.8,64.2%,24.1%)] hover:shadow-sm transition-all duration-200 bg-white hover:bg-gray-50 group"
              onClick={action.action}
            >
              <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-105 transition-transform duration-200`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-800 group-hover:text-[hsl(142.8,64.2%,24.1%)] transition-colors duration-200">
                  {action.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
