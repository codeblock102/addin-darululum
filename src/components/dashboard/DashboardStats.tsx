import { useQuery } from '@tanstack/react-query';
import { StatsCard } from './StatsCard.tsx';
import { Users, Clock, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useUserRole } from '@/hooks/useUserRole.ts';

export const DashboardStats = () => {
  const { isAdmin } = useUserRole();
  
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
    queryFn: () => {
      return 92;
    }
  });

  const { data: activeClasses } = useQuery({
    queryKey: ['activeClasses'],
    queryFn: () => {
      return 8;
    }
  });

  const iconClass = isAdmin ? "text-amber-400" : "text-primary";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Students"
        value={studentsCount?.toString() || "0"}
        icon={<Users className={iconClass} size={24} />}
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Average Attendance"
        value={`${attendanceRate}%`}
        icon={<Clock className={iconClass} size={24} />}
        trend={{ value: 3, isPositive: true }}
      />
      <StatsCard
        title="Completion Rate"
        value={`${progressStats || 0}%`}
        icon={<GraduationCap className={iconClass} size={24} />}
        trend={{ value: 5, isPositive: true }}
      />
      <StatsCard
        title="Active Classes"
        value={activeClasses?.toString() || "0"}
        icon={<BookOpen className={iconClass} size={24} />}
      />
    </div>
  );
};
