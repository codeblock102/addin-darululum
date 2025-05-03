
import { Info } from "lucide-react";
import {
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AttendanceTableHeader() {
  return (
    <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 border-b border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center gap-2">
        <CardTitle className="text-purple-700 dark:text-purple-300">Student Attendance History</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
              <p>Filter and view past attendance records</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <CardDescription className="text-gray-600 dark:text-gray-300">
        View and filter attendance records for individual students
      </CardDescription>
    </CardHeader>
  );
}
