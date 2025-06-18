import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Tables } from "@/integrations/supabase/types.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { UseFormReturn } from "react-hook-form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

type Student = Pick<Tables<"students">, "id" | "name">;

interface StudentGridProps {
  form: UseFormReturn<any>;
  user: Session['user'] | null;
  multiSelect: boolean;
  selectedStudents: Set<string>;
  onStudentSelect: (studentId: string) => void;
  onSelectAll: (students: Student[]) => void;
}

const fetchStudentsForUser = async (user: Session['user'] | null): Promise<Student[]> => {
  if (!user?.id) return [];

  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("madrassah_id, section, role")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("Error fetching user data:", userError);
    throw new Error("Could not fetch user profile.");
  }
  
  if (!userData?.madrassah_id) {
    console.log("No madrassah_id found for this user.");
    return [];
  }

  const { madrassah_id, role, section } = userData;

  let query = supabase
    .from("students")
    .select("id, name")
    .eq("madrassah_id", madrassah_id);

  if (role === 'teacher' && section) {
    query = query.eq('section', section);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching students for user:", error);
    throw new Error("Failed to load students.");
  }
  return data as Student[];
};

export const StudentGrid = ({ user, selectedStudents, onStudentSelect, onSelectAll }: StudentGridProps) => {
  const { data: students = [], isLoading, isError, error } = useQuery<Student[]>({
    queryKey: ["students", user?.id],
    queryFn: () => fetchStudentsForUser(user),
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
  }

  if (isError) {
    console.error(error);
    return <div className="flex justify-center items-center h-48 text-red-500"><AlertCircle className="mr-2"/> Error loading students. See console for details.</div>;
  }
  
  if (!user) {
    return (
      <Card className="flex items-center justify-center h-48">
        <p className="text-slate-500">Could not identify user to fetch students.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Select Students</CardTitle>
          <Button variant="outline" onClick={() => onSelectAll(students)}>
            {selectedStudents.size === students.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => onStudentSelect(student.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center space-x-3 ${
                selectedStudents.has(student.id)
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-400"
                  : "bg-slate-50 dark:bg-slate-800"
              }`}
            >
              <Checkbox
                checked={selectedStudents.has(student.id)}
                onCheckedChange={() => onStudentSelect(student.id)}
              />
              <span className="font-medium text-sm">{student.name}</span>
            </div>
          ))}
        </div>
        {students.length === 0 && <p className="text-center text-slate-500 py-8">No students found.</p>}
      </CardContent>
    </Card>
  );
};
