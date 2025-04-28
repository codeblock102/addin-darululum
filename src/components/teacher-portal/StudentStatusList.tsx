
import React, { useState } from 'react';
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
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    data: statusData, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['student-status', teacherId],
    queryFn: async () => {
      try {
        // First get students assigned to this teacher
        const { data: students, error: studentsError } = await supabase
          .from('students_teachers')
          .select(`
            id,
            student_id,
            student_name
          `)
          .eq('teacher_id', teacherId)
          .eq('active', true);
        
        if (studentsError) throw studentsError;
        
        if (!students || students.length === 0) {
          return [] as StudentStatus[];
        }
        
        // For each student, get pending assignments
        const studentDataPromises = students.map(async (student) => {
          // Get pending assignments
          const { data: pendingAssignments, error: pendingError } = await supabase
            .from('student_assignments')
            .select('id')
            .eq('student_id', student.student_id)
            .eq('status', 'pending');
            
          if (pendingError) {
            console.error(`Error fetching assignments for ${student.student_name}:`, pendingError);
          }
          
          // Get missed assignments
          const { data: missedAssignments, error: missedError } = await supabase
            .from('student_assignments')
            .select('id')
            .eq('student_id', student.student_id)
            .eq('status', 'missed');
            
          if (missedError) {
            console.error(`Error fetching missed assignments for ${student.student_name}:`, missedError);
          }

          // Get student learning type if available
          const { data: studentDetails, error: detailsError } = await supabase
            .from('students')
            .select('id, name')
            .eq('id', student.student_id)
            .single();
            
          if (detailsError && detailsError.code !== 'PGRST116') { // Not found error
            console.error(`Error fetching details for ${student.student_name}:`, detailsError);
          }
          
          return {
            student_id: student.student_id || student.id,
            student_name: student.student_name,
            learning_type: 'hifz', // Default value
            pending_assignments: pendingAssignments?.length || 0,
            missed_assignments: missedAssignments?.length || 0,
            pending_details: pendingAssignments?.length ? 
              `${pendingAssignments.length} assignments pending` : 
              (missedAssignments?.length ? 
                `${missedAssignments.length} assignments missed` : 
                'Up to date')
          };
        });
        
        return Promise.all(studentDataPromises);
      } catch (error) {
        console.error("Error fetching student status:", error);
        return [] as StudentStatus[];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
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
        <p>No student status information available</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Learning Type</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statusData.map((student) => (
              <TableRow key={student.student_id} className="hover:bg-muted/30">
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
                  {student.pending_details || "Up to date"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
