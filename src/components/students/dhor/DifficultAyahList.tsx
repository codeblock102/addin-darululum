import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { DifficultAyahsList } from "@/components/students/dhor/DifficultAyahsList.tsx";
import { Loader2 } from "lucide-react";
import { DifficultAyah } from "@/types/progress.ts";

interface DifficultAyahListProps {
  studentId: string;
}

export function DifficultAyahList({ studentId }: DifficultAyahListProps) {
  const { data: ayahs, isLoading } = useQuery({
    queryKey: ["student-difficult-ayahs", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("difficult_ayahs")
        .select("*")
        .eq("student_id", studentId)
        .order("date_added", { ascending: false });

      if (error) {
        throw error;
      }

      return data as DifficultAyah[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <DifficultAyahsList ayahs={ayahs || []} studentId={studentId} />;
}
