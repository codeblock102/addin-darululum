
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";

interface TodayStudentsProps {
  teacherId: string;
}

export const TodayStudents = ({ teacherId }: TodayStudentsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Students
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No classes scheduled for today</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
