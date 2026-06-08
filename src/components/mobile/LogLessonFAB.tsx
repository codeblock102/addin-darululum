import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { useForm } from "react-hook-form";
import { StudentSearch } from "@/components/student-progress/StudentSearch.tsx";
import { DhorBookEntryForm } from "@/components/dhor-book/DhorBookEntryForm.tsx";
import { useDhorEntryMutation } from "@/components/dhor-book/useDhorEntryMutation.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { cn } from "@/lib/utils.ts";

/**
 * LogLessonFAB
 * ────────────
 * Mobile-only (sm:hidden) floating action button that drops a teacher
 * straight into a "log lesson" flow (student picker + DhorBookEntryForm).
 * Sits above the centre slot of <BottomTabBar />.
 *
 * - sm:hidden — desktop continues to use the in-page entry buttons.
 * - 56px circular target (well over the 44px minimum).
 * - honors prefers-reduced-motion (skips hover/press transitions).
 * - Only renders for teachers; admins/parents see nothing.
 */

export const LogLessonFAB = () => {
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const { session } = useAuth();
  const { isTeacher } = useRBAC();
  const teacherId = session?.user?.id || "";

  const form = useForm<{ student_id: string }>({
    defaultValues: { student_id: "" },
  });

  const { mutate, isPending } = useDhorEntryMutation({
    studentId: selectedStudentId,
    teacherId,
    onSuccess: () => handleClose(),
  });

  const handleClose = () => {
    setOpen(false);
    setSelectedStudentId("");
    form.reset({ student_id: "" });
  };

  if (!isTeacher) return null;

  return (
    <>
      {/* Positioned in the centre, lifted above the 64px bar + safe area. */}
      <div
        className={cn(
          "sm:hidden",
          "fixed left-1/2 -translate-x-1/2 z-50",
          // bar height (h-16 = 64px) + safe area; tweak with calc for clarity.
          "bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Log lesson"
          className={cn(
            // 56px target — comfortably above 44px minimum.
            "h-14 w-14 rounded-full",
            "bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white",
            "shadow-xl border border-emerald-500/40",
            "flex items-center justify-center",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
            // Only animate when the user is OK with motion.
            "motion-safe:transition-transform motion-safe:active:scale-95 motion-safe:hover:shadow-2xl",
          )}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white text-gray-900 border border-emerald-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">Log Lesson</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select a student and record a new progress entry.
            </DialogDescription>
          </DialogHeader>

          {!selectedStudentId && (
            <div className="space-y-4">
              <StudentSearch
                onStudentSelect={(id) => setSelectedStudentId(id)}
                showHeader={false}
                teacherId={teacherId}
                accent="emerald"
              />
            </div>
          )}

          {selectedStudentId && (
            <div className="space-y-3">
              <DhorBookEntryForm
                key={selectedStudentId}
                initialTab="sabaq"
                onSubmit={(payload) => mutate(payload)}
                isPending={isPending}
                onCancel={handleClose}
                studentId={selectedStudentId}
                isOpen={open}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LogLessonFAB;
