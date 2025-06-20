
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AdminStatsCards = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [studentsResult, teachersResult, progressResult] = await Promise.all([
        supabase.from("students").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "teacher"),
        supabase.from("progress").select("id", { count: "exact" }),
      ]);

      return {
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalProgress: progressResult.count || 0,
      };
    },
  });

  const statsCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Teachers",
      value: stats?.totalTeachers || 0,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Progress Entries",
      value: stats?.totalProgress || 0,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "System Health",
      value: "Good",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="admin-stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl md:text-2xl font-bold admin-stats-value">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
