
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { MyStudents } from "../MyStudents";
import { TeacherDhorBook } from "../TeacherDhorBook";
import { TeacherAttendance } from "../TeacherAttendance";
import { TeacherSchedule } from "../TeacherSchedule";
import { TeacherPerformance } from "./TeacherPerformance";
import { TeacherMessagesEnhanced } from "../messaging/TeacherMessagesEnhanced";
import { DashboardOverview } from "./DashboardOverview";

interface DashboardTabsProps {
  activeTab: string;
  teacherId: string;
  teacherName?: string;
}

export const DashboardTabContent = ({ activeTab, teacherId, teacherName }: DashboardTabsProps) => {
  switch (activeTab) {
    case "students":
      return <MyStudents teacherId={teacherId} />;
    case "dhor-book":
      return <TeacherDhorBook teacherId={teacherId} />;
    case "attendance":
      return <TeacherAttendance teacherId={teacherId} />; 
    case "schedule":
      return <TeacherSchedule teacherId={teacherId} />;
    case "performance":
      return <TeacherPerformance teacherId={teacherId} />;
    case "messages":
      return <TeacherMessagesEnhanced teacherId={teacherId} teacherName={teacherName || ''} />;
    default:
      return <DashboardOverview teacherId={teacherId} />;
  }
};

export const useActiveTab = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['students', 'dhor-book', 'attendance', 'schedule', 'performance', 'messages'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);
  
  return { activeTab, setActiveTab };
};
