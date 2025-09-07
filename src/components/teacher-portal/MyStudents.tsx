import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { LoadingSpinner } from "./students/LoadingSpinner.tsx";
import { StudentSearchBar } from "./students/StudentSearchBar.tsx";
import { StudentTable } from "./students/StudentTable.tsx";
import { StudentMobileList } from "./students/StudentMobileList.tsx";
import { StudentDeleteDialog } from "./students/StudentDeleteDialog.tsx";
import { AddStudentDialog } from "./students/AddStudentDialog.tsx";
import { StudentDialog } from "@/components/students/StudentDialog.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface MyStudentsProps {
  teacherId: string;
  isAdmin?: boolean;
}

export interface Student {
  id: string;
  name: string;
  enrollment_date: string | null;
  status: "active" | "inactive";
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  madrassah_id?: string;
  section?: string;
  medical_condition: string | null;
}

export interface StudentAssignment {
  id: string;
  student_name: string;
}

export const MyStudents = ({ teacherId, isAdmin = false }: MyStudentsProps) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<
    { id: string; name: string; studentId: string } | null
  >(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteType, setIsDeleteType] = useState<"remove" | "delete">(
    "remove",
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["profileData", teacherId, isAdmin],
    queryFn: async () => {
      if (!teacherId) return null;
      
      let query = supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId);
      
      if (!isAdmin) {
        query = query.eq("role", "teacher");
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
      return data;
    },
    enabled: !!teacherId,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["students-for-user", teacherId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        if (!userData?.madrassah_id) return [];
        const { data, error } = await supabase
          .from("students")
          .select(
            "id, name, enrollment_date, status, date_of_birth, guardian_name, guardian_contact, madrassah_id, section, medical_condition",
          )
          .eq("status", "active")
          .eq("madrassah_id", userData.madrassah_id);
        if (error) {
          console.error("Error fetching students for admin:", error);
          return [];
        }
        return (data as Student[]) || [];
      } else {
        const { data: teacherClasses, error: classesError } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", `{${teacherId}}`);

        if (classesError) {
          console.error("Error fetching teacher classes:", classesError);
          return [];
        }

        const studentIds = (teacherClasses || [])
          .flatMap((c) => c.current_students || [])
          .filter((id, index, self) => id && self.indexOf(id) === index);

        if (studentIds.length === 0) return [];

        const { data, error } = await supabase
          .from("students")
          .select(
            "id, name, enrollment_date, status, date_of_birth, guardian_name, guardian_contact, madrassah_id, section, medical_condition",
          )
          .in("id", studentIds);

        if (error) {
          console.error("Error fetching students for teacher:", error);
          return [];
        }

        return (data as Student[]) || [];
      }
    },
    enabled: !isLoadingUser && !!teacherId,
  });

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditStudent = (student: Student) => {
    // Transform student to match StudentDialog interface
    const transformedStudent = {
      ...student,
      date_of_birth: student.date_of_birth || null,
      guardian_name: student.guardian_name || null,
      guardian_contact: student.guardian_contact || null,
      medical_condition: student.medical_condition || null,
    };
    setSelectedStudent(transformedStudent);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setSelectedStudent(null);
    setIsEditDialogOpen(false);
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{t("pages.teacherPortal.students.title", "Students")}</CardTitle>
            <CardDescription>{t("pages.teacherPortal.students.subtitle", "All active students in the system")}</CardDescription>
          </div>
          <AddStudentDialog teacherId={teacherId} />
        </div>
        <StudentSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        {filteredStudents && filteredStudents.length > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border rounded-md">
            💡 {t("pages.teacherPortal.students.hint", "Click on any student row/card to edit their details")}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {isLoading ? <LoadingSpinner /> : (
          <>
            {filteredStudents && filteredStudents.length > 0
              ? (
                isMobile
                  ? (
                    <StudentMobileList
                      students={filteredStudents}
                      setStudentToDelete={setStudentToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      setIsDeleteType={setIsDeleteType}
                      onEditStudent={handleEditStudent}
                    />
                  )
                  : (
                    <StudentTable
                      students={filteredStudents}
                      setStudentToDelete={setStudentToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      setIsDeleteType={setIsDeleteType}
                      onEditStudent={handleEditStudent}
                    />
                  )
              )
              : (
                <div className="text-center py-8 text-muted-foreground">{searchQuery ? t("pages.teacherPortal.students.noneSearch", "No students found matching your search.") : t("pages.teacherPortal.students.none", "No active students found in the system.")}</div>
              )}
          </>
        )}
      </CardContent>

      <StudentDeleteDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        studentToDelete={studentToDelete}
        isDeleteType={isDeleteType}
      />

      <StudentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseEditDialog}
        madrassahId={userData?.madrassah_id}
        isTeacher
      />
    </Card>
  );
};
