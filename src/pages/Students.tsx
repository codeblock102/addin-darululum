
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
  Filter,
  Download,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["studentsPageData", userId],
    queryFn: async () => {
      if (!userId) return { students: [], userData: null };

      // 1. Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("madrassah_id, section, role")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        throw userError;
      }

      if (!userData?.madrassah_id) {
        console.log("No madrassah_id found for this user.");
        return { students: [], userData };
      }

      let query;

      // 2. Build the query based on the user's role
      if (userData.role === 'admin') {
        console.log(`User is an ADMIN. Fetching all students for madrassah: ${userData.madrassah_id}`);
        query = supabase
          .from("students")
          .select("*")
          .eq("madrassah_id", userData.madrassah_id);
      } else if (userData.role === 'teacher' && userData.section) {
        console.log(`User is a TEACHER. Fetching students for madrassah ${userData.madrassah_id}, section: ${userData.section}`);
        query = supabase
          .from("students")
          .select("*")
          .eq("madrassah_id", userData.madrassah_id)
          .eq("section", userData.section);
      } else {
        console.log(`User role is '${userData.role}'. No permissions to fetch students or missing data.`);
        return { students: [], userData };
      }

      // 3. Execute the query
      const { data: students, error: studentsError } = await query;

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw studentsError;
      }
      
      console.log(`Successfully fetched ${students?.length || 0} students.`);
      return { students: students || [], userData };
    },
    enabled: !!userId,
  });

  const students = data?.students || [];
  const userData = data?.userData;

  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter((s) => s.status === "active").length || 0;
  const inactiveStudents = students?.filter((s) => s.status === "inactive").length || 0;
  const avgAttendance = 85; // Mock data for now

  // Get unique sections for filter - fix the type issues
  const sections: string[] = students
    ?.map(s => s.section)
    .filter((section): section is string => typeof section === 'string' && section.length > 0)
    .filter((section, index, arr) => arr.indexOf(section) === index) || [];

  const filteredStudents = students?.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name && student.guardian_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesSection = sectionFilter === "all" || student.section === sectionFilter;
    
    return matchesSearch && matchesStatus && matchesSection;
  });

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
    <div className="min-h-screen admin-theme p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-black" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-100">
                  Student Management
                </h1>
                <p className="text-gray-400 text-sm lg:text-base">
                  Comprehensive student administration and monitoring
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 admin-btn-secondary"
                  size="lg"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="admin-theme">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleAddStudent}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-black shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-medium"
              size="lg"
            >
              <UserPlus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Students
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16 bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-100">
                    {totalStudents}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    +12% from last month
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Active Students
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16 bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-100">
                    {activeStudents}
                  </div>
                  <p className="text-xs text-gray-400">
                    {totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(0) : 0}% of total
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Inactive Students
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16 bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-100">
                    {inactiveStudents}
                  </div>
                  <p className="text-xs text-gray-400">
                    Require attention
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Average Attendance
                </CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingStudents ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-16 bg-white/10" />
                  <Skeleton className="h-2 w-full bg-white/10" />
                  <Skeleton className="h-4 w-20 bg-white/10" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-100">
                    {avgAttendance}%
                  </div>
                  <Progress
                    value={avgAttendance}
                    className="h-2 bg-white/10"
                  />
                  <p className="text-xs text-gray-400">
                    Last 30 days average
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Section */}
        <Card className="admin-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  Student Directory
                  <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-300 border-amber-500/30">
                    {filteredStudents?.length || 0} students
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Advanced student management and monitoring
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search students or guardians..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-[280px] bg-white/5 border-white/10 focus:border-amber-500/50 focus:ring-amber-500/30 text-gray-200 placeholder:text-gray-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border-white/10 text-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="admin-theme">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {sections.length > 0 && (
                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border-white/10 text-gray-200">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent className="admin-theme">
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section || "General"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
