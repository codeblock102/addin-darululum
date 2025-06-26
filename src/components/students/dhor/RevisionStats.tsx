import { Card, CardContent } from "@/components/ui/card";

export interface RevisionStatsProps {
  totalRevisions: number;
  excellentRevisions: number;
  goodRevisions: number;
  averageRevisions: number;
  needsWorkRevisions: number;
  horribleRevisions: number;
}

export const RevisionStats = ({
  totalRevisions,
  excellentRevisions,
  goodRevisions,
  averageRevisions,
  needsWorkRevisions,
  horribleRevisions,
}: RevisionStatsProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revision Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold">{totalRevisions}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-100 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-green-700">
              {excellentRevisions}
            </div>
            <div className="text-sm text-green-700">Excellent</div>
          </div>
          <div className="bg-blue-100 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-blue-700">
              {goodRevisions}
            </div>
            <div className="text-sm text-blue-700">Good</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {averageRevisions}
            </div>
            <div className="text-sm text-yellow-700">Average</div>
          </div>
          <div className="bg-orange-100 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-orange-700">
              {needsWorkRevisions}
            </div>
            <div className="text-sm text-orange-700">Needs Work</div>
          </div>
          <div className="bg-red-100 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-red-700">
              {horribleRevisions}
            </div>
            <div className="text-sm text-red-700">Incomplete</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
