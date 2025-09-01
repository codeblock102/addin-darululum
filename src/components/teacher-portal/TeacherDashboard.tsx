import { Teacher } from "@/types/teacher.ts";
import { useActiveTab } from "./dashboard/DashboardNav.tsx";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useTeacherSummary } from "@/hooks/useTeacherSummary.ts";
import { DashboardHeader } from "./DashboardHeader.tsx";
import { DashboardOverview } from "./dashboard/DashboardOverview.tsx";
import { MyStudents } from "./MyStudents.tsx";
import { TeacherDhorBook } from "./TeacherDhorBook.tsx";
import { TeacherAssignments } from "./TeacherAssignments.tsx";
import { TeacherAnalytics } from "./TeacherAnalytics.tsx";
import { TeacherAttendance } from "./TeacherAttendance.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";

interface TeacherDashboardProps {
  teacher: Teacher;
  isAdmin?: boolean;
}

export const TeacherDashboard = (
  { teacher, isAdmin: isAdminProp = false }: TeacherDashboardProps,
) => {
  const { activeTab } = useActiveTab();
  const { isAdmin: isAdminRole, hasCapability } = useRBAC();
  const isAdmin = isAdminProp || isAdminRole;
  const { data: classes, isLoading: isLoadingClasses } = useTeacherClasses(
    teacher.id,
  );
  useTeacherSummary(teacher.id);

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview teacherId={teacher.id} isAdmin={isAdmin} />;
      case "students":
        return <MyStudents teacherId={teacher.id} />;
      case "progress-book":
        return isAdmin || hasCapability("progress_access") ? <TeacherDhorBook teacherId={teacher.id} /> : <DashboardOverview teacherId={teacher.id} isAdmin={isAdmin} />;
      case "assignments":
        return isAdmin || hasCapability("assignments_access") ? <TeacherAssignments teacherId={teacher.id} /> : <DashboardOverview teacherId={teacher.id} isAdmin={isAdmin} />;
      case "attendance":
        return <TeacherAttendance />;
      case "performance":
        return <TeacherAnalytics teacherId={teacher.id} />;
      default:
        return <DashboardOverview teacherId={teacher.id} isAdmin={isAdmin} />;
    }
  };

  // For admin users, render without DashboardLayout to avoid duplication
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DashboardHeader
            teacher={teacher}
            classes={classes}
            isLoadingClasses={isLoadingClasses}
            isAdmin={isAdmin}
          />
          {renderTabContent()}
        </div>
      </div>
    );
  }

  // For regular teachers, render directly since DashboardLayout is already applied in App.tsx
  return (
    <div className="space-y-6">
      <DashboardHeader
        teacher={teacher}
        classes={classes}
        isLoadingClasses={isLoadingClasses}
        isAdmin={isAdmin}
      />
      {renderTabContent()}
    </div>
  );
};
