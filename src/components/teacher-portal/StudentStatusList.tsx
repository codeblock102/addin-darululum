
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const StudentStatusList = () => {
  const { data: studentStatuses, isLoading, isError } = useQuery({
    queryKey: ['student-status-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_student_status');
      
      if (error) {
        console.error("Error fetching student statuses:", error);
        throw error;
      }
      
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load student status information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const hasStudentsWithPendingAssignments = studentStatuses.some(
    student => student.pending_assignments > 0 || student.missed_assignments > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Status</CardTitle>
        <CardDescription>
          Students with pending or missed assignments from previous days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasStudentsWithPendingAssignments ? (
          <div className="text-center py-6 text-muted-foreground">
            All students are up to date with their assignments.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Missed</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentStatuses
                .filter(student => student.pending_assignments > 0 || student.missed_assignments > 0)
                .map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{student.student_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {student.learning_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.pending_assignments > 0 ? (
                        <Badge variant="secondary">{student.pending_assignments}</Badge>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                    <TableCell>
                      {student.missed_assignments > 0 ? (
                        <Badge variant="destructive">{student.missed_assignments}</Badge>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {student.pending_details || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
