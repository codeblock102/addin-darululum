
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TeacherMessagesEnhancedProps {
  teacherId: string;
  teacherName: string;
}

export const TeacherMessagesEnhanced = ({
  teacherId,
  teacherName,
}: TeacherMessagesEnhancedProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with other teachers and administrators
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            <p>Messaging functionality is currently unavailable.</p>
            <p className="text-sm mt-2">The communications table has been removed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
