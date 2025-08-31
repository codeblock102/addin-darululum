import { MyStudents } from "../MyStudents.tsx";
import { TeacherDhorBook } from "../TeacherDhorBook.tsx";
import { TeacherAttendance } from "../TeacherAttendance.tsx";
import { TeacherPerformance } from "./TeacherPerformance.tsx";
import { TeacherMessagesEnhanced } from "../messaging/TeacherMessagesEnhanced.tsx";
import { DashboardOverview } from "./DashboardOverview.tsx";
import { TeacherAssignments } from "../TeacherAssignments.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";

interface DashboardContentProps {
  activeTab: string;
  teacherId: string;
  teacherName?: string;
  isAdmin?: boolean;
}

export const DashboardContent = (
  { activeTab, teacherId, teacherName, isAdmin }: DashboardContentProps,
) => {
  const { isHifdhTeacher } = useRBAC();
  switch (activeTab) {
    case "students":
      return <MyStudents teacherId={teacherId} isAdmin={isAdmin} />;
    case "progress-book":
      // Only Hifdh teachers (or admins at container level) should access progress-book
      return isHifdhTeacher || isAdmin ? <TeacherDhorBook teacherId={teacherId} /> : <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
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
    case "assignments":
      // Hide assignments tab for Hifdh teachers
      return !isHifdhTeacher ? <TeacherAssignments teacherId={teacherId} /> : <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
    default:
      return <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
  }
};
