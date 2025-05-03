
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, AlertTriangle, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularProgressIndicator } from "./CircularProgressIndicator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TeacherPerformanceProps {
  teacherId: string;
}

interface PerformanceStats {
  totalStudents: number;
  studentsWithProgress: number;
  attendanceRecorded: number;
  progressCoverage: number;
}

export const TeacherPerformance = ({ teacherId }: TeacherPerformanceProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["teacher-performance", teacherId],
    queryFn: async () => {
      // Get assigned students count
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("assigned_teacher", teacherId);
        
      if (studentsError) throw studentsError;
      
      // Get recent progress records (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Create an array to store student IDs that have progress
      const studentsWithProgressIds: string[] = [];
      
      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        
        // Get progress records
        const { data: progressRecords, error: progressError } = await supabase
          .from("progress")
          .select("student_id")
          .in("student_id", studentIds)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false });
          
        if (progressError) throw progressError;
        
        // Add unique student IDs with progress to the array
        if (progressRecords) {
          progressRecords.forEach(record => {
            if (!studentsWithProgressIds.includes(record.student_id)) {
              studentsWithProgressIds.push(record.student_id);
            }
          });
        }
        
        // Get attendance records
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from("attendance")
          .select("id")
          .eq("created_by", teacherId)
          .gte("created_at", sevenDaysAgo.toISOString());
          
        if (attendanceError) throw attendanceError;
        
        // Calculate stats
        return {
          totalStudents: students.length,
          studentsWithProgress: studentsWithProgressIds.length,
          attendanceRecorded: attendanceRecords ? attendanceRecords.length : 0,
          progressCoverage: students.length > 0 
            ? Math.round((studentsWithProgressIds.length / students.length) * 100) 
            : 0
        };
      }
      
      return {
        totalStudents: 0,
        studentsWithProgress: 0,
        attendanceRecorded: 0,
        progressCoverage: 0
      };
    },
  });

  const getStatusIndicator = (value: number, total: number) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    if (percentage >= 70) {
      return {
        icon: <Check className="h-4 w-4 text-green-500" />,
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      };
    } else if (percentage >= 40) {
      return {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        color: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      };
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-purple-200 dark:border-purple-800/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-purple-700 dark:text-purple-300">Your Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-pulse w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const studentProgress = getStatusIndicator(stats.studentsWithProgress, stats.totalStudents);
  
  return (
    <Card className="border border-purple-200 dark:border-purple-800/40">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-purple-700 dark:text-purple-300">Your Performance</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-gray-800 p-2 shadow-lg rounded">
                <p className="text-sm">Your teaching performance statistics for the last 7 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.progressCoverage}%
              </p>
              <div className={`px-2 py-1 rounded text-xs font-medium flex items-center ${studentProgress.color}`}>
                {studentProgress.icon}
                <span className="ml-1">
                  {stats.studentsWithProgress}/{stats.totalStudents} Students
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Student Progress Coverage
            </p>
          </div>
          
          <CircularProgressIndicator 
            value={stats.progressCoverage} 
            size={64}
          />
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.totalStudents}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {stats.attendanceRecorded}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/30" asChild>
          <a href="/progress">
            View Progress Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
