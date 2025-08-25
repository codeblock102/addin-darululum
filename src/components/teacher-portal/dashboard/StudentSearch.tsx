import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button as _Button } from "@/components/ui/button.tsx";
import { Loader2, Search, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog as _AddStudentDialog } from "../students/AddStudentDialog.tsx";

interface StudentSearchProps {
  teacherId: string;
  isAdmin?: boolean;
}

export const StudentSearch = (
  { teacherId, isAdmin = false }: StudentSearchProps,
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<
    { id: string; name: string }[]
  >([]);

  const navigate = useNavigate();

  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["teacherDataForDashboardSearch", teacherId, isAdmin],
    queryFn: async (): Promise<{ madrassah_id: string; section?: string } | null> => {
      if (!teacherId) return null;
      let query = supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId);

      if (!isAdmin) {
        query = query.eq("role", "teacher");
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(
          "Error fetching user data for dashboard search:",
          error,
        );
        return null;
      }
      return data;
    },
    enabled: !!teacherId,
    retry: 1,
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["all-students-for-search", teacherData, isAdmin],
    queryFn: async (): Promise<{ id: string; name: string }[]> => {
      if (!teacherData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("id, name")
        .eq("status", "active")
        .eq("madrassah_id", teacherData.madrassah_id);

      if (!isAdmin && teacherData.section) {
        query = query.eq("section", teacherData.section);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherData,
    retry: 1,
  });

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents([]);
    } else if (students) {
      const filtered = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleStudentClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  const isLoading = isLoadingTeacher || isLoadingStudents;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Student Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading students...</span>
          </div>
        )}
        
        {searchQuery && !isLoading && (
          <div className="space-y-2">
            {filteredStudents.length > 0
              ? (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted"
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <UserRound className="h-4 w-4" />
                    <span>{student.name}</span>
                  </div>
                ))
              )
              : (
                <div className="text-sm text-muted-foreground p-2">
                  No students found for "{searchQuery}"
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
