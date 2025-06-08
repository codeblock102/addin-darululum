import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Loader2 } from "lucide-react";

interface TeacherSelectorProps {
  selectedTeacher: string;
  setSelectedTeacher: (value: string) => void;
}

export const TeacherSelector = (
  { selectedTeacher, setSelectedTeacher }: TeacherSelectorProps,
) => {
  // Fetch teachers to populate recipient dropdown
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["admin-message-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        type: "teacher" as const,
      }));
    },
  });

  return (
    <div className="space-y-2">
      <Label>Recipient</Label>
      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
        <SelectTrigger>
          <SelectValue placeholder="Select teacher" />
        </SelectTrigger>
        <SelectContent>
          {teachersLoading
            ? (
              <div className="flex justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )
            : teachers && teachers.length > 0
            ? (
              teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name} (Teacher)
                </SelectItem>
              ))
            )
            : (
              <SelectItem value="no-teachers" disabled>
                No teachers available
              </SelectItem>
            )}
        </SelectContent>
      </Select>
    </div>
  );
};
