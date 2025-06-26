import { MyStudents } from "../MyStudents.tsx";
import { TeacherDhorBook } from "../TeacherDhorBook.tsx";
import { TeacherAttendance } from "../TeacherAttendance.tsx";
import { TeacherPerformance } from "./TeacherPerformance.tsx";
import { TeacherMessagesEnhanced } from "../messaging/TeacherMessagesEnhanced.tsx";
import { DashboardOverview } from "./DashboardOverview.tsx";

interface DashboardContentProps {
  activeTab: string;
  teacherId: string;
  teacherName?: string;
  isAdmin?: boolean;
}

export const DashboardContent = (
  { activeTab, teacherId, teacherName, isAdmin }: DashboardContentProps,
) => {
  switch (activeTab) {
    case "students":
      return <MyStudents teacherId={teacherId} isAdmin={isAdmin} />;
    case "progress-book":
      return <TeacherDhorBook teacherId={teacherId} />;
    case "attendance":
      return <TeacherAttendance />;
    case "performance":
      return <TeacherPerformance teacherId={teacherId} />;
    case "messages":
      return (
        <TeacherMessagesEnhanced
          teacherId={teacherId}
          teacherName={teacherName || ""}
        />
      );
    default:
      return <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
  }
};
