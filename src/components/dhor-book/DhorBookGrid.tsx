
import { useState } from "react";
import { DhorBookEntry } from "@/types/dhor-book";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NewEntryDialog } from "./NewEntryDialog";
import { format } from "date-fns";

interface DhorBookGridProps {
  entries: DhorBookEntry[];
  studentId: string;
  teacherId: string;
  currentWeek: Date;
}

export function DhorBookGrid({ entries, studentId, teacherId, currentWeek }: DhorBookGridProps) {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - date.getDay() + i);
    return date;
  });

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
              <TableHead>Sabak</TableHead>
              <TableHead>S. Para</TableHead>
              <TableHead>Dhor 1</TableHead>
              <TableHead>Dhor 2</TableHead>
              <TableHead className="text-center">M</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">DT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekDays.map((date) => {
              const entry = entries.find(e => e.entry_date === format(date, 'yyyy-MM-dd'));
              
              return (
                <TableRow key={date.toISOString()}>
                  <TableCell className="font-medium">
                    {format(date, 'E, MMM d')}
                  </TableCell>
                  <TableCell>{entry?.sabak || '—'}</TableCell>
                  <TableCell>{entry?.sabak_para || '—'}</TableCell>
                  <TableCell>{entry?.dhor_1 || '—'}</TableCell>
                  <TableCell>{entry?.dhor_2 || '—'}</TableCell>
                  <TableCell className="text-center">
                    {entry ? (entry.dhor_1_mistakes + entry.dhor_2_mistakes) : '—'}
                  </TableCell>
                  <TableCell>{entry?.comments || '—'}</TableCell>
                  <TableCell className="text-center">{entry?.points || '—'}</TableCell>
                  <TableCell className="text-center">
                    {entry?.detention ? '✓' : '—'}
                  </TableCell>
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
      />
    </div>
  );
}
