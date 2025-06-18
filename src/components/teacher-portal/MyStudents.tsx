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
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface MyStudentsProps {
  teacherId: string;
  isAdmin?: boolean;
}

export interface Student {
  id: string;
  name: string;
  enrollment_date: string | null;
  status: "active" | "inactive";
}

export interface StudentAssignment {
  id: string;
  student_name: string;
}

export const MyStudents = ({ teacherId, isAdmin = false }: MyStudentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<
    { id: string; name: string; studentId: string } | null
  >(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteType, setIsDeleteType] = useState<"remove" | "delete">(
    "remove",
  );
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
    queryKey: ["students-for-user", userData, isAdmin],
    queryFn: async () => {
      if (!userData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("id, name, enrollment_date, status")
        .eq("status", "active")
        .eq("madrassah_id", userData.madrassah_id);

      if (!isAdmin && userData.section) {
        query = query.eq("section", userData.section);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }

      return (data as Student[]) || [];
    },
    enabled: !isLoadingUser && !!userData,
  });

  const { data: assignedStudents } = useQuery({
    queryKey: ["teacher-student-assignments", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_teachers")
        .select("id, student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);

      if (error) {
        console.error("Error fetching student assignments:", error);
        return [];
      }

      return data as StudentAssignment[] || [];
    },
    enabled: !!teacherId && !isAdmin,
  });

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Students</CardTitle>
            <CardDescription>
              All active students in the system
            </CardDescription>
          </div>
          <AddStudentDialog teacherId={teacherId} />
        </div>
        <StudentSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
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
                      assignedStudents={assignedStudents}
                      setStudentToDelete={setStudentToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      setIsDeleteType={setIsDeleteType}
                    />
                  )
                  : (
                    <StudentTable
                      students={filteredStudents}
                      assignedStudents={assignedStudents}
                      setStudentToDelete={setStudentToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      setIsDeleteType={setIsDeleteType}
                    />
                  )
              )
              : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No students found matching your search."
                    : "No active students found in the system."}
                </div>
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
    </Card>
  );
};
