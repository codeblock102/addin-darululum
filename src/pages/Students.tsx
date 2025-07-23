import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { StudentDialog } from "@/components/students/StudentDialog.tsx";
import { StudentList } from "@/components/students/StudentList.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { PlusCircle, Search, Users, Activity, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

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
  medical_condition?: string | null;
}

const StatCard = ({ title, value, icon, description, isLoading, isAdmin }: any) => (
  <Card>
    <CardHeader
      className={`flex flex-row items-center justify-between space-y-0 ${
        isAdmin ? "border-b border-primary/30 pb-4" : "pb-2"
      }`}
    >
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent className="pt-4">
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);

const Students = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["students", userId],
    queryFn: async () => {
      if (!userId) return { students: [], userData: null };

      const { data: userData } = await supabase
        .from("profiles")
        .select("madrassah_id, role")
        .eq("id", userId)
        .single();

      if (!userData?.madrassah_id) {
        return { students: [], userData };
      }

      if (userData.role === "admin") {
        const { data: students, error } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, status, madrassah_id, section, medical_condition",
          )
          .eq("madrassah_id", userData.madrassah_id);

        if (error) throw error;
        return { students: students || [], userData };
      }

      if (userData.role === "teacher") {
        const { data: teacherClasses, error: classesError } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", `{${userId}}`);

        if (classesError) throw classesError;
        
        const studentIds = (teacherClasses || [])
          .flatMap(c => c.current_students || [])
          .filter((id, index, self) => id && self.indexOf(id) === index);

        if (studentIds.length === 0) {
          return { students: [], userData };
        }

        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, status, madrassah_id, section, medical_condition",
          )
          .in("id", studentIds);
        
        if (studentsError) throw studentsError;
        return { students: students || [], userData };
      }

      return { students: [], userData };
    },
    enabled: !!userId,
  });

  const isAdmin = data?.userData?.role === "admin";
  const students = data?.students || [];
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "active").length;
  const inactiveStudents = totalStudents - activeStudents;

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    queryClient.invalidateQueries({ queryKey: ["students", userId] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and view their details.
          </p>
        </div>
        <Button onClick={handleAddStudent} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={totalStudents}
          description={`${activeStudents} active`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
          isAdmin={isAdmin}
        />
        <StatCard
          title="Active"
          value={activeStudents}
          description={`${((activeStudents / totalStudents) * 100 || 0).toFixed(0)}% of students`}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
          isAdmin={isAdmin}
        />
        <StatCard
          title="Inactive"
          value={inactiveStudents}
          description={`${((inactiveStudents / totalStudents) * 100 || 0).toFixed(0)}% of students`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
          isAdmin={isAdmin}
        />
      </div>

      <Card>
        <CardHeader
          className={isAdmin ? "border-b border-primary/30" : ""}
        >
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            A list of all students in the system.
          </CardDescription>
          <div className="relative pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          <StudentList
            students={filteredStudents}
            isLoading={isLoading}
            onEditStudent={handleEditStudent}
          />
        </CardContent>
      </Card>

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseDialog}
        madrassahId={data?.userData?.madrassah_id}
      />
    </div>
  );
};

export default Students;
