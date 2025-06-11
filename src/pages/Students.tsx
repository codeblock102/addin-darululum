/**
 * @file Students.tsx
 * @description This file defines the `Students` page component, which is responsible for displaying and managing a list of students.
 * It features functionality to search for students, view summary statistics (like total students, active students, and average attendance),
 * add new students, and edit existing student details through a dialog interface.
 * The component utilizes other custom components like `StudentDialog` for adding/editing students and `StudentList` for displaying them.
 * State management for search queries, selected student for editing, and dialog visibility is handled within this component.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { StudentDialog } from "@/components/students/StudentDialog.tsx";
import { StudentList } from "@/components/students/StudentList.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Search, UserPlus, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive";
  madrassah_id?: string;
  section?: string;
}

/**
 * @function Students
 * @description The main component for the students management page.
 * It handles the display of student statistics, a search input for filtering students,
 * a list of students, and a dialog for adding or editing student information.
 * @returns {JSX.Element} The rendered students page.
 */
const Students = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { session } = useAuth();
  const { isAdmin } = useRBAC();
  const userId = session?.user?.id;

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["userData", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
      return data;
    },
    enabled: !!userId,
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["students", { isAdmin, userData }],
    queryFn: async () => {
      if (!userData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("*")
        .eq("madrassah_id", userData.madrassah_id);

      // If the user is a teacher, also filter by section.
      if (!isAdmin && userData.section) {
        query = query.eq("section", userData.section);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !isLoadingUser && !!userData,
  });

  const totalStudents = students?.length || 0;
  const activeStudents =
    students?.filter((s) => s.status === "active").length || 0;
  const avgAttendance = 0;

  const stats = {
    totalStudents,
    activeStudents,
    avgAttendance,
  };

  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name &&
        student.guardian_name.toLowerCase().includes(
          searchQuery.toLowerCase(),
        )),
  );

  /**
   * @function handleEditStudent
   * @description Sets the selected student and opens the dialog for editing.
   * @param {Student} student - The student object to be edited.
   * @input student - The student data to populate the edit dialog.
   * @output Opens the student editing dialog pre-filled with the selected student's information.
   * @returns {void}
   */
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  /**
   * @function handleAddStudent
   * @description Clears any selected student and opens the dialog for adding a new student.
   * @input None.
   * @output Opens the student dialog in "add new" mode.
   * @returns {void}
   */
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };

  /**
   * @function handleCloseDialog
   * @description Clears the selected student and closes the student dialog.
   * @input None.
   * @output Closes the student dialog and resets the selected student state.
   * @returns {void}
   */
  const handleCloseDialog = () => {
    setSelectedStudent(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="text-muted-foreground">
              Manage and monitor student progress
            </p>
          </div>
          <Button onClick={handleAddStudent} className="gap-2">
            <UserPlus className="h-5 w-5" />
            Add Student
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 dark:bg-purple-900/20">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              {isLoadingStudents
                ? <Skeleton className="h-8 w-1/2 mt-1" />
                : (
                  <div className="text-2xl font-bold">
                    {stats.totalStudents}
                  </div>
                )}
              {isLoadingStudents
                ? <Skeleton className="h-4 w-3/4 mt-1" />
                : (
                  <p className="text-xs text-muted-foreground">
                    {stats.activeStudents} active students
                  </p>
                )}
              {isLoadingStudents
                ? (
                  <>
                    <Skeleton className="h-4 w-full mt-3" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </>
                )
                : (
                  <>
                    <Progress value={stats.avgAttendance} className="mt-3" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {stats.avgAttendance}% average attendance
                    </p>
                  </>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-muted/20 dark:bg-muted/10 shadow-sm rounded-lg">
        <div className="p-4 border-b">
          <div className="relative flex max-w-sm items-center">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students by name or guardian..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery((e.target as HTMLInputElement).value)}
              className="pl-9"
            />
          </div>
        </div>
        <StudentList
          students={filteredStudents}
          isLoading={isLoadingStudents}
          onEdit={handleEditStudent}
        />
      </div>

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseDialog}
      />
    </div>
  );
};

export default Students;
