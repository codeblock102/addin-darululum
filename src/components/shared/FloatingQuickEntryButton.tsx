import { useState } from "react";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useForm } from "react-hook-form";
import { StudentSearch } from "@/components/student-progress/StudentSearch.tsx";
import { DhorBookEntryForm } from "@/components/dhor-book/DhorBookEntryForm.tsx";
import { useDhorEntryMutation } from "@/components/dhor-book/useDhorEntryMutation.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";

export const FloatingQuickEntryButton = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [_selectedStudentName, setSelectedStudentName] = useState<string>("");
  const { session } = useAuth();
  const teacherId = session?.user?.id || "";

  const form = useForm<{ student_id: string }>({
    defaultValues: { student_id: "" },
  });

  const { mutate, isPending } = useDhorEntryMutation({
    studentId: selectedStudentId,
    teacherId,
    onSuccess: () => handleClose(),
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // Reset selection when closing
    setSelectedStudentId("");
    form.reset({ student_id: "" });
  };

  return (
    <>
      <div className={"fixed right-4 z-[60]" + (isMobile ? " bottom-20" : " bottom-6")}>
        <button
          onClick={handleOpen}
          className="relative h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white transition-all hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 border border-emerald-500/40 flex items-center justify-center"
          aria-label="Quick student entry"
          type="button"
        >
          <BookOpen className="h-6 w-6 text-amber-300" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? handleOpen() : handleClose())}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white text-gray-900 border border-emerald-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">Quick Student Entry</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select a student and record a new progress entry.
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Select Student with search */}
          {!selectedStudentId && (
            <div className="space-y-4">
              <StudentSearch
                onStudentSelect={(id, name) => {
                  setSelectedStudentId(id);
                  setSelectedStudentName(name);
                }}
                showHeader={false}
                teacherId={teacherId}
                accent="emerald"
              />
            </div>
          )}

          {/* Step 2: Single entry form with internal tabs (Sabaq / Sabaq Para / Dhor) */}
          {selectedStudentId && (
            <div className="space-y-3">
              <DhorBookEntryForm
                initialTab="sabaq"
                onSubmit={(payload) => mutate(payload)}
                isPending={isPending}
                onCancel={handleClose}
                studentId={selectedStudentId}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};


