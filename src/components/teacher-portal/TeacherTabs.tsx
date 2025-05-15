
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Teacher } from "@/types/teacher"; 
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  CalendarDays, 
  LineChart, 
  MessageSquare,
  Trophy 
} from "lucide-react";

interface TeacherTabsProps {
  teacher: Teacher;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TeacherTabs = ({ teacher, activeTab, onTabChange }: TeacherTabsProps) => {
  const navigate = useNavigate();
  
  const tabs = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: <BookOpen className="h-4 w-4" /> 
    },
    { 
      id: "students", 
      label: "My Students", 
      icon: <Users className="h-4 w-4" /> 
    },
    { 
      id: "dhor-book", 
      label: "Dhor Book", 
      icon: <BookOpen className="h-4 w-4" /> 
    },
    { 
      id: "attendance", 
      label: "Attendance", 
      icon: <ClipboardList className="h-4 w-4" /> 
    },
    { 
      id: "schedule", 
      label: "Schedule", 
      icon: <CalendarDays className="h-4 w-4" /> 
    },
    {
      id: "leaderboard", 
      label: "Leaderboard", 
      icon: <Trophy className="h-4 w-4" />
    },
    { 
      id: "performance", 
      label: "Performance", 
      icon: <LineChart className="h-4 w-4" /> 
    },
    { 
      id: "messages", 
      label: "Messages", 
      icon: <MessageSquare className="h-4 w-4" /> 
    }
  ];
  
  const handleTabClick = (tabId: string) => {
    navigate(`/teacher-portal?tab=${tabId}`);
    onTabChange(tabId);
  };
  
  return (
    <div className="mb-8">
      <div className="border-b">
        <div className="flex flex-wrap -mb-px space-x-1 md:space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center py-3 px-1 md:px-3 text-sm font-medium text-center border-b-2 whitespace-nowrap
                ${activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"}
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
