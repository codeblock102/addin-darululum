import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  LineChart,
  MessageSquare,
  Users,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";

interface TeacherTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TeacherTabs = ({ activeTab, onTabChange }: TeacherTabsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin, isAttendanceTaker, isHifdhTeacher } = useRBAC();

  // If on mobile, don't render the tabs as they're redundant with the bottom navigation
  if (isMobile) return null;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "students",
      label: "My Students",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "progress-book",
      label: "Progress Book",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: <ClipboardList className="h-4 w-4" />,
      isExternalRoute: true, // Flag for routes that go to separate pages
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "performance",
      label: "Performance",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ]
    // Hide attendance unless admin or attendance taker
    .filter((tab) => tab.id !== "attendance" || isAdmin || isAttendanceTaker)
    // Hide progress-book for non-Hifdh teachers only? Requirement says: other teachers don't have access to progress
    // So only Hifdh teachers can see progress-book; admins always can
    .filter((tab) => tab.id !== "progress-book" || isAdmin || isHifdhTeacher)
    // Hide assignments tab for Hifdh teachers if it exists
    .filter((tab) => tab.id !== "assignments" || !isHifdhTeacher);

  const handleTabClick = (tab: any) => {
    if (tab.isExternalRoute) {
      // Navigate to external route (separate page)
      if (tab.id === "attendance") {
        if (!isAdmin && !isAttendanceTaker) return;
        navigate("/attendance");
      }
    } else {
      // Navigate within dashboard tabs
      navigate(`/dashboard?tab=${tab.id}`);
      onTabChange(tab.id);
    }
  };

  return (
    <div className="mb-8">
      <div className="border-b">
        <div className="flex flex-wrap -mb-px space-x-1 md:space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`
                flex items-center py-3 px-1 md:px-3 text-sm font-medium text-center border-b-2 whitespace-nowrap
                ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }
              `}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
