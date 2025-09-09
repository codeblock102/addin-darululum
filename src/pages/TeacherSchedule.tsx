import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { ScheduleCalendar } from "@/components/teacher-portal/schedule/ScheduleCalendar.tsx";
import { AdminHeader } from "@/components/admin/AdminHeader.tsx";
import { Loader2 } from "lucide-react";

const TeacherSchedule = () => {
  const { session } = useAuth();
  const teacherId = session?.user?.id || "";
  const {
    data: classes,
    isLoading,
    error,
  } = useTeacherClasses(teacherId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col h-full">
      <AdminHeader
        title="My Schedule"
        description="View your daily class schedule."
      />
      <div className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-red-500">
            Error loading schedule: {error.message}
          </div>
        ) : (
          <ScheduleCalendar classes={classes || []} teacherId={teacherId} />
        )}
      </div>
    </div>
  );
};

export default TeacherSchedule; 