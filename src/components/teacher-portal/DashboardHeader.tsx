
import { Teacher } from "@/types/teacher";
import { BookOpen, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  teacher: Teacher;
}

export const DashboardHeader = ({ teacher }: DashboardHeaderProps) => {
  return (
    <div className="relative mb-6">
      {/* Background gradient for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl -z-10"></div>
      
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
            <span className="text-purple-600/80 dark:text-purple-400/80">
              {teacher.experience} years experience
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="bg-white dark:bg-purple-900/40 border-purple-200 dark:border-purple-700">
            <Bell className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </Button>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700 rounded-lg">
            <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-700 dark:text-purple-300">
              Quran Academy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
