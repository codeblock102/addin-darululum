import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Users, School, BookOpen, Calendar } from "lucide-react";

interface TeacherStatsProps {
  stats: {
    totalTeachers?: number;
    totalStudents?: number;
    subjectCount?: number;
    activeTeachers?: number;
    totalClasses?: number;
  } | undefined;
}

export function TeacherStatsSection({ stats }: TeacherStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="h-28">
            <CardContent className="p-6">
              <div className="h-full bg-slate-200 rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Teachers",
      value: stats.totalTeachers || 0,
      icon: <School className="h-4 w-4 text-amber-400" />,
      description: "Registered teaching staff"
    },
    {
      title: "Active Accounts",
      value: stats.activeTeachers || 0,
      icon: <Users className="h-4 w-4 text-green-500" />,
      description: "Teachers with active accounts"
    },
    {
      title: "Total Students",
      value: stats.totalStudents || 0,
      icon: <Users className="h-4 w-4 text-blue-500" />,
      description: "Enrolled students"
    },
    {
      title: "Subject Types",
      value: stats.subjectCount || 0,
      icon: <BookOpen className="h-4 w-4 text-purple-500" />,
      description: "Unique subject areas"
    },
    {
      title: "Teaching Classes",
      value: stats.totalClasses || 0,
      icon: <Calendar className="h-4 w-4 text-orange-500" />,
      description: "Active teaching classes"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="stats-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              {stat.icon}
              <span className="ml-2">{stat.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
