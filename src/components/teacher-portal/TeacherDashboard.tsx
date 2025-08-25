import { Teacher } from "@/types/teacher.ts";
import { useActiveTab } from "./dashboard/DashboardNav.tsx";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useTeacherSummary } from "@/hooks/useTeacherSummary.ts";
import { DashboardLayout } from "@/components/layouts/DashboardLayout.tsx";
import { DashboardHeader } from "./DashboardHeader.tsx";
import { DashboardOverview } from "./dashboard/DashboardOverview.tsx";

interface TeacherDashboardProps {
  teacher: Teacher;
  isAdmin?: boolean;
}

export const TeacherDashboard = (
  { teacher, isAdmin = false }: TeacherDashboardProps,
) => {
  const { activeTab } = useActiveTab();
  const { data: classes, isLoading: isLoadingClasses } = useTeacherClasses(
    teacher.id,
  );
  useTeacherSummary(teacher.id);

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
          <DashboardOverview teacherId={teacher.id} isAdmin={isAdmin} />
        </div>
      </div>
    );
  }

  // For regular teachers, use the full DashboardLayout
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader 
          teacher={teacher} 
          classes={classes} 
          isLoadingClasses={isLoadingClasses}
          isAdmin={isAdmin}
        />
        <DashboardOverview teacherId={teacher.id} isAdmin={isAdmin} />
      </div>
    </DashboardLayout>
  );
};
