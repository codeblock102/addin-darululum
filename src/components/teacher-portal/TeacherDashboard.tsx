
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSummary } from "./DashboardSummary";
import { TeacherTabs } from "./TeacherTabs";
import { Card } from "@/components/ui/card";
import { StudentStatusList } from "./StudentStatusList";
import { TeacherSchedule } from "./TeacherSchedule";
import { TeacherMessagesEnhanced } from "./messaging/TeacherMessagesEnhanced";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  // Initialize real-time updates
  useRealtimeAnalytics(teacher.id);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['students', 'progress', 'grading', 'analytics', 'messages', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "students":
        return <StudentStatusList teacherId={teacher.id} />;
      case "messages":
        return <TeacherMessagesEnhanced teacherId={teacher.id} teacherName={teacher.name} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <StudentStatusList teacherId={teacher.id} />
            </Card>
            <Card className="p-4">
              <TeacherSchedule teacherId={teacher.id} />
            </Card>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <DashboardHeader teacher={teacher} />
      
      <TeacherTabs 
        teacher={teacher} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {renderTabContent()}
    </div>
  );
};
