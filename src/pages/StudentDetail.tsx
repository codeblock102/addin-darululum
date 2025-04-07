
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, UserRound, BookMarked, RefreshCw } from "lucide-react";
import { StudentProgressChart } from "@/components/students/StudentProgressChart";
import { StudentProgressList } from "@/components/students/StudentProgressList";
import { Skeleton } from "@/components/ui/skeleton";
import { NewProgressEntry } from "@/components/students/NewProgressEntry";
import { useToast } from "@/hooks/use-toast";
import { DhorBook } from "@/components/students/dhor/DhorBook";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: student, isLoading: studentLoading, error: studentError } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      if (!id) throw new Error("Student ID is required");
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    enabled: !!id
  });

  const { data: progressEntries, isLoading: progressLoading } = useQuery({
    queryKey: ['student-progress', id],
    queryFn: async () => {
      if (!id) throw new Error("Student ID is required");
      
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (studentError) {
      toast({
        title: "Error",
        description: "Failed to load student details. Please try again.",
        variant: "destructive",
      });
      navigate("/students");
    }
  }, [studentError, navigate, toast]);

  if (studentLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/students")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
          <p className="text-gray-500 mb-8">The student you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/students")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{student.name}</h1>
              <p className="text-gray-500">Student Details and Progress</p>
            </div>
          </div>
          <NewProgressEntry 
            studentId={student.id} 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen}
            studentName={student.name}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">Date of Birth</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">Enrollment Date</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">Guardian</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {student.guardian_name || 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">Guardian Contact</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {student.guardian_contact || 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">Status</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[100px] w-full" />
                </div>
              ) : (
                <StudentProgressChart progress={progressEntries || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="progress">Progress History</TabsTrigger>
            <TabsTrigger value="revisions">
              <RefreshCw className="w-4 h-4 mr-2" />
              Revision Book (Dhor)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="progress">
            {progressLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <StudentProgressList progress={progressEntries || []} />
            )}
          </TabsContent>
          <TabsContent value="revisions">
            <DhorBook studentId={student.id} studentName={student.name} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentDetail;
