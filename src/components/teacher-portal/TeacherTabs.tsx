import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  LineChart,
  Megaphone,
  MessageSquare,
  Users,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface TeacherTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TeacherTabs = ({ activeTab, onTabChange }: TeacherTabsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin, isAttendanceTaker, hasCapability } = useRBAC();
  const { t } = useI18n();

  // If on mobile, don't render the tabs as they're redundant with the bottom navigation
  if (isMobile) return null;

  const tabs = [
    {
      id: "overview",
      label: t("pages.teacherPortal.tabs.overview", "Overview"),
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "students",
      label: t("pages.teacherPortal.tabs.myStudents", "My Students"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "progress-book",
      label: t("pages.teacherPortal.tabs.progressBook", "Progress Book"),
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "attendance",
      label: t("pages.teacherPortal.tabs.attendance", "Attendance"),
      icon: <ClipboardList className="h-4 w-4" />,
      isExternalRoute: true,
    },
    {
      id: "schedule",
      label: t("pages.teacherPortal.tabs.schedule", "Schedule"),
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "performance",
      label: t("pages.teacherPortal.tabs.performance", "Performance"),
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      id: "messages",
      label: t("pages.teacherPortal.tabs.messages", "Messages"),
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "absences",
      label: t("pages.teacherPortal.tabs.absences", "My Absences"),
      icon: <CalendarOff className="h-4 w-4" />,
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: <Megaphone className="h-4 w-4" />,
    },
  ]
    // Attendance: admin or capability
    .filter((tab) => tab.id !== "attendance" || isAdmin || isAttendanceTaker || hasCapability("attendance_access"))
    // Progress: admin or capability
    .filter((tab) => tab.id !== "progress-book" || isAdmin || hasCapability("progress_access"))
    // Assignments: admin or capability
    .filter((tab) => tab.id !== "assignments" || isAdmin || hasCapability("assignments_access"));

  type Tab = { id: string; label: string; icon: JSX.Element; isExternalRoute?: boolean };
  const handleTabClick = (tab: Tab) => {
    if (tab.isExternalRoute) {
      if (tab.id === "attendance") {
        if (!isAdmin && !isAttendanceTaker) return;
        navigate("/attendance");
      }
    } else {
      navigate(`/dashboard?tab=${tab.id}`);
      onTabChange(tab.id);
    }
  };

  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-0.5 bg-gray-100/70 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150
              ${
              activeTab === tab.id
                ? "bg-green-700 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
