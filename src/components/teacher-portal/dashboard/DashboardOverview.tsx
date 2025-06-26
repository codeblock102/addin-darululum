import { StudentSearch } from "./StudentSearch.tsx";
import { QuickActions } from "./QuickActions.tsx";
import { TodayStudents } from "./TodayStudents.tsx";
import { RecentActivity } from "./RecentActivity.tsx";

interface DashboardOverviewProps {
  teacherId: string;
  isAdmin?: boolean;
}

export const DashboardOverview = (
  { teacherId, isAdmin }: DashboardOverviewProps,
) => {
  return (
    <div className="space-y-6 px-1">
      {/* Enhanced grid layout for better mobile experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="order-1 lg:order-1">
          <StudentSearch teacherId={teacherId} isAdmin={isAdmin} />
        </div>
        <div className="order-2 lg:order-2">
          <QuickActions teacherId={teacherId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="order-3 lg:order-3">
          <TodayStudents teacherId={teacherId} />
        </div>
        <div className="order-4 lg:order-4">
          <RecentActivity teacherId={teacherId} />
        </div>
      </div>
    </div>
  );
};
