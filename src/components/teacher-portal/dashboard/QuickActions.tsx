import { Calendar, MessageSquare, Plus, Users, Settings, BarChart3, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { cn } from "@/lib/utils.ts";

interface QuickActionsProps {
  teacherId: string;
  isAdmin?: boolean;
}

type Action = {
  title: string;
  icon: React.ElementType;
  action: () => void;
  iconClass: string;
  description: string;
};

export const QuickActions = ({ teacherId: _teacherId, isAdmin = false }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { isAttendanceTaker } = useRBAC();
  const { t } = useI18n();

  const teacherActions: Action[] = [
    {
      title: t("pages.teacherPortal.quickActions.addStudent", "Add Student"),
      icon: Plus,
      action: () => navigate("/dashboard?tab=students"),
      iconClass: "bg-blue-100 text-blue-600",
      description: t("pages.teacherPortal.quickActions.addStudentDesc", "Register new students"),
    },
    ...(isAttendanceTaker ? [{
      title: t("pages.teacherPortal.quickActions.takeAttendance", "Take Attendance"),
      icon: Calendar,
      action: () => navigate("/attendance"),
      iconClass: "bg-green-100 text-green-600",
      description: t("pages.teacherPortal.quickActions.takeAttendanceDesc", "Mark daily attendance"),
    }] : []),
    {
      title: t("pages.teacherPortal.quickActions.viewStudents", "View Students"),
      icon: Users,
      action: () => navigate("/dashboard?tab=students"),
      iconClass: "bg-purple-100 text-purple-600",
      description: t("pages.teacherPortal.quickActions.viewStudentsDesc", "Browse student list"),
    },
  ];

  const adminActions: Action[] = [
    {
      title: t("pages.teacherPortal.quickActions.userManagement", "User Management"),
      icon: Users,
      action: () => navigate("/teachers"),
      iconClass: "bg-green-100 text-green-600",
      description: t("pages.teacherPortal.quickActions.userManagementDesc", "Manage teachers & students"),
    },
    {
      title: t("pages.teacherPortal.quickActions.systemAnalytics", "System Analytics"),
      icon: BarChart3,
      action: () => navigate("/admin"),
      iconClass: "bg-blue-100 text-blue-600",
      description: t("pages.teacherPortal.quickActions.systemAnalyticsDesc", "View system statistics"),
    },
    {
      title: t("pages.teacherPortal.quickActions.parentAccounts", "Parent Accounts"),
      icon: MessageSquare,
      action: () => navigate("/admin/parent-accounts"),
      iconClass: "bg-teal-100 text-teal-600",
      description: t("pages.teacherPortal.quickActions.parentAccountsDesc", "Manage parent access"),
    },
    {
      title: t("pages.teacherPortal.quickActions.settings", "Settings"),
      icon: Settings,
      action: () => navigate("/settings"),
      iconClass: "bg-gray-100 text-gray-600",
      description: t("pages.teacherPortal.quickActions.settingsDesc", "System configuration"),
    },
  ];

  const actions = isAdmin ? adminActions : teacherActions;

  return (
    <div>
      {/* Section accent header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="border-l-2 border-green-600 pl-3">
          <p className="text-sm font-bold text-gray-800">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {isAdmin
                ? t("pages.teacherPortal.quickActions.systemActions", "System Actions")
                : t("pages.teacherPortal.quickActions.quickActions", "Quick Actions")}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={cn(
                "flex flex-col items-start gap-2.5 p-4 rounded-xl border border-gray-100 bg-white",
                "hover:border-green-200 hover:bg-green-50/30 transition-all duration-150 text-left group",
              )}
            >
              <div className={cn("p-2 rounded-lg", action.iconClass)}>
                <action.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 group-hover:text-gray-900">
                  {action.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
