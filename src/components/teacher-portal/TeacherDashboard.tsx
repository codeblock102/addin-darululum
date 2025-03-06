
import { useState } from "react";
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardSummary } from "./DashboardSummary";
import { TeacherTabs } from "./TeacherTabs";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {teacher.name}</h1>
        <p className="text-muted-foreground">
          Teacher Portal - {teacher.subject} | Experience: {teacher.experience}
        </p>
      </div>
      
      <DashboardSummary summaryData={summaryData} />
      <TeacherTabs 
        teacher={teacher} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};
