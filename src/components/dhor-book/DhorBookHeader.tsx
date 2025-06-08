import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { format, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DhorBookHeaderProps {
  studentId: string;
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
}

export function DhorBookHeader({ studentId, currentWeek, onWeekChange }: DhorBookHeaderProps) {
  const { data: student } = useQuery({
    queryKey: ['student-details', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const startOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()));
  const endOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 6));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{student?.name || 'Loading...'}</h2>
          <p className="text-muted-foreground">
            Guardian: {student?.guardian_name || 'Not specified'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(startOfWeek, 'MMM d')} - {format(endOfWeek, 'MMM d, yyyy')}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
