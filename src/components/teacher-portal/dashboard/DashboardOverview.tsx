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
    <div className="space-y-4 sm:space-y-6 px-1">
      {/* Mobile-first grid layout */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Student Search - Full width on mobile, half on larger screens */}
        <div className="order-1">
          <StudentSearch teacherId={teacherId} isAdmin={isAdmin} />
        </div>
        
        {/* Quick Actions - Full width on mobile, half on larger screens */}
        <div className="order-2">
          <QuickActions teacherId={teacherId} />
        </div>
      </div>

      {/* Second row - Full width on mobile for better mobile experience */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Today's Students - Full width on mobile */}
        <div className="order-3">
          <TodayStudents teacherId={teacherId} />
        </div>
        
        {/* Recent Activity - Full width on mobile */}
        <div className="order-4">
          <RecentActivity teacherId={teacherId} />
        </div>
      </div>
    </div>
  );
};
