import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TeacherPerformanceProps {
  teacherId: string;
}

export const TeacherPerformance = ({ teacherId }: TeacherPerformanceProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Classes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
