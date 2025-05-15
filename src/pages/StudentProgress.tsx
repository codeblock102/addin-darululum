import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { StudentSearch } from "@/components/student-progress/StudentSearch";
import { ProgressOverview } from "@/components/student-progress/ProgressOverview";
import { ProgressCharts } from "@/components/student-progress/ProgressCharts";
import { AttendanceStats } from "@/components/student-progress/AttendanceStats";
import { ExportOptions } from "@/components/student-progress/ExportOptions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, School2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Progress } from "@/types/progress";

interface ProgressChartsProps {
  progressData: Progress[];
  sabaqParaData: Tables<"sabaq_para">[];
  juzRevisionsData: Tables<"juz_revisions">[];
}

interface ExportOptionsProps {
  studentId: string;
  studentName: string;
  progressData: Progress[];
  attendanceData: Tables<"attendance">[];
  sabaqParaData: Tables<"sabaq_para">[];
  juzRevisionsData: Tables<"juz_revisions">[];
  toast: any;
}

const StudentProgressPage = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const { toast } = useToast();

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ["student-details", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", selectedStudentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<Progress[]>({
    queryKey: ["student-progress-data", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data as Progress[] || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery<Tables<"attendance">[]>({
    queryKey: ["student-attendance", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: sabaqParaData, isLoading: sabaqParaLoading } = useQuery<Tables<"sabaq_para">[]>({
    queryKey: ["student-sabaq-para-data", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      
      const { data, error } = await supabase
        .from("sabaq_para")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("revision_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: juzRevisionsData, isLoading: juzRevisionsLoading } = useQuery<Tables<"juz_revisions">[]>({
    queryKey: ["student-juz-revisions-data", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      
      const { data, error } = await supabase
        .from("juz_revisions")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("revision_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const isLoading = studentLoading || progressLoading || attendanceLoading || sabaqParaLoading || juzRevisionsLoading;

  const handleStudentSelect = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Student Progress Tracker</h1>
            <p className="text-gray-500 dark:text-gray-400">Comprehensive view of student performance and progress</p>
          </div>
        </div>

        <StudentSearch onStudentSelect={handleStudentSelect} />
        
        {selectedStudentId ? (
          isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <ProgressOverview 
                studentName={selectedStudentName} 
                progressData={progressData || []}
                sabaqParaData={sabaqParaData || []}
                juzRevisionsData={juzRevisionsData || []}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProgressCharts 
                    progressData={progressData || []} 
                    sabaqParaData={sabaqParaData || []}
                    juzRevisionsData={juzRevisionsData || []}
                  />
                </div>
                <div>
                  <AttendanceStats attendanceData={attendanceData || []} />
                </div>
              </div>
              
              <ExportOptions 
                studentId={selectedStudentId} 
                studentName={selectedStudentName}
                progressData={progressData || []}
                attendanceData={attendanceData || []}
                sabaqParaData={sabaqParaData || []}
                juzRevisionsData={juzRevisionsData || []}
                toast={toast}
              />
            </div>
          )
        ) : (
          <Card className="p-12 text-center border-dashed bg-muted/40">
            <div className="flex flex-col items-center gap-3">
              <School2 className="h-12 w-12 text-muted-foreground/60" />
              <h3 className="text-xl font-medium">No Student Selected</h3>
              <p className="text-muted-foreground max-w-md">
                Search and select a student above to view their progress details, attendance history, and more.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProgressPage;
