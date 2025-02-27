
import { Card } from "@/components/ui/card";

interface ProgressStatsProps {
  totalStudents: number;
  onTrackCount: number;
  needsReviewCount: number;
  overallProgress: number;
}

export const ProgressStats = ({ 
  totalStudents, 
  onTrackCount, 
  needsReviewCount, 
  overallProgress 
}: ProgressStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Overall Progress</h3>
        <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
        <p className="text-sm text-gray-500 mt-1">Average completion rate</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Students On Track</h3>
        <div className="text-3xl font-bold text-green-600">{onTrackCount}</div>
        <p className="text-sm text-gray-500 mt-1">Out of {totalStudents} students</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Needs Review</h3>
        <div className="text-3xl font-bold text-yellow-600">{needsReviewCount}</div>
        <p className="text-sm text-gray-500 mt-1">Students requiring attention</p>
      </Card>
    </div>
  );
};
