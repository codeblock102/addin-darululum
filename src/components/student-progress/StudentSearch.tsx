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
}

export const StudentSearch = ({
  onStudentSelect,
  selectedStudentId,
  teacherId,
  showHeader = true,
  showAllStudents = false,
}: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: teacherData } = useQuery({
    queryKey: ["teacherDataForSearch", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from("teachers")
        .select("madrassah_id, section")
        .eq("id", teacherId)
        .single();
      if (error) {
        console.error("Error fetching teacher data for search:", error);
        return null;
      }
      return data;
    },
    enabled: !!teacherId && !showAllStudents,
  });

  // Fetch students with optional teacher filter
  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students-search", teacherId, showAllStudents, teacherData],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("id, name")
        .eq("status", "active")
        .not("madrassah_id", "is", null);

      // Filter by teacher's section if a teacherId is provided and we are not showing all students
      if (teacherId && !showAllStudents) {
        if (teacherData) {
          query = query
            .eq("madrassah_id", teacherData.madrassah_id)
            .eq("section", teacherData.section);
        } else {
          // If teacher data is still loading or failed, return no students for this context
          return [];
        }
      }

      const { data, error } = await query.order("name");

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      return data || [];
    },
    enabled: showAllStudents || (!!teacherId && !!teacherData),
  });

  // Filter students based on search query
  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                      variant={selectedStudentId === student.id
                        ? "secondary"
                        : "secondary"}
                      className={`w-full justify-start text-left px-3 py-2 h-auto ${
                        selectedStudentId === student.id ? "bg-secondary" : ""
                      }text-black`}
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
