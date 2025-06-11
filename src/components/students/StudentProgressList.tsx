import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Edit2,
  MessageSquare,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { EditProgressDialog } from "./EditProgressDialog";
import { MobileTable } from "@/components/mobile/MobileTable";
import { useIsMobile } from "@/hooks/use-mobile";

interface Progress {
  id: string;
  student_id: string;
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  date: string;
  created_at: string;
  memorization_quality?:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  notes?: string;
  teacher_notes?: string;
  contributor_name?: string;
  contributor_id?: string;
}

interface StudentProgressListProps {
  progress: Progress[];
}

export const StudentProgressList = ({ progress }: StudentProgressListProps) => {
  const [editingProgress, setEditingProgress] = useState<Progress | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleEditClick = (entry: Progress) => {
    setEditingProgress(entry);
    setIsEditDialogOpen(true);
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case "excellent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "good":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "average":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "needsWork":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "horrible":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const formatQualityText = (quality?: string) => {
    switch (quality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "average":
        return "Average";
      case "needsWork":
        return "Needs Work";
      case "horrible":
        return "Poor";
      default:
        return "Not Rated";
    }
  };

  if (progress.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Progress Entries Yet
            </h3>
            <p className="text-gray-600 max-w-md">
              Start tracking this student's memorization journey by adding their
              first progress entry.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Mobile view with enhanced cards
  if (isMobile) {
    const mobileColumns = [
      {
        title: "Date",
        key: "date",
        primary: true,
        render: (value: unknown) => (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              {value && typeof value === "string"
                ? new Date(value).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        ),
      },
      {
        title: "Position",
        key: "position",
        render: (_: unknown, record: Record<string, unknown>) => {
          const entry = record as unknown as Progress;
          return (
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-sm font-medium">
                <BookOpen className="h-3 w-3 text-indigo-600" />
                <span>Surah {entry.current_surah || "—"}</span>
              </div>
              <div className="text-xs text-gray-500">
                Juz {entry.current_juz || "—"} • Ayat{" "}
                {entry.start_ayat || "—"}-{entry.end_ayat || "—"}
              </div>
            </div>
          );
        },
      },
      {
        title: "Quality",
        key: "memorization_quality",
        status: true,
        render: (value: unknown) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
              getQualityColor(value as string)
            }`}
          >
            {formatQualityText(value as string)}
          </span>
        ),
      },
      {
        title: "Verses",
        key: "verses_memorized",
        render: (value: unknown) => (
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="font-medium">{(value as number) || 0}</span>
          </div>
        ),
      },
      {
        title: "Notes",
        key: "notes",
        render: (_: unknown, record: Record<string, unknown>) => {
          const entry = record as unknown as Progress;
          return (
            <div className="space-y-1">
              {entry.notes
                ? (
                  <div className="flex items-start space-x-1">
                    <MessageSquare className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600 line-clamp-2">
                      {entry.notes}
                    </span>
                  </div>
                )
                : <span className="text-xs text-gray-400">No notes</span>}
              {entry.teacher_notes && (
                <div className="flex items-start space-x-1 mt-1">
                  <User className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-blue-600 line-clamp-2">
                    {entry.teacher_notes}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: "Contributor",
        key: "contributor_name",
        render: (value: unknown) => (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600">
              {(value as string) || "Unknown"}
            </span>
          </div>
        ),
      },
    ];

    const mobileActions = [
      {
        icon: Edit2,
        label: "Edit",
        onClick: (record: Record<string, unknown>) => {
          const entry = record as unknown as Progress;
          handleEditClick(entry);
        },
        variant: "ghost" as const,
      },
    ];

    return (
      <>
        <div className="space-y-3">
          <MobileTable
            data={progress.map((entry) => ({ ...entry }))}
            columns={mobileColumns}
            actions={mobileActions}
          />
        </div>

        <EditProgressDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          progressEntry={editingProgress}
        />
      </>
    );
  }

  // Desktop view with enhanced styling
  return (
    <>
      <Card className="overflow-hidden shadow-sm border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Progress History</span>
          </h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold text-gray-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Position
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Verses
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Quality
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Notes
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Contributor
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progress.map((entry, index) => (
              <TableRow
                key={entry.id}
                className={`hover:bg-blue-50/50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>
                      {entry.date
                        ? new Date(entry.date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium text-gray-900">
                        Surah {entry.current_surah || "—"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Juz {entry.current_juz || "—"} • Ayat{" "}
                      {entry.start_ayat || "—"}-{entry.end_ayat || "—"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      {entry.verses_memorized || 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      getQualityColor(entry.memorization_quality)
                    }`}
                  >
                    {formatQualityText(entry.memorization_quality)}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="space-y-2">
                    {entry.notes
                      ? (
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div
                            className="truncate text-sm text-gray-700"
                            title={entry.notes}
                          >
                            {entry.notes}
                          </div>
                        </div>
                      )
                      : (
                        <span className="text-gray-400 text-sm italic">
                          No notes
                        </span>
                      )}
                    {entry.teacher_notes && (
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div
                          className="truncate text-sm text-blue-600"
                          title={entry.teacher_notes}
                        >
                          Teacher: {entry.teacher_notes}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {entry.contributor_name || "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(entry)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit entry</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EditProgressDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        progressEntry={editingProgress}
      />
    </>
  );
};
