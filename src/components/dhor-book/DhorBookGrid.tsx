
import { useState } from "react";
import { DailyActivityEntry } from "@/types/dhor-book"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NewEntryDialog } from "./NewEntryDialog";
import { format } from "date-fns";

interface DhorBookGridProps {
  entries: DailyActivityEntry[]; 
  studentId: string;
  teacherId: string;
  currentWeek: Date;
  onRefresh: () => void;
}

export function DhorBookGrid({ entries, studentId, teacherId, currentWeek, onRefresh }: DhorBookGridProps) {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - date.getDay() + i);
    return date;
  });

  const handleEntrySuccess = () => {
    setIsNewEntryOpen(false);
    console.log("Entry success - triggering refresh in DhorBookGrid");
    onRefresh(); // Simplified refresh, DhorBook.tsx handles staggered if needed
  };

  console.log("Entries received in DhorBookGrid:", entries);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Daily Records</h3>
        <Button onClick={() => setIsNewEntryOpen(true)}>Add Entry</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Sabaq (Main Lesson)</TableHead>
              <TableHead>Sabaq Para (Reading)</TableHead>
              <TableHead>Dhor 1</TableHead>
              <TableHead>Dhor 2</TableHead>
              <TableHead>Quality (Sabaq)</TableHead>
              <TableHead>Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekDays.map((date) => {
              const dateString = format(date, 'yyyy-MM-dd');
              const entry = entries.find(e => e.entry_date === dateString);
              
              const dhor1Entry = entry?.juz_revisions_data?.find(jr => jr.dhor_slot === 1);
              const dhor2Entry = entry?.juz_revisions_data?.find(jr => jr.dhor_slot === 2);
              
              return (
                <TableRow key={date.toISOString()}>
                  <TableCell className="font-medium">
                    {format(date, 'E, MMM d')}
                  </TableCell>
                  <TableCell>
                    {entry?.current_juz && entry.current_surah && entry.start_ayat && entry.end_ayat
                      ? `J${entry.current_juz} S${entry.current_surah}:${entry.start_ayat}-${entry.end_ayat}`
                      : '—'} 
                  </TableCell>
                  <TableCell>
                    {entry?.sabaq_para_data
                      ? `J${entry.sabaq_para_data.juz_number} (${entry.sabaq_para_data.quarters_revised || 'N/A quarters'}) Q: ${entry.sabaq_para_data.quality_rating || 'N/A'}`
                      : '—'}
                  </TableCell>
                  {/* Dhor 1 Cell */}
                  <TableCell>
                    {dhor1Entry
                      ? `${dhor1Entry.juz_number ? `J${dhor1Entry.juz_number}` : (dhor1Entry.juz_revised ? `J${dhor1Entry.juz_revised}` : 'N/A')} ` +
                        `${dhor1Entry.quarter_start ? `(Qtr ${dhor1Entry.quarter_start}` : ''}` +
                        `${dhor1Entry.quarters_covered ? `, ${dhor1Entry.quarters_covered}c` : ''}` +
                        `${dhor1Entry.quarter_start ? ')' : ''} ` +
                        `Q: ${dhor1Entry.memorization_quality || 'N/A'}`
                      : '—'}
                  </TableCell>
                  {/* Dhor 2 Cell */}
                  <TableCell>
                    {dhor2Entry
                      ? `${dhor2Entry.juz_number ? `J${dhor2Entry.juz_number}` : (dhor2Entry.juz_revised ? `J${dhor2Entry.juz_revised}` : 'N/A')} ` +
                        `${dhor2Entry.quarter_start ? `(Qtr ${dhor2Entry.quarter_start}` : ''}` +
                        `${dhor2Entry.quarters_covered ? `, ${dhor2Entry.quarters_covered}c` : ''}` +
                        `${dhor2Entry.quarter_start ? ')' : ''} ` +
                        `Q: ${dhor2Entry.memorization_quality || 'N/A'}`
                      : '—'}
                  </TableCell>
                   <TableCell>
                    {entry?.memorization_quality || '—'} 
                  </TableCell>
                  <TableCell>{entry?.comments || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <NewEntryDialog
        open={isNewEntryOpen}
        onOpenChange={setIsNewEntryOpen}
        studentId={studentId}
        teacherId={teacherId}
        onSuccess={handleEntrySuccess}
      />
    </div>
  );
}
