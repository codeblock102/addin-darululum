import { useState } from "react";
import { format, parse, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Clock, Loader2, Pencil } from "lucide-react";
import { StatusBadge, StatusType } from "@/components/ui/status-badge.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

type AttendanceRecord = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  notes?: string;
  students: {
    id: string;
    name: string;
  } | null;
  classes: {
    name?: string;
  } | null;
};

interface AttendanceDataTableProps {
  isLoading?: boolean;
  attendanceRecords?: AttendanceRecord[];
  isAdmin?: boolean;
}

export function AttendanceDataTable(
  { isLoading, attendanceRecords, isAdmin }: AttendanceDataTableProps,
) {
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState<string>("");
  const [timeValue, setTimeValue] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert database time format (HH:mm:ss) to HTML time input format (HH:mm)
  const dbTimeToInputTime = (timeString: string | null | undefined): string => {
    if (!timeString) return "";
    try {
      const time = parse(timeString, "HH:mm:ss", new Date());
      return format(time, "HH:mm");
    } catch {
      // If parsing fails, try to extract HH:mm from the string
      const match = timeString.match(/^(\d{2}:\d{2})/);
      return match ? match[1] : "";
    }
  };

  // Convert HTML time input format (HH:mm) to database format (HH:mm:ss)
  const inputTimeToDbTime = (timeString: string): string | null => {
    if (!timeString || !timeString.trim()) return null;
    // Ensure it's in HH:mm format, then append :00 for seconds
    const match = timeString.match(/^(\d{2}:\d{2})/);
    return match ? `${match[1]}:00` : null;
  };

  const updateRecordMutation = useMutation({
    mutationFn: async ({ 
      recordId, 
      note, 
      time 
    }: { 
      recordId: string; 
      note: string; 
      time?: string | null;
    }) => {
      const updateData: { notes?: string | null; time?: string | null } = {
        notes: note || null,
      };
      
      // Only include time in update if it's provided
      if (time !== undefined) {
        updateData.time = time;
      }

      const { error } = await supabase
        .from("attendance")
        .update(updateData)
        .eq("id", recordId);

      if (error) throw error;
      return { recordId, note, time };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Record updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      setEditingRecordId(null);
      setNoteValue("");
      setTimeValue("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (record: AttendanceRecord) => {
    setEditingRecordId(record.id);
    setNoteValue(record.notes || "");
    // Convert DB time format to HTML time input format
    setTimeValue(dbTimeToInputTime(record.time));
  };

  const handleCloseDialog = () => {
    setEditingRecordId(null);
    setNoteValue("");
    setTimeValue("");
  };

  const handleSaveRecord = () => {
    if (editingRecordId) {
      // Always allow time updates for admins, regardless of status
      const dbTime = isAdmin ? inputTimeToDbTime(timeValue) : undefined;
      
      updateRecordMutation.mutate({ 
        recordId: editingRecordId, 
        note: noteValue,
        time: dbTime,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-black">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return null;
  }

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "N/A";
    try {
      const time = parse(timeString, "HH:mm:ss", new Date());
      return format(time, "p");
    } catch {
      return timeString;
    }
  };

  const editingRecord = attendanceRecords.find((r) => r.id === editingRecordId);

  return (
    <>
      <ScrollArea className="h-[400px]">
        <div className="border border-purple-100 dark:border-purple-900/30 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className=" dark:bg-purple-900/20 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-purple-700 dark:text-purple-300">
                  Date
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300">
                  Time
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300">
                  Student
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300">
                  Class
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300">
                  Status
                </TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300">
                  Notes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.id} className=" transition-colors">
                  <TableCell className="text-gray-900  font-medium">
                    {format(parseISO(record.date), "PPP")}
                  </TableCell>
                  <TableCell className="text-gray-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-black" />
                    {formatTime(record.time)}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {record.students?.name || "Unknown Student"}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {record.classes?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.status as StatusType} />
                  </TableCell>
                  <TableCell className="max-w-[200px] text-black">
                    <div className="flex items-center gap-2">
                      <span className="truncate flex-1">{record.notes || "No notes"}</span>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          onClick={() => handleOpenDialog(record)}
                          title="Edit record"
                        >
                          <Pencil className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      <Dialog open={editingRecordId !== null} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              {editingRecord && (
                <>
                  {isAdmin
                    ? `Edit time and notes for ${editingRecord.students?.name || "Unknown Student"} on ${format(parseISO(editingRecord.date), "PPP")}`
                    : `Add or edit a note for ${editingRecord.students?.name || "Unknown Student"} on ${format(parseISO(editingRecord.date), "PPP")}`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="time-input">Attendance Time</Label>
                <Input
                  id="time-input"
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="note-input">Notes</Label>
              <Textarea
                id="note-input"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Enter note here..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRecord}
                disabled={updateRecordMutation.isPending}
              >
                {updateRecordMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
