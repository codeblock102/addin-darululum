
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, GraduationCap, Mail, BookOpen } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [teachersResult, studentsResult, classesResult, attendanceResult] = await Promise.all([
        supabase.from('teachers').select('id'),
        supabase.from('students').select('id'),
        supabase.from('classes').select('id'),
        supabase.from('attendance').select('id')
      ]);

      return {
        teacherCount: teachersResult.data?.length || 0,
        studentCount: studentsResult.data?.length || 0,
        classCount: classesResult.data?.length || 0,
        attendanceCount: attendanceResult.data?.length || 0
      };
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Admin Dashboard</h1>
          <p className="text-gray-300">Manage teachers, students, and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-400">Total Teachers</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 p-1 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.teacherCount}</div>
              <p className="text-xs text-gray-400 mt-1">Active teaching personnel</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-400">Total Students</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 p-1 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.studentCount}</div>
              <p className="text-xs text-gray-400 mt-1">Enrolled learners</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-400">Total Classes</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 p-1 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.classCount}</div>
              <p className="text-xs text-gray-400 mt-1">Active teaching sessions</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-400">Attendance</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 p-1 flex items-center justify-center">
                <Mail className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.attendanceCount}</div>
              <p className="text-xs text-gray-400 mt-1">Total attendance records</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
