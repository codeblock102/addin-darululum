import { Info } from "lucide-react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

export function AttendanceTableHeader() {
  return (
    <CardHeader className="border-b border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center gap-2">
        <CardTitle className="text-purple-700 dark:text-purple-300">
          Student Attendance History
        </CardTitle>
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
      <CardDescription className="text-black">
        View and manage attendance records for all students
      </CardDescription>
    </CardHeader>
  );
}
