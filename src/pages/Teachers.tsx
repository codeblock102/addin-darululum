import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import TeacherDialog from "@/components/teachers/TeacherDialog";
import { TeacherList } from "@/components/teachers/TeacherList";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SearchInput } from "@/components/table/SearchInput";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Database, School, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Teacher } from "@/types/teacher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Teachers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Get teacher stats
  const { data: stats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const { data: teachers } = await supabase.from('teachers').select('*');
      const { data: students } = await supabase.from('students').select('*');
      
      return {
        totalTeachers: teachers?.length || 0,
        totalStudents: students?.length || 0,
        averageExperience: teachers && teachers.length > 0 
          ? teachers.reduce((acc, teacher) => acc + (parseInt(teacher.experience) || 0), 0) / teachers.length
          : 0,
        subjectCount: teachers 
          ? new Set(teachers.map(t => t.subject)).size
          : 0
      };
    }
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Unable to verify your session. Please try logging in again.",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader 
          title="Teacher Management" 
          description="Manage teaching staff and their accounts" 
        />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <School className="mr-2 h-4 w-4 text-amber-400" />
                Total Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalTeachers || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4 text-amber-400" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="mr-2 h-4 w-4 text-amber-400" />
                Subject Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.subjectCount || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <School className="mr-2 h-4 w-4 text-amber-400" />
                Avg. Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.averageExperience.toFixed(1) || 0} years</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Teaching Staff</h2>
            <Dialog onOpenChange={() => setSelectedTeacher(null)}>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                  <UserPlus className="mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <TeacherDialog selectedTeacher={selectedTeacher} />
            </Dialog>
          </div>
          
          <div className="bg-[#202736] rounded-lg border border-gray-700 shadow-lg">
            <div className="p-4">
              <SearchInput
                placeholder="Search teachers by name or subject..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="border-gray-700 bg-[#1A1F2C]"
              />
            </div>
            <TeacherList 
              searchQuery={searchQuery}
              onEdit={setSelectedTeacher}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
