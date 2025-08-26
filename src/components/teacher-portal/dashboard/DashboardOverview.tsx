import { StudentSearch } from "./StudentSearch";
import { QuickActions } from "./QuickActions";
import { TodayStudents } from "./TodayStudents";
import { RecentActivity } from "./RecentActivity";

interface DashboardOverviewProps {
  teacherId?: string;
  isAdmin?: boolean;
}

export const DashboardOverview = ({ teacherId, isAdmin = false }: DashboardOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Main content grid - mobile first */}
      <div className="grid grid-cols-1 gap-6">
        {/* Student Search - Full width on mobile */}
        <StudentSearch teacherId={teacherId} isAdmin={isAdmin} />

        {/* Quick Actions - Full width on mobile */}
        <QuickActions teacherId={teacherId} isAdmin={isAdmin} />
      </div>

      {/* Bottom section - Today's Students & Recent Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TodayStudents teacherId={teacherId} isAdmin={isAdmin} />
        <RecentActivity teacherId={teacherId} isAdmin={isAdmin} />
      </div>
    </div>
  );
};
