import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, BookOpen, GraduationCap, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        
        setIsTeacher(data && data.length > 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  useEffect(() => {
    if (isTeacher === true && !isLoading) {
      navigate('/teacher-portal');
    }
  }, [isTeacher, isLoading, navigate]);
  
  const { data: studentsCount } = useQuery({
    queryKey: ['studentsCount'],
    queryFn: async () => {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: progressStats } = useQuery({
    queryKey: ['progressStats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('progress')
        .select('memorization_quality')
        .not('memorization_quality', 'is', null);
      
      const excellentOrGood = data?.filter(p => 
        p.memorization_quality === 'excellent' || p.memorization_quality === 'good'
      ).length || 0;
      
      const total = data?.length || 0;
      const completionRate = total ? Math.round((excellentOrGood / total) * 100) : 0;
      
      return completionRate;
    }
  });

  const { data: attendanceRate } = useQuery({
    queryKey: ['attendanceRate'],
    queryFn: async () => {
      return 92;
    }
  });

  const { data: activeClasses } = useQuery({
    queryKey: ['activeClasses'],
    queryFn: async () => {
      return 8;
    }
  });
  
  const { data: recentActivity } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select('id, date, students(name), verses_memorized, memorization_quality')
        .order('date', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (isTeacher) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Redirecting to teacher portal...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, Admin</h1>
          <p className="text-muted-foreground">Here's what's happening with your students today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value={studentsCount?.toString() || "0"}
            icon={<Users className="text-primary" size={24} />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Average Attendance"
            value={`${attendanceRate}%`}
            icon={<Clock className="text-primary" size={24} />}
            trend={{ value: 3, isPositive: true }}
          />
          <StatsCard
            title="Completion Rate"
            value={`${progressStats || 0}%`}
            icon={<GraduationCap className="text-primary" size={24} />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Active Classes"
            value={activeClasses?.toString() || "0"}
            icon={<BookOpen className="text-primary" size={24} />}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="h-auto lg:h-96">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity ? (
                      recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div>
                            <p className="font-medium">{activity.students?.name || 'Unknown Student'}</p>
                            <p className="text-sm text-muted-foreground">
                              Memorized {activity.verses_memorized} verses
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{new Date(activity.date).toLocaleDateString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              activity.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                              activity.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.memorization_quality || 'not rated'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No recent activity to display</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="h-auto lg:h-96">
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Upcoming classes will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Progress data visualization will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Attendance chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
