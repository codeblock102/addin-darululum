import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Progress } from "@/types/progress.ts";
import { useUserRole } from "@/hooks/useUserRole.ts";
import { StatusBadge } from "@/components/ui/status-badge.tsx";

export const ProgressTable = ({ data }: { data: Progress[] }) => {
  const { isAdmin } = useUserRole();
  
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className={isAdmin ? "text-gray-400" : "text-gray-500"}>No progress entries available.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table className={isAdmin ? "admin-theme-table" : ""}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[120px]">Student</TableHead>
            <TableHead className="w-[100px]">Surah</TableHead>
            <TableHead className="w-[100px] text-center">Verses</TableHead>
            <TableHead className="text-right">Quality</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((progress) => (
            <TableRow key={progress.id} className="hover:bg-white/5">
              <TableCell className="font-medium">
                {progress.entry_date ? new Date(progress.entry_date).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell>
                {progress.students?.name || "Unknown"}
              </TableCell>
              <TableCell>{progress.current_surah || "N/A"}</TableCell>
              <TableCell className="text-center">{progress.verses_memorized || 0}</TableCell>
              <TableCell className="text-right">
                {progress.memorization_quality ? (
                  <StatusBadge status={progress.memorization_quality} />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
