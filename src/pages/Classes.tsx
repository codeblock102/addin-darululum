import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { ClassDialog } from "@/components/classes/ClassDialog.tsx";
import { ClassTable } from "@/components/classes/components/ClassTable.tsx";
import { EnrollmentDialog } from "@/components/classes/components/EnrollmentDialog.tsx";
import { Dialog } from "@/components/ui/dialog.tsx";
import { SearchInput } from "@/components/table/SearchInput.tsx";
import { Plus } from "lucide-react";
import { ClassFormData } from "@/components/classes/validation/classFormSchema.ts";
import { DeleteClassDialog } from "@/components/classes/components/DeleteClassDialog.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { Button } from "@/components/ui/button.tsx";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { LottiePlayer } from "@/components/ui/lottie-player.tsx";
import { PageGuide } from "@/components/ui/page-guide.tsx";
import emptyClasses from "@/assets/lottie/empty-classes.json";


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

  const handleOpenDeleteDialog = (
    classItem: Partial<ClassFormData> & { id: string }
  ) => {
    setSelectedClass(classItem);
    setIsDeleteDialogOpen(true);
  };

const filteredClasses = classes?.filter((c) => {
    const query = searchQuery.toLowerCase();
    const teacherNames = c.teachers.map((teacher: { name: string }) => teacher.name.toLowerCase()).join(" ");
    return (
      c.name.toLowerCase().includes(query) ||
      (c.subject && c.subject.toLowerCase().includes(query)) ||
      (c.section && c.section.toLowerCase().includes(query)) ||
      teacherNames.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <PageHeader
        title={t("pages.classes.headerTitle")}
        description={t("pages.classes.headerDesc")}
        actions={
          <Button onClick={() => { handleOpenClassDialog(); setIsClassDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("pages.classes.addClass")}
          </Button>
        }
      />
      <PageGuide
        id="classes:intro"
        title="All classes, teachers, and capacity"
        body="Search any class by name or teacher. Tap a class to view enrolled students."
      />
      <div className="space-y-6 p-4 lg:p-8">
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        {isClassDialogOpen && (
          <ClassDialog selectedClass={selectedClass} onClose={handleCloseClassDialog} />
        )}
      </Dialog>

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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SearchInput
            placeholder={t("pages.classes.searchPlaceholder")}
            value={searchQuery}
            onChange={setSearchQuery}
            className="bg-gray-50 border-gray-200 rounded-xl"
          />
        </div>
        {isLoading && <p className="p-6 text-gray-500 text-sm">{t("pages.classes.loading")}</p>}
        {isError && <p className="p-6 text-red-500 text-sm">{t("pages.classes.errorPrefix")}{(error as Error).message}</p>}
        {!isLoading && !isError && (filteredClasses && filteredClasses.length > 0 ? (
          <ClassTable
            classes={filteredClasses}
            onEdit={handleOpenClassDialog}
            onEnroll={handleOpenEnrollmentDialog}
            onDelete={handleOpenDeleteDialog}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <LottiePlayer src={emptyClasses} className="w-48 h-48" />
            <p className="mt-4 text-gray-500 text-sm">No classes found</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
