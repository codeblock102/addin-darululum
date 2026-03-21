import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  AlertCircle,
  Award,
  Check,
  Medal,
  Trophy,
  X,
} from "lucide-react";
import { getQualityBadge } from "./QualityBadge.tsx";
import type { StudentRecordSummary } from "./types.ts";

interface RecordsTableProps {
  records: StudentRecordSummary[];
  hasStudents: boolean;
  onViewDetails: (studentId: string) => void;
}

export function RecordsTable(
  { records, hasStudents, onViewDetails }: RecordsTableProps,
) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-muted/20">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        {hasStudents
          ? (
            <>
              <h3 className="text-lg font-medium mb-1">
                No records found
              </h3>
              <p className="text-muted-foreground">
                No student records found for the selected date or
                filter criteria.
              </p>
            </>
          )
          : (
            <>
              <h3 className="text-lg font-medium mb-1">
                No students assigned
              </h3>
              <p className="text-muted-foreground">
                You don't have any students assigned to you.
                Please contact an administrator.
              </p>
            </>
          )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="text-center">Sabaq</TableHead>
            <TableHead className="text-center">
              Sabaq Para
            </TableHead>
            <TableHead className="text-center">Dhor</TableHead>
            <TableHead className="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell>
                {index < 3
                  ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {index === 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                      {index === 1 && (
                        <Medal className="h-4 w-4 text-zinc-400" />
                      )}
                      {index === 2 && (
                        <Award className="h-4 w-4 text-amber-700" />
                      )}
                    </div>
                  )
                  : (
                    <span className="font-medium">
                      {index + 1}
                    </span>
                  )}
              </TableCell>
              <TableCell className="font-medium">
                {record.name}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  {record.sabaq.done
                    ? (
                      <>
                        <Check className="h-5 w-5 text-green-500" />
                        {getQualityBadge(record.sabaq.quality)}
                      </>
                    )
                    : <X className="h-5 w-5 text-red-500" />}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  {record.sabaqPara.done
                    ? (
                      <>
                        <Check className="h-5 w-5 text-green-500" />
                        {getQualityBadge(
                          record.sabaqPara.quality,
                        )}
                      </>
                    )
                    : <X className="h-5 w-5 text-red-500" />}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  {record.dhor.done
                    ? (
                      <>
                        <Check className="h-5 w-5 text-green-500" />
                        {getQualityBadge(record.dhor.quality)}
                      </>
                    )
                    : <X className="h-5 w-5 text-red-500" />}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(record.id)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
