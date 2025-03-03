
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherDialog } from "@/components/teachers/TeacherDialog";
import { TeacherList } from "@/components/teachers/TeacherList";
import { UserDialog } from "@/components/admin/UserDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, UserPlus, UserCog, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

// Teacher type definition
interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  email?: string;
  bio?: string;
  phone?: string;
}

// User type definition
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

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

  const handleUserDialogSuccess = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
    refetchUsers();
  };

  const openUserDialog = (user: User | null = null) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Administration</h1>
            <p className="text-gray-500">Manage teaching staff and user accounts</p>
          </div>
        </div>

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
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search teachers by name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <TeacherList 
                searchQuery={searchQuery}
                onEdit={setSelectedTeacher}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">User Accounts</h2>
              <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openUserDialog()}>
                    <UserCog className="mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <UserDialog 
                  selectedUser={selectedUser} 
                  teachers={teachers} 
                  onSuccess={handleUserDialogSuccess}
                />
              </Dialog>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users by email or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No users found matching your search criteria.
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{user.username || 'No username'}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.teacherId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Teacher Account
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUserDialog(user)}
                      >
                        Edit
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
