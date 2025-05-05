
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import TeacherDialog from "@/components/teachers/TeacherDialog";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Teacher } from "@/types/teacher";
import { TeacherProfilesTab } from "@/components/teachers/TeacherProfilesTab";
import { TeacherAccountsTab } from "@/components/teachers/TeacherAccountsTab";
import { TeacherStatsSection } from "@/components/teachers/TeacherStatsSection";

const Teachers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profiles");

  // Get teacher stats
  const { data: stats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const { data: teachers } = await supabase.from('teachers').select('*');
      const { data: students } = await supabase.from('students').select('*');
      
      return {
        totalTeachers: teachers?.length || 0,
        totalStudents: students?.length || 0,
        activeTeachers: teachers?.filter(t => t.email).length || 0,
        averageExperience: teachers && teachers.length > 0 
          ? teachers.reduce((acc, teacher) => acc + (parseInt(teacher.experience) || 0), 0) / teachers.length
          : 0,
        subjectCount: teachers 
          ? new Set(teachers.map(t => t.subject)).size
          : 0,
        totalClasses: 0, // Will be populated later
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

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const handleCreateTeacher = () => {
    setSelectedTeacher(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTeacher(null);
  };

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
          title="Teacher Management Center" 
          description="Comprehensive teacher profile and account management" 
        />
        
        {/* Stats Cards */}
        <TeacherStatsSection stats={stats} />
        
        {/* Action Button */}
        <div className="flex justify-end">
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={handleCreateTeacher}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs 
          defaultValue="profiles" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profiles">Teacher Profiles</TabsTrigger>
            <TabsTrigger value="accounts">Account Management</TabsTrigger>
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles">
            <TeacherProfilesTab onEditTeacher={handleEditTeacher} />
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <TeacherAccountsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Teacher Dialog Modal */}
      {dialogOpen && (
        <TeacherDialog 
          selectedTeacher={selectedTeacher} 
          onClose={handleCloseDialog}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </DashboardLayout>
  );
};

export default Teachers;
