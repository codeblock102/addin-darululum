
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StudentDialog } from "@/components/students/StudentDialog";
import { StudentList } from "@/components/students/StudentList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

const Students = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Example stats - in a real app these would come from your data source
  const stats = {
    totalStudents: 150,
    activeStudents: 142,
    avgAttendance: 95,
  };

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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Students</h1>
              <p className="text-muted-foreground">Manage and monitor student progress</p>
            </div>
            <Button onClick={handleAddStudent} className="gap-2">
              <UserPlus className="h-5 w-5" />
              Add Student
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeStudents} active students
                </p>
                <Progress value={stats.avgAttendance} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats.avgAttendance}% average attendance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
          <div className="p-4 border-b border-white/10">
            <div className="relative flex max-w-sm items-center">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students by name or guardian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <StudentList 
            searchQuery={searchQuery}
            onEdit={handleEditStudent}
          />
        </div>
      </div>

      <StudentDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseDialog}
      />
    </DashboardLayout>
  );
};

export default Students;
