
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardHeader } from "./DashboardHeader";
import { TeacherTabs } from "./TeacherTabs";
import { DashboardTabContent, useActiveTab } from "./dashboard/DashboardTabs";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const { activeTab, setActiveTab } = useActiveTab();
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <DashboardHeader teacher={teacher} />
      
      <TeacherTabs 
        teacher={teacher} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <DashboardTabContent 
        activeTab={activeTab} 
        teacherId={teacher.id}
        teacherName={teacher.name}
      />
    </div>
  );
};
