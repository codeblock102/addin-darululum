
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Loader2 } from "lucide-react";

interface StudentStatusListProps {
  teacherId: string;
}

// Define a type for student status data
interface StudentStatus {
  student_id: string;
  student_name: string;
  learning_type?: string;
  pending_assignments: number;
  missed_assignments: number;
  pending_details?: string;
}

export const StudentStatusList: React.FC<StudentStatusListProps> = ({ teacherId }) => {
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['student-status', teacherId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_student_status');
          
        if (error) throw error;
        return (data || []) as StudentStatus[];
      } catch (error) {
        console.error("Error fetching student status:", error);
        return [] as StudentStatus[];
      }
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!statusData || statusData.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        No student status information available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Learning Type</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>Pending</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statusData.map((student) => (
            <TableRow key={student.student_id}>
              <TableCell className="font-medium">{student.student_name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {student.learning_type || 'hifz'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {student.pending_assignments > 0 ? (
                  <AlertCircle className="h-5 w-5 text-amber-500 mx-auto" />
                ) : student.missed_assignments > 0 ? (
                  <Clock className="h-5 w-5 text-red-500 mx-auto" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                )}
              </TableCell>
              <TableCell className="max-w-[180px] truncate" title={student.pending_details || ""}>
                {student.pending_assignments > 0 
                  ? `${student.pending_assignments} assignments pending` 
                  : student.missed_assignments > 0
                    ? `${student.missed_assignments} assignments missed`
                    : "Up to date"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
