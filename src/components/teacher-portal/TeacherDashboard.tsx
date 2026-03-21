/**
 * @file src/components/teacher-portal/TeacherDashboard.tsx
 * @summary Teacher portal main dashboard showing stats, leaderboard, and quick actions.
 */

import { TeacherDashboardProps } from "@/types/teacher.ts";
import { useTeacherSummary } from "@/hooks/useTeacherSummary.ts";
import { DashboardHeader } from "./DashboardHeader.tsx";
import { DashboardContent } from "./dashboard/DashboardContent.tsx";
import { useActiveTab } from "./dashboard/DashboardNav.tsx";

export const TeacherDashboard = (
  { teacher, isAdmin = false }: TeacherDashboardProps & { isAdmin?: boolean },
) => {
  const { activeTab } = useActiveTab();
  useTeacherSummary(teacher.id);

  return (
    <div className="space-y-6 animate-fadeIn">
      <DashboardHeader teacher={teacher} />

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
