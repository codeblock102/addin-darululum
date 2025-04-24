
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherSchedule } from "./TeacherSchedule";
import { MyStudents } from "./MyStudents";
import { ProgressRecording } from "./ProgressRecording";
import { TeacherGrading } from "./TeacherGrading";
import { TeacherAnalytics } from "./TeacherAnalytics";
import { TeacherProfile } from "./TeacherProfile";
import { Teacher } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { StudentStatusList } from "./StudentStatusList";
import { DashboardSummary } from "./DashboardSummary";
import { TeacherMessagesEnhanced } from "./messaging/TeacherMessagesEnhanced";

interface TeacherTabsProps {
  teacher: Teacher;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const TeacherTabs = ({
  teacher,
  activeTab,
  onTabChange
}: TeacherTabsProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle tab changes from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['students', 'progress', 'grading', 'analytics', 'messages', 'profile'].includes(tabParam)) {
      onTabChange(tabParam);
    } else if (location.search && !tabParam) {
      // Clear search params if they don't include a valid tab
      navigate('/teacher-portal', {
        replace: true
      });
    }
  }, [location.search, navigate, onTabChange]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    onTabChange(value);
    if (value === 'overview') {
      navigate('/teacher-portal', {
        replace: true
      });
    } else {
      navigate(`/teacher-portal?tab=${value}`, {
        replace: true
      });
    }
  };

  const { data: summaryData } = useTeacherSummary(teacher.id);

  // If activeTab is overview, we display the dashboard content directly
  if (activeTab === "overview") {
    return (
      <div className="space-y-6">
        <div className="animate-slideIn space-y-6">
          <DashboardSummary summaryData={summaryData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Student Status</h3>
                <StudentStatusList teacherId={teacher.id} />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Upcoming Schedule</h3>
                <TeacherSchedule teacherId={teacher.id} limit={3} dashboard={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For all other tabs, we'll use the Tabs component properly
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="students">My Students</TabsTrigger>
          <TabsTrigger value="progress">Record Progress</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-6">
          <MyStudents teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-6">
          <ProgressRecording teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="grading" className="mt-6">
          <TeacherGrading teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <TeacherAnalytics teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="messages" className="mt-6">
          <TeacherMessagesEnhanced teacherId={teacher.id} teacherName={teacher.name} />
        </TabsContent>
        
        <TabsContent value="profile" className="mt-6">
          <TeacherProfile teacher={teacher} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
