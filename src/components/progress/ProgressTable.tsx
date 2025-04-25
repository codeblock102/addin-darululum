
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Progress } from "@/types/progress";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

const getQualityBadge = (quality: string, isAdmin: boolean) => {
  if (quality === 'excellent') {
    return (
      <Badge className={isAdmin ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-green-100 text-green-700"}>
        Excellent
      </Badge>
    );
  } else if (quality === 'good') {
    return (
      <Badge className={isAdmin ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-700"}>
        Good
      </Badge>
    );
  } else if (quality === 'needsWork') {
    return (
      <Badge className={isAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-700"}>
        Needs Work
      </Badge>
    );
  } else {
    return (
      <Badge className={isAdmin ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-red-100 text-red-700"}>
        Needs Review
      </Badge>
    );
  }
};

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
                {progress.date ? new Date(progress.date).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell>
                {/* Using optional chaining and typing correctly */}
                {(progress as any)?.students?.name || "Unknown"}
              </TableCell>
              <TableCell>{progress.current_surah || "N/A"}</TableCell>
              <TableCell className="text-center">{progress.verses_memorized || 0}</TableCell>
              <TableCell className="text-right">
                {getQualityBadge(progress.memorization_quality || '', isAdmin)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
