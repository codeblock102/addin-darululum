
import { useState } from "react";

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
import { Loader2, Search, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "../students/AddStudentDialog.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";


interface StudentSearchProps {
  teacherId: string;
}

export const StudentSearch = ({ teacherId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const { isAdmin } = useRBAC();

  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["teacherDataForDashboardSearch", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId)
        .single();
      if (error) {
        console.error(
          "Error fetching teacher data for dashboard search:",
          error,
        );
        throw error;
      }
      return data;
    },
    enabled: !!teacherId,
  });

  // Fetch all students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["teacher-students-for-dashboard", teacherData, isAdmin],
    queryFn: async () => {
      if (!teacherData) return [];
      let query = supabase
        .from("students")
        .select("id, name")
        .eq("status", "active")
        .eq("madrassah_id", teacherData.madrassah_id);

      // If the user is a teacher, also filter by section. Admins see all sections.
      if (!isAdmin && teacherData.section) {
        query = query.eq("section", teacherData.section);
      }

      query = query.order("name", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!teacherData,
  });

  const handleSearch = () => {
    console.log("Searching for:", searchQuery);
    // Implement search functionality
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
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 p-2 border rounded">
              <User className="h-4 w-4" />
              <span>No students found for "{searchQuery}"</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
