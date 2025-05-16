
import { DailyActivityEntry } from "@/types/dhor-book";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface StudentDailyChecklistProps {
  studentId: string;
  date: Date;
  entries?: DailyActivityEntry[];
}

export function StudentDailyChecklist({ studentId, date, entries = [] }: StudentDailyChecklistProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const todayEntries = entries.filter(entry => entry.entry_date === dateStr);
  
  const hasSabaqEntry = todayEntries.some(entry => 
    entry.current_juz !== undefined && 
    entry.current_surah !== undefined && 
    entry.start_ayat !== undefined && 
    entry.end_ayat !== undefined
  );
  
  const hasSabaqParaEntry = todayEntries.some(entry => 
    entry.sabaq_para_data && entry.sabaq_para_data.juz_number !== undefined
  );
  
  const hasDhor1Entry = todayEntries.some(entry => 
    entry.juz_revisions_data && 
    entry.juz_revisions_data.some(jr => jr.dhor_slot === 1)
  );
  
  const hasDhor2Entry = todayEntries.some(entry => 
    entry.juz_revisions_data && 
    entry.juz_revisions_data.some(jr => jr.dhor_slot === 2)
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Progress - {format(date, 'MMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="sabaq" checked={hasSabaqEntry} disabled />
            <Label htmlFor="sabaq" className={hasSabaqEntry ? "" : "text-muted-foreground"}>
              Sabaq (Main Lesson)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="sabaq-para" checked={hasSabaqParaEntry} disabled />
            <Label htmlFor="sabaq-para" className={hasSabaqParaEntry ? "" : "text-muted-foreground"}>
              Sabaq Para (Reading)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="dhor1" checked={hasDhor1Entry} disabled />
            <Label htmlFor="dhor1" className={hasDhor1Entry ? "" : "text-muted-foreground"}>
              Dhor 1 (First Revision)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="dhor2" checked={hasDhor2Entry} disabled />
            <Label htmlFor="dhor2" className={hasDhor2Entry ? "" : "text-muted-foreground"}>
              Dhor 2 (Second Revision)
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
