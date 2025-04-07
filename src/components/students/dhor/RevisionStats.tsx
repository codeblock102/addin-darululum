
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface RevisionStatsProps {
  totalRevisions: number;
  completedRevisions: number;
  needsImprovementRevisions: number;
  completionRate: number;
}

export const RevisionStats = ({ 
  totalRevisions,
  completedRevisions,
  needsImprovementRevisions,
  completionRate
}: RevisionStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalRevisions}</div>
          <p className="text-xs text-gray-500 mt-1">Total Revisions</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{completedRevisions}</div>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">{needsImprovementRevisions}</div>
          <p className="text-xs text-gray-500 mt-1">Needs Improvement</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Completion Rate</span>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-1">{completionRate}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        The percentage of revisions rated as excellent or good
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
