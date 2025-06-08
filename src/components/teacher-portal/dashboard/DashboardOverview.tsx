import { StudentSearch } from "./StudentSearch";
import { QuickActions } from "./QuickActions";
import { TodayStudents } from "./TodayStudents";
import { RecentActivity } from "./RecentActivity";

export const DashboardOverview = ({ teacherId }: { teacherId: string }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentSearch teacherId={teacherId} />
        <QuickActions teacherId={teacherId} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayStudents teacherId={teacherId} />
        <RecentActivity teacherId={teacherId} />
      </div>
    </div>
  );
};
