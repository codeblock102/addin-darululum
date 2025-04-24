
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherSchedule } from "./TeacherSchedule";
import { MyStudents } from "./MyStudents";
import { ProgressRecording } from "./ProgressRecording";
import { TeacherGrading } from "./TeacherGrading";
import { TeacherAnalytics } from "./TeacherAnalytics";
import { TeacherMessages } from "./TeacherMessages";
import { TeacherProfile } from "./TeacherProfile";
import { Teacher } from "@/types/teacher";
import { motion } from "framer-motion";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { StudentStatusList } from "./StudentStatusList";
import { DashboardSummary } from "./DashboardSummary";

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

  const tabVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const {
    data: summaryData
  } = useTeacherSummary(teacher.id);

  // If activeTab is overview, we display the dashboard content directly
  if (activeTab === "overview") {
    return <div className="space-y-6">
        <div className="animate-slideIn space-y-6">
          <DashboardSummary summaryData={summaryData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4">Recent Student Status</h3>
              <StudentStatusList teacherId={teacher.id} />
            </Card>
            
            <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4">Upcoming Schedule</h3>
              <div className="space-y-4">
                {/* Simplified schedule view */}
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium">Hifz Morning Class</p>
                    <p className="text-sm text-muted-foreground">Group A</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">8:00 AM</p>
                    <p className="text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium">Tajweed Class</p>
                    <p className="text-sm text-muted-foreground">Group B</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">11:00 AM</p>
                    <p className="text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium">Advanced Hifz</p>
                    <p className="text-sm text-muted-foreground">Individual</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">2:00 PM</p>
                    <p className="text-muted-foreground">Tomorrow</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>;
  }

  // For all other tabs, we'll use the Tabs component properly
  return <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="students">My Students</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
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
          <TeacherMessages teacherId={teacher.id} teacherName={teacher.name} />
        </TabsContent>
        
        <TabsContent value="profile" className="mt-6">
          <TeacherProfile teacher={teacher} />
        </TabsContent>
      </Tabs>
    </div>;
};
