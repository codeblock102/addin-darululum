
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, BookOpen, GraduationCap, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
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
      // For now, return a static value since attendance tracking isn't implemented yet
      return 92;
    }
  });

  const { data: activeClasses } = useQuery({
    queryKey: ['activeClasses'],
    queryFn: async () => {
      // We'll implement this when classes feature is added
      return 8;
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, Admin</h1>
          <p className="text-gray-500">Here's what's happening with your students today.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 h-96">
            <h2 className="text-xl font-semibold mb-4">Weekly Progress</h2>
            {/* Chart will be added here */}
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 h-96">
            <h2 className="text-xl font-semibold mb-4">Attendance Overview</h2>
            {/* Chart will be added here */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;

