import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2, MoreHorizontal, Search } from "lucide-react";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";

// Define the structure of a student as fetched for this component
interface StudentData {
  id: string;
  name: string;
}

type StudentTeacherAssignmentRow = {
  student_name: string | null;
};

type AttendanceQueryRow = {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_id: string | null;
  created_at: string | null;
  time: string | null;
  late_reason: string | null;
  student_id: string;
  students: { name?: string | null } | null;
};

// Define the structure of an attendance record as fetched for this component
// It combines data from 'attendance' and the related 'students' table.
type StudentAttendanceRecord = {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_id: string | null;
  created_at: string | null;
  time: string | null;
  late_reason: string | null;
  student_id: string;
  student_name: string;
};

export const TeacherAttendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 1. Fetch ONLY this teacher's students using students_teachers → names → students
  const {
    data: allStudents,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery<StudentData[], Error>({
    queryKey: ["teacher-students-attendance"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return [];

      // Get student names assigned to this teacher
      const { data: assignRows, error: assignErr } = await supabase
        .from("students_teachers")
        .select("student_name")
        .eq("teacher_id", uid)
        .eq("active", true);
      if (assignErr) throw assignErr;
      const rows = (assignRows || []) as StudentTeacherAssignmentRow[];
      const names = Array.from(
        new Set(
          rows
            .map((r) => r.student_name)
            .filter((name): name is string => Boolean(name)),
        ),
      );
      if (names.length === 0) return [];

      // Resolve to student IDs via names
      const { data: studentsRows, error: stErr } = await supabase
        .from("students")
        .select("id, name")
        .in("name", names);
      if (stErr) throw stErr;
      return (studentsRows || []) as StudentData[];
    },
  });

  // 3. Fetch attendance records for ALL fetched students on the selected date.
  const {
    data: attendanceRecords,
    isLoading: attendanceLoading,
    error: attendanceError,
  } = useQuery<StudentAttendanceRecord[], Error>({
    queryKey: [
      "student-attendance-records",
      date,
      allStudents?.map((s) => s.id),
    ],
    queryFn: async (): Promise<StudentAttendanceRecord[]> => {
      console.log(
        "[QueryFn student-attendance-records] Starting. Date:",
        date,
        "All Students:",
        allStudents,
      );
      if (!date || !allStudents || allStudents.length === 0) return [];
      const studentIds = allStudents.map((student) => student.id);
      if (studentIds.length === 0) return [];
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log(
        "[QueryFn student-attendance-records] Fetching attendance for studentIds:",
        studentIds,
        "on date:",
        formattedDate,
      );

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          notes,
          class_id,
          created_at,
          time,
          late_reason,
          student_id,
          students:student_id (name) 
        `)
        .eq("date", formattedDate)
        .in("student_id", studentIds);

      console.log(
        "[QueryFn student-attendance-records] Raw attendance data from Supabase:",
        data,
      );
      if (error) {
        console.error(
          "[QueryFn student-attendance-records] Error fetching attendance records:",
          error,
        );
        throw error;
      }

      const rows = (data || []) as AttendanceQueryRow[];
      const mappedData: StudentAttendanceRecord[] = rows.map((record) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        notes: record.notes,
        class_id: record.class_id,
        created_at: record.created_at,
        time: record.time,
        late_reason: record.late_reason,
        student_id: record.student_id,
        student_name: record.students?.name || "Unknown Student",
      }));

      console.log(
        "[QueryFn student-attendance-records] Mapped attendance data:",
        mappedData,
      );
      return mappedData;
    },
    enabled: !!date && !!allStudents && allStudents.length > 0,
  });

  const handleStatusUpdate = async (
    studentId: string,
    newStatus: string,
    currentDate: Date | undefined,
  ) => {
    if (!currentDate) return;
    const formattedDate = format(currentDate, "yyyy-MM-dd");

    console.log(
      `[handleStatusUpdate] Upserting for studentId: ${studentId}, date: ${formattedDate}, status: ${newStatus}`,
    );

    const { error } = await supabase
      .from("attendance")
      .upsert(
        { student_id: studentId, date: formattedDate, status: newStatus },
        { onConflict: "student_id, date" },
      );

    if (error) {
      console.error("[handleStatusUpdate] Error upserting attendance:", error);
    } else {
      console.log("[handleStatusUpdate] Upsert successful");
      await queryClient.invalidateQueries({
        queryKey: [
          "student-attendance-records",
          currentDate,
          allStudents?.map((s) => s.id),
        ],
      });
      setEditingStudentId(null);
    }
  };

  // Create a map of attendance records by student_id for quick lookup
  const attendanceMap = new Map(
    attendanceRecords?.map((record) => [record.student_id, record]),
  );

  // Combine student data with their attendance, always using allStudents as the base
  const studentsWithAttendance = allStudents?.map((student) => {
    const attendance = attendanceMap.get(student.id);
    return {
      ...student,
      status: attendance?.status,
      notes: attendance?.notes,
      attendance_id: attendance?.id,
    };
  });

  const filteredStudents = studentsWithAttendance?.filter((student) => {
    const studentName = student.name || "";
    const matchesStatus = !selectedStatus ||
      student.status === selectedStatus ||
      (selectedStatus === "not-marked" && !student.status);
    const matchesSearch = !searchQuery ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const allMarked = (allStudents || []).length > 0 && (allStudents || []).every((s) => {
    const rec = attendanceMap.get(s.id);
    return Boolean(rec?.status);
  });

  const handleSendAttendanceEmails = async () => {
    try {
      if (!date) return;
      if (!allMarked) {
        toast({ title: "Incomplete", description: "Please mark attendance for all students first.", variant: "destructive" });
        return;
      }
      const studentIds = (allStudents || []).map((s) => s.id);
      if (studentIds.length === 0) return;
      setIsSending(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      const body = {
        source: "manual-teacher",
        student_ids: studentIds,
        date: format(date, "yyyy-MM-dd"),
        force: true,
      };

      // Try standard invoke first
      const { data, error } = await supabase.functions.invoke("attendance-absence-email", {
        body,
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });
      let result: Record<string, unknown> | null = (data as Record<string, unknown> | null);
      let err: unknown = error as unknown;

      // Fallback to direct fetch
      if (!result && err) {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/attendance-absence-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(body),
        });
        result = resp.ok ? await resp.json() : null;
        err = resp.ok ? null : await resp.text();
      }

      if (result && !err) {
        toast({ title: "Emails queued", description: "Attendance emails will be sent to parents for your class." });
      } else {
        throw new Error(typeof err === "string" ? err : "Failed to send emails");
      }
    } catch (e) {
      toast({
        title: "Error",
        description: formatErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setConfirmOpen(false);
    }
  };

  const handleRowCheckboxChange = (
    studentId: string,
    checked: boolean | "indeterminate",
  ) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (checked === true) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAllChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const allVisibleIds = new Set(filteredStudents?.map((s) => s.id) || []);
      setSelectedStudentIds(allVisibleIds);
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!date || selectedStudentIds.size === 0 || !bulkActionStatus) {
      console.warn(
        "[handleBulkStatusUpdate] Missing date, selected students, or bulk action status.",
      );
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const recordsToUpsert = Array.from(selectedStudentIds).map((studentId) => ({
      student_id: studentId,
      date: formattedDate,
      status: bulkActionStatus,
    }));

    console.log(
      `[handleBulkStatusUpdate] Upserting ${recordsToUpsert.length} records with status: ${bulkActionStatus}`,
    );

    const { error } = await supabase
      .from("attendance")
      .upsert(recordsToUpsert, { onConflict: "student_id, date" });

    if (error) {
      console.error(
        "[handleBulkStatusUpdate] Error upserting bulk attendance:",
        error,
      );
    } else {
      console.log("[handleBulkStatusUpdate] Bulk upsert successful");
      await queryClient.invalidateQueries({
        queryKey: [
          "student-attendance-records",
          date,
          allStudents?.map((s) => s.id),
        ],
      });
      setSelectedStudentIds(new Set());
      setBulkActionStatus("");
      setEditingStudentId(null);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Not Marked</Badge>;
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100">
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-700 dark:text-red-100">
            Absent
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-700 dark:text-yellow-100">
            Late
          </Badge>
        );
      case "excused":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100">
            Excused
          </Badge>
        );
      case "early_departure":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-700 dark:text-indigo-100">
            Early Departure
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Early returns for loading/error states
  if (studentsLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />Loading student
          data...
        </CardContent>
      </Card>
    );
  }
  if (studentsError) {
    return (
      <Card>
        <CardContent className="pt-6 text-red-600">
          Error loading student data: {studentsError.message}
        </CardContent>
      </Card>
    );
  }

  const isAllFilteredSelected = filteredStudents &&
    filteredStudents.length > 0 &&
    selectedStudentIds.size === filteredStudents.length &&
    filteredStudents.every((s) => selectedStudentIds.has(s.id));

  const isSomeFilteredSelected = selectedStudentIds.size > 0 &&
    !isAllFilteredSelected;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Student Attendance
          </h2>
          <p className="text-muted-foreground">
            Record and monitor attendance for all students.
          </p>
          <div className="flex gap-2">
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={studentsLoading || attendanceLoading || !allMarked || isSending || (allStudents || []).length === 0}
              >
                {isSending ? "Sending..." : "Send attendance to parents"}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send attendance emails?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will email the parents of your {allStudents?.length || 0} students based on todays attendance.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSendAttendanceEmails} disabled={isSending}>
                    {isSending ? "Sending..." : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {!allMarked && (
              <span className="text-xs text-muted-foreground self-center">Mark everyone first to enable sending.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Calendar Sidebar */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>
              Choose a date to view or record attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {date && (
              <div className="mb-4">
                <p className="text-sm font-medium">Selected Date</p>
                <div className="flex items-center mt-1 gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(date, "PPPP")}</span>
                </div>
              </div>
            )}
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={attendanceLoading}
            />
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              {date
                ? `Attendance for ${format(date, "MMMM d, yyyy")}`
                : "Select a date to view records"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedStudentIds.size > 0 && (
              <div className="flex items-center gap-4 p-3 mb-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedStudentIds.size} student(s) selected
                </p>
                <Select
                  value={bulkActionStatus}
                  onValueChange={setBulkActionStatus}
                >
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Set status for selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                    <SelectItem value="early_departure">Early Departure</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkActionStatus || attendanceLoading}
                  className="h-9"
                >
                  Apply to Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="h-9"
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedStatus(undefined);
                    } else {
                      setSelectedStatus(value);
                    }
                  }}
                  disabled={attendanceLoading || !date || !allStudents ||
                    allStudents.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                    <SelectItem value="early_departure">Early Departure</SelectItem>
                    <SelectItem value="not-marked">Not Marked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={attendanceLoading || !date || !allStudents ||
                    allStudents.length === 0}
                />
              </div>
            </div>

            {attendanceLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />Loading
                attendance...
              </div>
            )}
            {attendanceError && (
              <p className="text-red-600">
                Error loading attendance: {attendanceError.message}
              </p>
            )}
            {(!allStudents || allStudents.length === 0) && !studentsLoading && (
              <p className="text-center py-4">
                No students found in the system.
              </p>
            )}
            {!studentsLoading && !attendanceLoading && !attendanceError &&
              allStudents && allStudents.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] px-2">
                        <Checkbox
                          checked={isAllFilteredSelected
                            ? true
                            : isSomeFilteredSelected
                            ? "indeterminate"
                            : false}
                          onCheckedChange={handleSelectAllChange}
                          aria-label="Select all rows on this page"
                          disabled={!filteredStudents ||
                            filteredStudents.length === 0 || attendanceLoading}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents?.map((student) => (
                      <TableRow
                        key={student.id}
                        data-state={selectedStudentIds.has(student.id)
                          ? "selected"
                          : ""}
                      >
                        <TableCell className="px-2">
                          <Checkbox
                            checked={selectedStudentIds.has(student.id)}
                            onCheckedChange={(checked) =>
                              handleRowCheckboxChange(student.id, checked)}
                            aria-label={`Select row for ${student.name}`}
                            disabled={attendanceLoading}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>
                          {editingStudentId === student.id
                            ? (
                              <Select
                                value={student.status || ""}
                                onValueChange={(newStatus) => {
                                  handleStatusUpdate(
                                    student.id,
                                    newStatus,
                                    date,
                                  );
                                }}
                              >
                                <SelectTrigger className="h-8 w-auto min-w-[100px]">
                                  <SelectValue placeholder="Set status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">
                                    Present
                                  </SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="excused">
                                    Excused
                                  </SelectItem>
                                  <SelectItem value="early_departure">
                                    Early Departure
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )
                            : (
                              getStatusBadge(student.status)
                            )}
                        </TableCell>
                        <TableCell>{student.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingStudentId(student.id)}
                              >
                                Edit Status
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                Add Note
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredStudents || filteredStudents.length === 0) &&
                      allStudents && allStudents.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No students match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
