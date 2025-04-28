
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSummary } from "./DashboardSummary";
import { TeacherTabs } from "./TeacherTabs";
import { Card } from "@/components/ui/card";
import { StudentStatusList } from "./StudentStatusList";
import { TeacherSchedule } from "./TeacherSchedule";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['students', 'progress', 'grading', 'analytics', 'messages', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <DashboardHeader teacher={teacher} />
      
      <TeacherTabs 
        teacher={teacher} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};
