
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardSummary } from "./DashboardSummary";
import { TeacherTabs } from "./TeacherTabs";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  // Set initial tab based on URL query parameters
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {teacher.name}</h1>
        <p className="text-muted-foreground">
          Teacher Portal - {teacher.subject} | Experience: {teacher.experience}
        </p>
      </div>
      
      {activeTab === "overview" && <DashboardSummary summaryData={summaryData} />}
      <TeacherTabs 
        teacher={teacher} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};
