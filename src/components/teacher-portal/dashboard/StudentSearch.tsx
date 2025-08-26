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
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Search, UserRound, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "../students/AddStudentDialog.tsx";

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
    queryFn: async () => {
      if (!teacherId && !isAdmin) return null;
      
      // For admin users, we can fetch all students without a specific teacher
      if (isAdmin) {
        // Return a mock profile for admin to allow fetching all students
        return { madrassah_id: "admin", section: null };
      }
      
      let query = supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId);

      query = query.eq("role", "teacher");

      const { data, error } = await query.single();

      if (error) {
        console.error(
          "Error fetching user data for dashboard search:",
          error,
        );
        throw error;
      }
      return data;
    },
    enabled: !!teacherId || isAdmin,
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["all-students-for-search", teacherData, isAdmin],
    queryFn: async () => {
      if (!teacherData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("id, name")
        .eq("status", "active");

      // For admin users, fetch all students
      if (isAdmin) {
        // No madrassah_id filter for admin
      } else {
        query = query.eq("madrassah_id", teacherData.madrassah_id);
        if (teacherData.section) {
          query = query.eq("section", teacherData.section);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherData,
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
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardHeader className={`pb-3 ${isAdmin ? 'pb-2' : 'pb-3'}`}>
        <CardTitle className={`flex items-center gap-3 font-semibold text-gray-800 ${isAdmin ? 'text-base' : 'text-lg'}`}>
          <div className={`p-2 bg-[hsl(142.8,64.2%,24.1%)]/10 rounded-lg ${isAdmin ? 'p-1.5' : 'p-2'}`}>
            <Search className={`text-[hsl(142.8,64.2%,24.1%)] ${isAdmin ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          {isAdmin ? "Student Management" : "Student Search"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
            className="pl-10 h-11 bg-white border-gray-300 focus:ring-2 focus:ring-[hsl(142.8,64.2%,24.1%)] focus:border-[hsl(142.8,64.2%,24.1%)] transition-all duration-200"
          />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-black p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Loader2 className="h-4 w-4 animate-spin text-[hsl(142.8,64.2%,24.1%)]" />
            <span>Loading students...</span>
          </div>
        )}
        
        {searchQuery && !isLoading && (
          <div className="space-y-2">
            {filteredStudents.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-medium text-black uppercase tracking-wider">
                  Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </div>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-[hsl(142.8,64.2%,24.1%)]/30 transition-all duration-200 group"
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <div className="p-2 bg-[hsl(142.8,64.2%,24.1%)]/10 rounded-lg group-hover:bg-[hsl(142.8,64.2%,24.1%)]/20 transition-colors duration-200">
                      <UserRound className="h-4 w-4 text-[hsl(142.8,64.2%,24.1%)]" />
                    </div>
                    <span className="font-medium text-black group-hover:text-[hsl(142.8,64.2%,24.1%)] transition-colors duration-200">
                      {student.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-black">
                  No students found for "<span className="font-medium">{searchQuery}</span>"
                </div>
                <div className="text-xs text-black mt-1">
                  Try a different search term
                </div>
              </div>
            )}
          </div>
        )}

        {!searchQuery && !isLoading && (
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-black">
              {isAdmin ? "Search for students to manage" : "Search for your students"}
            </div>
            <div className="text-xs text-black mt-1">
              Start typing a student's name above
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
