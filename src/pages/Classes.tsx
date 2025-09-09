import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { ClassDialog } from "@/components/classes/ClassDialog.tsx";
import { ClassTable } from "@/components/classes/components/ClassTable.tsx";
import { EnrollmentDialog } from "@/components/classes/components/EnrollmentDialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogTrigger } from "@/components/ui/dialog.tsx";
import { SearchInput } from "@/components/table/SearchInput.tsx";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader.tsx";
import { ClassFormData } from "@/components/classes/validation/classFormSchema.ts";
import { withoutLovId } from "@/lib/stripLovId.tsx";
import { DeleteClassDialog } from "@/components/classes/components/DeleteClassDialog.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

// Wrap the Dialog component with our HOC to strip out data-lov-id
const SafeDialog = withoutLovId(Dialog);

const fetchClasses = async () => {
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      subject,
      section,
      capacity,
      teacher_ids,
      days_of_week,
      time_slots,
      current_students
    `
    )
    .order("name", { ascending: true });

  if (classesError) throw classesError;
  if (!classes) return [];

  const teacherIds = [...new Set(classes.flatMap((c) => c.teacher_ids || []))];

  if (teacherIds.length === 0) {
    return classes.map((c) => ({
      ...c,
      teachers: [],
      studentCount: c.current_students?.length || 0,
    }));
  }

  const { data: teachers, error: teachersError } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", teacherIds);

  if (teachersError) throw teachersError;

  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  return classes.map((c) => ({
    ...c,
    teachers:
      c.teacher_ids?.map((id: string) => ({
        id,
        name: teacherMap.get(id) || "Unknown",
      })) || [],
    studentCount: c.current_students?.length || 0,
  }));
};

export default function Classes() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<
    (Partial<ClassFormData> & { id: string; teacher_ids?: string[], time_slots?: { start_time?: string; end_time?: string }[], current_students?: string[] }) | null
  >(null);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: classes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const handleOpenClassDialog = (
    classItem?: Partial<ClassFormData> & {
      id: string;
      teachers?: { id: string; name: string }[];
      days_of_week?: string[];
      time_slots?: { start_time?: string; end_time?: string }[],
      current_students?: string[]
    }
  ) => {
    setSelectedClass(
      classItem
        ? {
            ...classItem,
            teacher_ids: classItem.teachers?.map((t: { id: string }) => t.id),
            time_slots: classItem.time_slots,
          }
        : null
    );
    setIsClassDialogOpen(true);
  };

  const handleCloseClassDialog = () => {
    setSelectedClass(null);
    setIsClassDialogOpen(false);
  };

  const handleOpenEnrollmentDialog = (
    classItem: Partial<ClassFormData> & { id: string }
  ) => {
    setSelectedClass(classItem);
    setIsEnrollmentDialogOpen(true);
  };

  const _handleCloseEnrollmentDialog = () => {
    setSelectedClass(null);
    setIsEnrollmentDialogOpen(false);
  };

  const handleOpenDeleteDialog = (
    classItem: Partial<ClassFormData> & { id: string }
  ) => {
    setSelectedClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const _handleCloseDeleteDialog = () => {
    setSelectedClass(null);
    setIsDeleteDialogOpen(false);
  };

  const filteredClasses = classes?.filter((c) => {
    const query = searchQuery.toLowerCase();
    const teacherNames = c.teachers.map((t) => t.name.toLowerCase()).join(" ");
    return (
      c.name.toLowerCase().includes(query) ||
      (c.subject && c.subject.toLowerCase().includes(query)) ||
      (c.section && c.section.toLowerCase().includes(query)) ||
      teacherNames.includes(query)
    );
  });

  return (
    <div className="space-y-6 px-4 sm:px-6">
        <AdminHeader
          title={t("pages.classes.headerTitle")}
          description={t("pages.classes.headerDesc")}
        />

        <SafeDialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
          <div className="flex justify-end mb-4">
            <DialogTrigger asChild>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base"
                onClick={() => handleOpenClassDialog()}
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t("pages.classes.addClass")}
              </Button>
            </DialogTrigger>
          </div>
          {isClassDialogOpen && (
            <ClassDialog
              selectedClass={selectedClass}
              onClose={handleCloseClassDialog}
            />
          )}
        </SafeDialog>

        {selectedClass && (
          <EnrollmentDialog
            classId={selectedClass.id}
            open={isEnrollmentDialogOpen}
            onOpenChange={setIsEnrollmentDialogOpen}
          />
        )}

        {selectedClass && (
          <DeleteClassDialog
            classId={selectedClass.id}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          />
        )}

        <div className="glass-effect rounded-lg shadow-lg overflow-hidden">
          <SearchInput
            placeholder={t("pages.classes.searchPlaceholder")}
            value={searchQuery}
            onChange={setSearchQuery}
            className="border-gray-700/30 bg-white/5 p-3 sm:p-4"
          />
          {isLoading && <p className="p-4">{t("pages.classes.loading")}</p>}
          {isError && (
            <p className="p-4 text-red-500">{t("pages.classes.errorPrefix")}{(error as Error).message}</p>
          )}
          {!isLoading && !isError && (
            <ClassTable
              classes={filteredClasses || []}
              onEdit={handleOpenClassDialog}
              onEnroll={handleOpenEnrollmentDialog}
              onDelete={handleOpenDeleteDialog}
            />
          )}
        </div>
      </div>
  );
}
