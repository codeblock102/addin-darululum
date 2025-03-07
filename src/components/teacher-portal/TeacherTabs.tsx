
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

interface TeacherTabsProps {
  teacher: Teacher;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const TeacherTabs = ({ teacher, activeTab, onTabChange }: TeacherTabsProps) => {
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
      navigate('/teacher-portal', { replace: true });
    }
  }, [location.search, navigate, onTabChange]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    onTabChange(value);
    
    if (value === 'overview') {
      navigate('/teacher-portal', { replace: true });
    } else {
      navigate(`/teacher-portal?tab=${value}`, { replace: true });
    }
  };
  
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="grid grid-cols-7 w-full">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="grading">Grading</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Teaching Schedule</CardTitle>
            <CardDescription>
              Your upcoming classes for the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherSchedule teacherId={teacher.id} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="students" className="space-y-4 mt-6">
        <MyStudents teacherId={teacher.id} />
      </TabsContent>
      
      <TabsContent value="progress" className="space-y-4 mt-6">
        <ProgressRecording teacherId={teacher.id} />
      </TabsContent>
      
      <TabsContent value="grading" className="space-y-4 mt-6">
        <TeacherGrading teacherId={teacher.id} />
      </TabsContent>
      
      <TabsContent value="analytics" className="space-y-4 mt-6">
        <TeacherAnalytics teacherId={teacher.id} />
      </TabsContent>
      
      <TabsContent value="messages" className="space-y-4 mt-6">
        <TeacherMessages teacherId={teacher.id} teacherName={teacher.name} />
      </TabsContent>
      
      <TabsContent value="profile" className="space-y-4 mt-6">
        <TeacherProfile teacher={teacher} />
      </TabsContent>
    </Tabs>
  );
};
