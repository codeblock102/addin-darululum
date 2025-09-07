import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Calendar, MessageSquare, Plus, Users, Settings, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface QuickActionsProps {
  teacherId: string;
  isAdmin?: boolean;
}

export const QuickActions = ({ teacherId: _teacherId, isAdmin = false }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { isAttendanceTaker } = useRBAC();
  const { t } = useI18n();

  const teacherActions = [
    {
      title: t("pages.teacherPortal.quickActions.addStudent", "Add Student"),
      icon: Plus,
      action: () => navigate("/dashboard?tab=students"),
      color: "bg-blue-500 hover:bg-blue-600",
      description: t("pages.teacherPortal.quickActions.addStudentDesc", "Register new students"),
    },
    isAttendanceTaker && {
      title: t("pages.teacherPortal.quickActions.takeAttendance", "Take Attendance"),
      icon: Calendar,
      action: () => navigate("/attendance"),
      color: "bg-green-500 hover:bg-green-600",
      description: t("pages.teacherPortal.quickActions.takeAttendanceDesc", "Mark daily attendance"),
    },
    {
      title: t("pages.teacherPortal.quickActions.viewStudents", "View Students"),
      icon: Users,
      action: () => navigate("/dashboard?tab=students"),
      color: "bg-purple-500 hover:bg-purple-600",
      description: t("pages.teacherPortal.quickActions.viewStudentsDesc", "Browse student list"),
    },
    {
      title: t("pages.teacherPortal.quickActions.messages", "Messages"),
      icon: MessageSquare,
      action: () => navigate("/dashboard?tab=messages"),
      color: "bg-orange-500 hover:bg-orange-600",
      description: t("pages.teacherPortal.quickActions.messagesDesc", "Send messages"),
    },
  ];

  const adminActions = [
    {
      title: t("pages.teacherPortal.quickActions.userManagement", "User Management"),
      icon: Users,
      action: () => navigate("/teachers"),
      color: "bg-[hsl(142.8,64.2%,24.1%)] hover:bg-[hsl(142.8,64.2%,28%)]",
      description: t("pages.teacherPortal.quickActions.userManagementDesc", "Manage teachers & students"),
    },
    {
      title: t("pages.teacherPortal.quickActions.systemAnalytics", "System Analytics"),
      icon: BarChart3,
      action: () => navigate("/admin"),
      color: "bg-blue-500 hover:bg-blue-600",
      description: t("pages.teacherPortal.quickActions.systemAnalyticsDesc", "View system statistics"),
    },
    {
      title: t("pages.teacherPortal.quickActions.parentAccounts", "Parent Accounts"),
      icon: MessageSquare,
      action: () => navigate("/admin/parent-accounts"),
      color: "bg-green-500 hover:bg-green-600",
      description: t("pages.teacherPortal.quickActions.parentAccountsDesc", "Manage parent access"),
    },
    {
      title: t("pages.teacherPortal.quickActions.settings", "Settings"),
      icon: Settings,
      action: () => navigate("/settings"),
      color: "bg-purple-500 hover:bg-purple-600",
      description: t("pages.teacherPortal.quickActions.settingsDesc", "System configuration"),
    },
  ];

  type Action = { title: string; icon: typeof Users; action: () => void; color: string; description: string };
  const actions: Action[] = (isAdmin ? adminActions : teacherActions).filter((a): a is Action => Boolean(a));

  return (
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardHeader className={`pb-3 ${isAdmin ? 'pb-2' : 'pb-3'}`}>
        <CardTitle className={`flex items-center gap-3 font-semibold text-gray-800 ${isAdmin ? 'text-base' : 'text-lg'}`}>
          <div className={`p-2 bg-[hsl(142.8,64.2%,24.1%)]/10 rounded-lg ${isAdmin ? 'p-1.5' : 'p-2'}`}>
            <Calendar className={`text-[hsl(142.8,64.2%,24.1%)] ${isAdmin ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          {isAdmin ? t("pages.teacherPortal.quickActions.systemActions", "System Actions") : t("pages.teacherPortal.quickActions.quickActions", "Quick Actions")}
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
                <div className="text-xs text-black mt-1">
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
