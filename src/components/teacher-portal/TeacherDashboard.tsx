
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardHeader } from "./DashboardHeader";
import { TeacherTabs } from "./TeacherTabs";
import { DashboardContent } from "./dashboard/DashboardContent";
import { useActiveTab } from "./dashboard/DashboardNav";

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
      
      <DashboardContent 
        activeTab={activeTab} 
        teacherId={teacher.id}
        teacherName={teacher.name}
      />
    </div>
  );
};
