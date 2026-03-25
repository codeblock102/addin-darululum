import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { StudentSearch } from "./StudentSearch";
import { QuickActions } from "./QuickActions";
import { TodayStudents } from "./TodayStudents";
import { RecentActivity } from "./RecentActivity";
import { useTeacherStudentMetrics } from "@/hooks/useTeacherStudentMetrics.ts";

interface DashboardOverviewProps {
  teacherId?: string;
  isAdmin?: boolean;
}

export const DashboardOverview = ({ teacherId, isAdmin = false }: DashboardOverviewProps) => {
  const navigate = useNavigate();
  const { data } = useTeacherStudentMetrics(teacherId && !isAdmin ? teacherId : "");

  const atRiskCount = data?.atRiskCount ?? 0;
  const stagnantCount = data?.stagnantCount ?? 0;

  return (
    <div className="space-y-6">
      {/* At-risk alert banner */}
      {(atRiskCount > 0 || stagnantCount > 0) && (
        <button
          type="button"
          onClick={() => navigate("/dashboard?tab=performance")}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {atRiskCount > 0
                  ? `${atRiskCount} student${atRiskCount > 1 ? "s" : ""} need${atRiskCount === 1 ? "s" : ""} immediate attention`
                  : `${stagnantCount} student${stagnantCount > 1 ? "s" : ""} ${stagnantCount === 1 ? "has" : "have"} stalled`}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {atRiskCount > 0 && stagnantCount > 0
                  ? `${atRiskCount} at-risk · ${stagnantCount} stagnant — click to view Performance tab`
                  : atRiskCount > 0
                  ? "Low attendance or no recent progress — click to view Performance tab"
                  : "No progress logged in 7+ days — click to view Performance tab"}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Main content grid - mobile first */}
      <div className="grid grid-cols-1 gap-6">
        <StudentSearch teacherId={teacherId} isAdmin={isAdmin} />
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
