import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { ScheduleCalendar } from "@/components/teacher-portal/schedule/ScheduleCalendar.tsx";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";

const TeacherSchedule = () => {
  const { session } = useAuth();
  const { t } = useI18n();
  const {
    data: classes,
    isLoading,
    error,
  } = useTeacherClasses(session?.user?.id || "");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("pages.teacherPortal.schedule.title", "My Schedule")}</h1>
        <p className="text-gray-600">{t("pages.teacherPortal.schedule.subtitle", "View your daily class schedule.")}</p>
      </div>
      <div className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-red-500">{t("pages.teacherPortal.schedule.errorPrefix", "Error loading schedule:")} {error.message}</div>
        ) : (
          <ScheduleCalendar classes={classes || []} />
        )}
      </div>
    </div>
  );
};

export default TeacherSchedule;
