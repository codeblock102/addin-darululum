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
  const { data: classes, isLoading: isLoadingClasses } = useTeacherClasses(
    teacher.id,
  );
  useTeacherSummary(teacher.id);

  return (
    <div className="space-y-6 animate-fadeIn">
      <DashboardHeader
        teacher={teacher}
        classes={classes}
        isLoadingClasses={isLoadingClasses}
      />

      {
        /* <TeacherTabs
        teacher={teacher}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      /> */
      }

      <DashboardContent
        activeTab={activeTab}
        teacherId={teacher.id}
        teacherName={teacher.name}
        isAdmin={isAdmin}
      />
    </div>
  );
};
