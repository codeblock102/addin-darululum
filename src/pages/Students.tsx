import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { StudentDialog } from "@/components/students/StudentDialog.tsx";
import { StudentList } from "@/components/students/StudentList.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  GraduationCap,
  Search,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
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
  const avgAttendance = 85; // Mock data for now

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

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedStudent(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Students
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage and monitor student progress
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAddStudent}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-medium"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Students
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents
                ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                )
                : (
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stats.totalStudents}
                    </div>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-green-500" />
                      {stats.activeStudents} active
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Students
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents
                ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                )
                : (
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stats.activeStudents}
                    </div>
                    <p className="text-xs text-gray-600">
                      {stats.totalStudents > 0
                        ? ((stats.activeStudents / stats.totalStudents) * 100)
                          .toFixed(0)
                        : 0}% of total
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Attendance
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents
                ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                )
                : (
                  <div className="space-y-3">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stats.avgAttendance}%
                    </div>
                    <Progress
                      value={stats.avgAttendance}
                      className="h-2 bg-gray-200"
                    />
                    <p className="text-xs text-gray-600">
                      Last 30 days average
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and List Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Student Directory
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Search and manage all student records
                </p>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search students or guardians..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[280px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <StudentList
              students={filteredStudents}
              isLoading={isLoadingStudents}
              onEdit={handleEditStudent}
            />
          </CardContent>
        </Card>

        <StudentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedStudent={selectedStudent}
          onClose={handleCloseDialog}
        />
      </div>
    </div>
  );
};

export default Students;
