import { Fragment, useState } from "react";
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
      time_slots
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
  }));
};

export default function Classes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<
    (Partial<ClassFormData> & { id: string; teacher_ids?: string[] }) | null
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

  const handleCloseEnrollmentDialog = () => {
    setSelectedClass(null);
    setIsEnrollmentDialogOpen(false);
  };

  const handleOpenDeleteDialog = (
    classItem: Partial<ClassFormData> & { id: string }
  ) => {
    setSelectedClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedClass(null);
    setIsDeleteDialogOpen(false);
  };

  const filteredClasses = classes?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Fragment>
      <div className="space-y-6">
        <AdminHeader
          title="Class Management"
          description="Create and manage class schedules and assignments"
        />

        <SafeDialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
          <div className="flex justify-end mb-4">
            <DialogTrigger asChild>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black"
                onClick={() => handleOpenClassDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Class
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
            placeholder="Search classes by name, teacher, or room..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="border-gray-700/30 bg-white/5"
          />
          {isLoading && <p className="p-4">Loading classes...</p>}
          {isError && (
            <p className="p-4 text-red-500">
              Error loading classes: {error.message}
            </p>
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
    </Fragment>
  );
}
