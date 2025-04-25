
import { Card } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { ChartBarIcon } from "lucide-react";

interface ProgressStatsProps {
  totalStudents: number;
  onTrackCount: number;
  needsReviewCount: number;
  overallProgress: number;
}

export function ChartBarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="4" height="10" x="2" y="10" rx="1" />
      <rect width="4" height="18" x="10" y="2" rx="1" />
      <rect width="4" height="14" x="18" y="6" rx="1" />
    </svg>
  );
}

export const ProgressStats = ({ 
  totalStudents, 
  onTrackCount, 
  needsReviewCount, 
  overallProgress 
}: ProgressStatsProps) => {
  const { isAdmin } = useUserRole();
  
  const cardClass = isAdmin ? 'glass-effect' : 'bg-white border shadow-sm';
  const titleClass = isAdmin ? 'text-amber-400 font-medium' : 'text-gray-700 font-semibold';
  const valueClass = isAdmin ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-primary';
  const descriptionClass = isAdmin ? 'text-sm text-gray-400' : 'text-sm text-gray-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className={`p-6 ${cardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={titleClass}>Overall Progress</h3>
          <div className={isAdmin ? 'bg-amber-500/10 p-1.5 rounded-full' : ''}>
            <ChartBarIcon className={isAdmin ? 'h-5 w-5 text-amber-500' : 'h-5 w-5 text-primary'} />
          </div>
        </div>
        <div className={valueClass}>{overallProgress}%</div>
        <p className={descriptionClass}>Average completion rate</p>
      </Card>
      
      <Card className={`p-6 ${cardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={titleClass}>Students On Track</h3>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${isAdmin ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
            {onTrackCount}/{totalStudents}
          </div>
        </div>
        <div className={valueClass}>{onTrackCount}</div>
        <p className={descriptionClass}>Out of {totalStudents} students</p>
      </Card>
      
      <Card className={`p-6 ${cardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={titleClass}>Needs Review</h3>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
            Attention
          </div>
        </div>
        <div className={valueClass}>{needsReviewCount}</div>
        <p className={descriptionClass}>Students requiring attention</p>
      </Card>
    </div>
  );
};
