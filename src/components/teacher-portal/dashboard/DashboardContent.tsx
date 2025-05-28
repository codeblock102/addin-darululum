import { MyStudents } from "../MyStudents";
import { TeacherDhorBook } from "../TeacherDhorBook";
import { TeacherAttendance } from "../TeacherAttendance";
import { TeacherSchedule } from "../TeacherSchedule";
import { TeacherPerformance } from "./TeacherPerformance";
import { TeacherMessagesEnhanced } from "../messaging/TeacherMessagesEnhanced";
import { DashboardOverview } from "./DashboardOverview";

interface DashboardContentProps {
  activeTab: string;
  teacherId: string;
  teacherName?: string;
}

export const DashboardContent = ({ activeTab, teacherId, teacherName }: DashboardContentProps) => {
  switch (activeTab) {
    case "students":
      return <MyStudents teacherId={teacherId} />;
    case "progress-book":
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
