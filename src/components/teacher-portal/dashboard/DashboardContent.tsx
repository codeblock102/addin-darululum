import { MyStudents } from "../MyStudents.tsx";
import { TeacherDhorBook } from "../TeacherDhorBook.tsx";
import { TeacherAttendance } from "../TeacherAttendance.tsx";
import { TeacherPerformance } from "./TeacherPerformance.tsx";
import TeacherMessages from "@/pages/TeacherMessages.tsx";
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
  const { isAdmin, hasCapability } = useRBAC();
  switch (activeTab) {
    case "students":
      return <MyStudents teacherId={teacherId} isAdmin={isAdmin} />;
    case "progress-book":
      // Progress by capability or admin
      return isAdmin || hasCapability("progress_access") ? <TeacherDhorBook teacherId={teacherId} /> : <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
    case "attendance":
      return <TeacherAttendance />;
    case "performance":
      return <TeacherPerformance teacherId={teacherId} />;
    case "messages":
      return <TeacherMessages />;
    case "assignments":
      // Assignments by capability or admin
      return isAdmin || hasCapability("assignments_access") ? <TeacherAssignments teacherId={teacherId} /> : <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
    default:
      return <DashboardOverview teacherId={teacherId} isAdmin={isAdmin} />;
  }
};
