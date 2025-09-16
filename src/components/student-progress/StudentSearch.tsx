import React from "react";
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
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AlertCircle, Loader2, Search } from "lucide-react";

interface StudentSearchProps {
  onStudentSelect: (studentId: string, studentName: string) => void;
  selectedStudentId?: string | null;
  teacherId?: string;
  showHeader?: boolean;
  showAllStudents?: boolean; // Add a prop to explicitly show all students
  accent?: "emerald" | "amber" | "primary";
}

export const StudentSearch = ({
  onStudentSelect,
  selectedStudentId,
  teacherId,
  showHeader = true,
  showAllStudents = false,
  accent = "primary",
}: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch students with optional teacher filter
  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students-search", teacherId, showAllStudents],
    queryFn: async () => {
      if (showAllStudents) {
        const { data, error } = await supabase
          .from("students")
          .select("id, name")
          .eq("status", "active")
          .not("madrassah_id", "is", null)
          .order("name");
        if (error) {
          console.error("Error fetching all students:", error);
          throw error;
        }
        return data || [];
      }

      if (teacherId) {
        const { data: teacherClasses, error: classesError } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", `{${teacherId}}`);

        if (classesError) {
          console.error("Error fetching teacher classes:", classesError);
          throw classesError;
        }

        const studentIds = (teacherClasses || [])
          .flatMap((c) => c.current_students || [])
          .filter((id, index, self) => id && self.indexOf(id) === index);

        if (studentIds.length === 0) {
          return [];
        }

        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, name")
          .in("id", studentIds)
          .order("name");

        if (studentsError) {
          console.error("Error fetching students for teacher:", studentsError);
          throw studentsError;
        }
        return studentsData || [];
      }

      return [];
    },
    enabled: showAllStudents || !!teacherId,
  });

  // Filter students based on search query
  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const accentText = accent === "amber" ? "text-amber-600" : accent === "emerald" ? "text-emerald-600" : "text-primary";
  const hoverBg = accent === "amber" ? "hover:bg-amber-50" : accent === "emerald" ? "hover:bg-emerald-50" : "hover:bg-primary/5";
  const selectedBg = accent === "amber" ? "bg-amber-100 text-amber-900" : accent === "emerald" ? "bg-emerald-100 text-emerald-900" : "bg-primary/10 text-primary";

  return (
    <Card className={`${!showHeader ? "border-0 shadow-none" : ""}`}>
      {showHeader && (
        <CardHeader>
          <CardTitle>Student Search</CardTitle>
          <CardDescription>
            Find a student to view their progress
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className={!showHeader ? "p-0" : undefined}>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${accentText}`} />
            <Input
              type="search"
              placeholder="Search students by name..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            {isLoading
              ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading students...</span>
                </div>
              )
              : error
              ? (
                <div className="flex items-center justify-center p-4 text-red-500">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Error loading students</span>
                </div>
              )
              : filteredStudents && filteredStudents.length > 0
              ? (
                <div className="max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <Button
                      key={student.id}
                      variant={selectedStudentId === student.id ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left px-3 py-2 h-auto ${selectedStudentId === student.id ? selectedBg : hoverBg} text-foreground`}
                      onClick={() => onStudentSelect(student.id, student.name)}
                    >
                      {student.name}
                    </Button>
                  ))}
                </div>
              )
              : (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery
                    ? "No students matching your search"
                    : "No students found"}
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
