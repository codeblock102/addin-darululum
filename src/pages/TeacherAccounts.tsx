
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TeacherAccountsTable } from "@/components/admin/teacher-accounts/TeacherAccountsTable";
import { TeacherAccountSearch } from "@/components/admin/teacher-accounts/TeacherAccountSearch";
import { TeacherAccountFilters } from "@/components/admin/teacher-accounts/TeacherAccountFilters";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, School, User, Clock, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeacherAccount } from "@/types/teacher";

export default function TeacherAccounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "7days" | "30days" | "inactive">("all");
  const { isAdmin, isLoading } = useUserRole();

  // Fetch teacher accounts with their activity data
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teacher-accounts'],
    queryFn: async () => {
      const { data: teachersData, error } = await supabase
        .from('teachers')
        .select(`
          id, 
          name, 
          email, 
          subject,
          experience,
          bio,
          phone,
          created_at
        `);
        
      if (error) {
        console.error("Error fetching teacher accounts:", error);
        toast({
          title: "Error loading teachers",
          description: "Failed to load teacher accounts data",
          variant: "destructive"
        });
        throw error;
      }
      
      // For each teacher, fetch their user account data
      const teacherAccounts: TeacherAccount[] = [];
      
      if (teachersData) {
        for (const teacher of teachersData) {
          // Get user data by email
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', teacher.email)
            .single();
            
          // Get classes assigned to this teacher
          const { data: classesData } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacher.id);
            
          // Get student assignments for this teacher
          const { data: studentsData } = await supabase
            .from('students_teachers')
            .select('id')
            .eq('teacher_id', teacher.id)
            .eq('active', true);
            
          teacherAccounts.push({
            ...teacher,
            userId: userData?.id || null,
            status: userData?.role === 'teacher' ? 'active' : 'suspended',
            lastLogin: userData?.created_at || null,
            classesCount: classesData?.length || 0,
            studentsCount: studentsData?.length || 0,
          });
        }
      }
      
      return teacherAccounts;
    },
    enabled: !isLoading && isAdmin
  });

  // Check if admin and redirect if not
  if (!isLoading && !isAdmin) {
    toast({
      title: "Access Denied",
      description: "Only administrators can access this page",
      variant: "destructive"
    });
    navigate("/");
    return null;
  }

  // Apply filters to teachers data
  const filteredTeachers = teachers?.filter(teacher => {
    // Apply search query filter
    const matchesSearch = searchQuery === "" || 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && teacher.status === "active") ||
      (statusFilter === "suspended" && teacher.status === "suspended");
    
    // Apply activity filter (mock implementation since we don't have real login history)
    let matchesActivity = true;
    if (activityFilter === "7days") {
      // Mock implementation: consider teachers with classes as recently active
      matchesActivity = teacher.classesCount > 0;
    } else if (activityFilter === "30days") {
      // All teachers considered active in last 30 days for this demo
      matchesActivity = true;
    } else if (activityFilter === "inactive") {
      // Mock implementation: teachers with no classes considered inactive
      matchesActivity = teacher.classesCount === 0;
    }
    
    return matchesSearch && matchesStatus && matchesActivity;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader 
          title="Teacher Account Control Center" 
          description="Manage and monitor all teacher accounts in the system" 
        />
        
        {(isLoading || isLoadingTeachers) ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="stats-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Accounts</p>
                      <p className="text-2xl font-bold">{teachers?.length || 0}</p>
                    </div>
                    <User className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="stats-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Teachers</p>
                      <p className="text-2xl font-bold">
                        {teachers?.filter(t => t.status === 'active').length || 0}
                      </p>
                    </div>
                    <School className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="stats-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                      <p className="text-2xl font-bold">
                        {teachers?.reduce((sum, t) => sum + t.classesCount, 0) || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="stats-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">
                        {teachers?.reduce((sum, t) => sum + t.studentsCount, 0) || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500/70" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-2/3">
                <TeacherAccountSearch 
                  searchQuery={searchQuery} 
                  onSearchChange={setSearchQuery} 
                />
              </div>
              <div className="w-full md:w-1/3">
                <TeacherAccountFilters
                  statusFilter={statusFilter}
                  activityFilter={activityFilter}
                  onStatusFilterChange={setStatusFilter}
                  onActivityFilterChange={setActivityFilter}
                />
              </div>
            </div>
            
            {/* Teacher Accounts Table */}
            <TeacherAccountsTable teachers={filteredTeachers} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
