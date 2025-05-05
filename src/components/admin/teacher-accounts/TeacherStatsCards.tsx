
import { Card, CardContent } from "@/components/ui/card";
import { School, User, Clock, Activity } from "lucide-react";
import { TeacherAccount } from "@/types/teacher";

interface TeacherStatsCardsProps {
  teachers: TeacherAccount[] | undefined;
}

export function TeacherStatsCards({ teachers = [] }: TeacherStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold">{teachers?.length || 0}</p>
            </div>
            <User className="h-8 w-8 text-primary/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Teachers</p>
              <p className="text-2xl font-bold">
                {teachers?.filter(t => t.status === 'active').length || 0}
              </p>
            </div>
            <School className="h-8 w-8 text-green-500/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">
                {teachers?.reduce((sum, t) => sum + t.classesCount, 0) || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-primary/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">
                {teachers?.reduce((sum, t) => sum + t.studentsCount, 0) || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-500/70" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
