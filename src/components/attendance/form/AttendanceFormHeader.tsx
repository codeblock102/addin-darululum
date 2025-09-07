import { CalendarCheck } from "lucide-react";
import { format } from "date-fns";
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
import { useI18n } from "@/contexts/I18nContext.tsx";

export function AttendanceFormHeader() {
  const { t } = useI18n();
  const today = new Date();

  return (
    <CardHeader className="border-b border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-purple-700 dark:text-purple-300">
            {t("pages.attendance.recordTitle", "Mark Attendance")}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CalendarCheck className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                <p>{t("pages.attendance.recordTooltip", "Record today's attendance")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <CardDescription className="text-black">
        {t("pages.attendance.recordDesc", "Record attendance for selected students with custom timing and reasons")}
      </CardDescription>
    </CardHeader>
  );
}
