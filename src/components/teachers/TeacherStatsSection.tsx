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
          <Card key={index} className="h-32 border border-gray-200 shadow-sm bg-white rounded-xl">
            <CardContent className="p-6">
              <div className="h-full bg-gray-100 rounded-lg"></div>
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
      icon: <School className="h-6 w-6 text-emerald-600" />,
      description: "Registered teaching staff",
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Active Accounts",
      value: stats.activeTeachers || 0,
      icon: <Users className="h-6 w-6 text-emerald-600" />,
      description: "Teachers with active accounts",
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Total Students",
      value: stats.totalStudents || 0,
      icon: <Users className="h-6 w-6 text-emerald-600" />,
      description: "Enrolled students",
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Subject Types",
      value: stats.subjectCount || 0,
      icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
      description: "Unique subject areas",
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <Card key={index} className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200 overflow-hidden rounded-xl">
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
