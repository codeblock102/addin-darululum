
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DhorBookEntry, StudentDhorSummary } from "@/types/dhor-book";
import { DhorBookGrid } from "./DhorBookGrid";
import { DhorBookHeader } from "./DhorBookHeader";
import { DhorBookSummary } from "./DhorBookSummary";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DhorBookProps {
  studentId: string;
  teacherId: string;
}

export function DhorBook({ studentId, teacherId }: DhorBookProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['dhor-book-entries', studentId, currentWeek],
    queryFn: async () => {
      const startOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() - currentWeek.getDay()));
      const endOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() - currentWeek.getDay() + 6));
      
      const { data, error } = await supabase
        .from('dhor_book_entries')
        .select('*')
        .eq('student_id', studentId)
        .gte('entry_date', startOfWeek.toISOString().split('T')[0])
        .lte('entry_date', endOfWeek.toISOString().split('T')[0])
        .order('entry_date', { ascending: true });

      if (error) throw error;
      return data as DhorBookEntry[];
    }
  });

  const { data: summary } = useQuery({
    queryKey: ['dhor-book-summary', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_dhor_summaries')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      return data as StudentDhorSummary;
    }
  });

  if (entriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <DhorBookHeader 
        studentId={studentId} 
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
      />
      
      <DhorBookGrid 
        entries={entries || []}
        studentId={studentId}
        teacherId={teacherId}
        currentWeek={currentWeek}
      />
      
      {summary && (
        <DhorBookSummary 
          summary={summary}
          studentId={studentId}
        />
      )}
    </Card>
  );
}
