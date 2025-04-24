
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
  
  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };
  
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="overview" className="transition-all duration-200">Overview</TabsTrigger>
        <TabsTrigger value="students" className="transition-all duration-200">Students</TabsTrigger>
        <TabsTrigger value="progress" className="transition-all duration-200">Progress</TabsTrigger>
        <TabsTrigger value="grading" className="transition-all duration-200">Grading</TabsTrigger>
        <TabsTrigger value="analytics" className="transition-all duration-200">Analytics</TabsTrigger>
        <TabsTrigger value="messages" className="transition-all duration-200">Messages</TabsTrigger>
        <TabsTrigger value="profile" className="transition-all duration-200">Profile</TabsTrigger>
      </TabsList>
      
      <motion.div
        key={activeTab}
        initial="hidden"
        animate="visible"
        variants={tabVariants}
      >
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
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
      </motion.div>
    </Tabs>
  );
};
