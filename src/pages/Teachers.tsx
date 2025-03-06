
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherDialog } from "@/components/teachers/TeacherDialog";
import { TeacherList } from "@/components/teachers/TeacherList";
import { UserList } from "@/components/admin/user/UserList";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SearchInput } from "@/components/admin/SearchInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Teacher } from "@/types/teacher";

interface User {
  id: string;
  email: string;
  username: string;
  teacherId: string | null;
  createdAt: string;
}

const Teachers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("teachers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Fetch teachers for dropdown in user dialog
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name');
        
      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      
      return data;
    }
  });

  // Fetch users with teacher assignments
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data: userData, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error("Error fetching users:", error);
        return [];
      }
      
      return userData.users.map(user => {
        const metadata = user.user_metadata || {};
        return {
          id: user.id,
          email: user.email || '',
          username: metadata.username || '',
          teacherId: metadata.teacher_id || null,
          createdAt: user.created_at,
        };
      });
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader 
          title="Administration" 
          description="Manage teaching staff and user accounts" 
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="users">User Accounts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teachers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Teaching Staff</h2>
              <Dialog onOpenChange={() => setSelectedTeacher(null)}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
                <TeacherDialog selectedTeacher={selectedTeacher} />
              </Dialog>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <SearchInput
                placeholder="Search teachers by name or subject..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <TeacherList 
                searchQuery={searchQuery}
                onEdit={setSelectedTeacher}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <UserList 
              users={users}
              searchQuery={searchQuery}
              teachers={teachers}
              refetchUsers={refetchUsers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
