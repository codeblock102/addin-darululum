
import { Teacher } from "@/types/teacher";
import { BookOpen } from "lucide-react";

interface DashboardHeaderProps {
  teacher: Teacher;
}

export const DashboardHeader = ({ teacher }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-500">
          Welcome, {teacher.name}
        </h1>
        <p className="text-muted-foreground">
          {teacher.subject} • {teacher.experience} years experience
        </p>
      </div>
      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
        <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium text-emerald-700 dark:text-emerald-300">
          Quran Academy
        </span>
      </div>
    </div>
  );
};
