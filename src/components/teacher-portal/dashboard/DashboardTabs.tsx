import { MyStudents } from "../MyStudents";
import { TeacherAttendance } from "../TeacherAttendance";
import { TeacherPerformance } from "./TeacherPerformance";
import { TeacherMessagesEnhanced } from "../messaging/TeacherMessagesEnhanced";
import { DashboardOverview } from "./DashboardOverview";

// This file is kept for backward compatibility
// The functionality has been moved to DashboardContent.tsx and DashboardNav.tsx

export { DashboardOverview } from "./DashboardOverview.tsx";

interface DashboardTabsProps {
  activeTab: string;
  teacherId: string;
  teacherName?: string;
}

export const DashboardTabContent = ({ activeTab, teacherId, teacherName }: DashboardTabsProps) => {
  switch (activeTab) {
    case "students":
      return <MyStudents teacherId={teacherId} />;
    case "attendance":
      return <TeacherAttendance teacherId={teacherId} />; 
    case "performance":
      return <TeacherPerformance teacherId={teacherId} />;
    case "messages":
      return <TeacherMessagesEnhanced teacherId={teacherId} teacherName={teacherName || ''} />;
    default:
      return <DashboardOverview teacherId={teacherId} />;
  }
};
