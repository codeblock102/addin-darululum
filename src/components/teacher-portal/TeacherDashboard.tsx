import { TeacherDashboardProps } from "@/types/teacher.ts";
import { useTeacherSummary } from "@/hooks/useTeacherSummary.ts";
import { DashboardHeader } from "./DashboardHeader.tsx";
import { DashboardContent } from "./dashboard/DashboardContent.tsx";
import { useActiveTab } from "./dashboard/DashboardNav.tsx";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";

export const TeacherDashboard = (
  { teacher, isAdmin = false }: TeacherDashboardProps & { isAdmin?: boolean },
) => {
  const { activeTab } = useActiveTab();
  const teacherId = teacher?.id;
  const { data: classes, isLoading: isLoadingClasses } = useTeacherClasses(
    teacherId || "",
  );
  if (teacherId) {
    useTeacherSummary(teacherId);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {teacher ? (
        <DashboardHeader
          teacher={teacher}
          classes={classes}
          isLoadingClasses={isLoadingClasses}
        />
      ) : (
        <div className="p-4 text-sm text-gray-600">Loading teacher...</div>
      )}

      {
        /* <TeacherTabs
        teacher={teacher}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      /> */
      }

      {teacher ? (
        <DashboardContent
          activeTab={activeTab}
          teacherId={teacher.id}
          teacherName={teacher.name}
          isAdmin={isAdmin}
        />
      ) : null}
    </div>
  );
};
