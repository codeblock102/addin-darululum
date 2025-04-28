
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardHeader } from "./DashboardHeader";
import { TeacherTabs } from "./TeacherTabs";
import { StudentSearch } from "./dashboard/StudentSearch";
import { QuickActions } from "./dashboard/QuickActions";
import { TodayStudents } from "./dashboard/TodayStudents";
import { RecentActivity } from "./dashboard/RecentActivity";
import { MyStudents } from "./MyStudents";
import { ProgressRecording } from "./ProgressRecording";
import { TeacherAttendance } from "./TeacherAttendance";
import { TeacherPerformance } from "./dashboard/TeacherPerformance";
import { TeacherMessagesEnhanced } from "./messaging/TeacherMessagesEnhanced";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['students', 'progress', 'attendance', 'performance', 'messages'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "students":
        return <MyStudents teacherId={teacher.id} />;
      case "progress":
        return <ProgressRecording teacherId={teacher.id} />;
      case "attendance":
        return <TeacherAttendance teacherId={teacher.id} />; 
      case "performance":
        return <TeacherPerformance teacherId={teacher.id} />;
      case "messages":
        return <TeacherMessagesEnhanced teacherId={teacher.id} teacherName={teacher.name} />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StudentSearch teacherId={teacher.id} />
              <QuickActions teacherId={teacher.id} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TodayStudents teacherId={teacher.id} />
              <RecentActivity teacherId={teacher.id} />
            </div>
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
