
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, GraduationCap, Mail, BookOpen } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [teachersResult, studentsResult, messagesResult] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'teacher'),
        supabase.from('students').select('*'),
        supabase.from('communications').select('*')
      ]);

      return {
        teacherCount: teachersResult.data?.length || 0,
        studentCount: studentsResult.data?.length || 0,
        messageCount: messagesResult.data?.length || 0
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <CardTitle className="text-sm font-medium text-amber-400">Messages</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 p-1 flex items-center justify-center">
                <Mail className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.messageCount}</div>
              <p className="text-xs text-gray-400 mt-1">Communications</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-effect overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t border-white/10">
              <div className="px-6 py-4 flex items-center justify-between hover:bg-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">New student registration</h4>
                  <p className="text-xs text-gray-400">A new student has been added to the system</p>
                </div>
                <span className="text-xs text-gray-400">2h ago</span>
              </div>
              <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between hover:bg-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">Attendance updated</h4>
                  <p className="text-xs text-gray-400">Teacher Hassan updated attendance records</p>
                </div>
                <span className="text-xs text-gray-400">5h ago</span>
              </div>
              <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between hover:bg-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">Progress report generated</h4>
                  <p className="text-xs text-gray-400">Monthly progress report is ready for review</p>
                </div>
                <span className="text-xs text-gray-400">1d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
