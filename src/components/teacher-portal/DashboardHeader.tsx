import { Teacher } from "@/types/teacher";
import { BookOpen } from "lucide-react";

interface DashboardHeaderProps {
  teacher: Teacher;
}

export const DashboardHeader = ({ teacher }: DashboardHeaderProps) => {
  return (
    <div className="relative mb-6">
      {/* Background gradient for visual interest */}
      <div className="absolute inset-0 rounded-xl -z-10"></div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl border border-purple-100 dark:border-purple-800/30 shadow-sm">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold tracking-tight text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-2">
            <span className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </span>
            Welcome, {teacher.name}
          </h1>
          <p className="text-muted-foreground">
            <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm mr-2">
              {teacher.subject}
            </span>
           
          </p>
        </div>
        
      </div>
    </div>
  );
};
