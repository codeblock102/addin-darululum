
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
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
  const { session } = useAuth();

  // Fetch teachers from the same madrassah to populate recipient dropdown
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["admin-message-teachers", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.warn("No authenticated user found");
        return [];
      }

      // 1. Get current admin's madrassah_id
      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", session.user.id)
        .single();

      if (adminError || !adminProfile?.madrassah_id) {
        console.warn("Admin madrassah_id not found:", adminError);
        return [];
      }

      const adminMadrassahId = adminProfile.madrassah_id;

      // 2. Get teachers from the same madrassah
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "teacher")
        .eq("madrassah_id", adminMadrassahId)
        .order("name", { ascending: true });

      if (error) throw error;

      console.log(`Admin messaging: Found ${data?.length || 0} teachers from madrassah ${adminMadrassahId}`);

      return data.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        type: "teacher" as const,
      }));
    },
    enabled: !!session?.user?.id,
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
