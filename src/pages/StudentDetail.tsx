/**
 * @file StudentDetail.tsx
 * @description This file defines the `StudentDetail` component, which displays detailed information about a specific student.
 * It fetches student data and their progress entries from a Supabase backend.
 * The component includes sections for student information, progress overview (chart and list), and a Dhor (memorization) book.
 * It allows users to navigate back to the students list and add new progress entries for the student.
 * The component handles loading and error states, displaying appropriate messages to the user.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { ArrowLeft, BookOpen, UserRound, BookMarked, RefreshCw } from "lucide-react";
import { StudentProgressChart } from "@/components/students/StudentProgressChart.tsx";
import { StudentProgressList } from "@/components/students/StudentProgressList.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { NewProgressEntry } from "@/components/students/NewProgressEntry.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { DhorBook } from "@/components/dhor-book/DhorBook.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

/**
 * @function StudentDetail
 * @description The main component for displaying a student's details and progress.
 * It fetches student data and progress entries based on the student ID from the URL parameters.
 * It uses Tanstack Query for data fetching and caching.
 * It displays student information, a progress chart, a progress list, and a Dhor book.
 * It also provides functionality to add new progress entries.
 * @returns {JSX.Element} The rendered student detail page.
 */
const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { session } = useAuth();

  const { data: student, isLoading: studentLoading, error: studentError } = useQuery({
    queryKey: ['student', id],
    /**
     * @function queryFn (for student data)
     * @description Fetches the details of a specific student from the Supabase 'students' table.
     * @async
     * @throws {Error} If the student ID is not provided or if there is an error fetching the data.
     * @returns {Promise<Student>} A promise that resolves to the student object.
     */
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
    /**
     * @function queryFn (for progress entries)
     * @description Fetches the progress entries for a specific student from the Supabase 'progress' table.
     * The entries are ordered by date in descending order.
     * @async
     * @throws {Error} If the student ID is not provided or if there is an error fetching the data.
     * @returns {Promise<any[]>} A promise that resolves to an array of progress entries.
     */
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

  /**
   * @section Loading State
   * @description Displays a skeleton loader while student data is being fetched.
   */
  if (studentLoading) {
    return (
      
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
      
    );
  }

  /**
   * @section Not Found State
   * @description Displays a "Student Not Found" message if the student data is not available.
   */
  if (!student) {
    return (
      
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
          <p className="text-gray-500 mb-8">The student you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
          </Button>
        </div>
      
    );
  }

  /**
   * @section Main Content
   * @description Renders the main content of the student detail page, including student information,
   * progress overview, and Dhor book, once the student data is loaded.
   */
  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/students")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{student.name}</h1>
              <p className="text-muted-foreground">Student Details and Progress</p>
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
              <dl className="divide-y divide-border">
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-foreground">Date of Birth</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
                    {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-foreground">Enrollment Date</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
                    {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-foreground">Guardian</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
                    {student.guardian_name || 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-foreground">Guardian Contact</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
                    {student.guardian_contact || 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-foreground">Status</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
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

        <Tabs defaultValue="dhor-book" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="dhor-book">
              <BookOpen className="w-4 h-4 mr-2" />
              Dhor Book
            </TabsTrigger>
            <TabsTrigger value="revisions">
              <RefreshCw className="w-4 h-4 mr-2" />
              Revision History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dhor-book">
            <DhorBook studentId={student.id} />
          </TabsContent>
          <TabsContent value="revisions">
            {student && (
              <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground">Revision history will be displayed here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
   
  );
};

export default StudentDetail;
