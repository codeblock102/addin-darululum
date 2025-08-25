import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { BookOpen, Calendar, School, Users } from "lucide-react";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="h-32 border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="h-full bg-gray-200 rounded-lg"></div>
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
      icon: <School className="h-6 w-6 text-[hsl(142.8,64.2%,24.1%)]" />,
      description: "Registered teaching staff",
      color: "bg-[hsl(142.8,64.2%,24.1%)]/10",
      borderColor: "border-[hsl(142.8,64.2%,24.1%)]/20",
    },
    {
      title: "Active Accounts",
      value: stats.activeTeachers || 0,
      icon: <Users className="h-6 w-6 text-green-600" />,
      description: "Teachers with active accounts",
      color: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Total Students",
      value: stats.totalStudents || 0,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      description: "Enrolled students",
      color: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Subject Types",
      value: stats.subjectCount || 0,
      icon: <BookOpen className="h-6 w-6 text-purple-600" />,
      description: "Unique subject areas",
      color: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} ${stat.borderColor} border`}>
                {stat.icon}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
