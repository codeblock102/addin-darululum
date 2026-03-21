import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  AttendanceHeader,
  AttendanceDatePicker,
  AttendanceFilters,
  AttendanceBulkActions,
  AttendanceTable,
} from "./attendance/index.ts";
import type { StudentData, StudentAttendanceRecord } from "./attendance/types.ts";

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

  // 1. Fetch ALL students from the 'students' table.
  const {
    data: allStudents,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery<StudentData[], Error>({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data: studentDetails, error: studentDetailsError } =
        await supabase
          .from("students")
          .select("id, name");

      if (studentDetailsError) {
        console.error(
          "[QueryFn all-students] Error fetching all studentDetails:",
          studentDetailsError,
        );
        throw studentDetailsError;
      }
      return studentDetails || [];
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
      if (!date || !allStudents || allStudents.length === 0) return [];
      const studentIds = allStudents.map((student) => student.id);
      if (studentIds.length === 0) return [];
      const formattedDate = format(date, "yyyy-MM-dd");
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

      if (error) {
        console.error(
          "[QueryFn student-attendance-records] Error fetching attendance records:",
          error,
        );
        throw error;
      }

      const mappedData: StudentAttendanceRecord[] = data?.map((record) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        notes: record.notes,
        class_id: record.class_id,
        created_at: record.created_at,
        time: record.time,
        late_reason: record.late_reason,
        student_id: record.student_id!,
        student_name: (record.students as any)?.name || "Unknown Student",
      })) || [];

      return mappedData;
    },
    enabled: !!date && !!allStudents && allStudents.length > 0,
  });

  const handleStatusUpdate = async (
    studentId: string,
    newStatus: string,
  ) => {
    if (!date) return;
    const formattedDate = format(date, "yyyy-MM-dd");

    const { error } = await supabase
      .from("attendance")
      .upsert(
        { student_id: studentId, date: formattedDate, status: newStatus },
        { onConflict: "student_id, date" },
      );

    if (error) {
      console.error("[handleStatusUpdate] Error upserting attendance:", error);
    } else {
      await queryClient.invalidateQueries({
        queryKey: [
          "student-attendance-records",
          date,
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

    const { error } = await supabase
      .from("attendance")
      .upsert(recordsToUpsert, { onConflict: "student_id, date" });

    if (error) {
      console.error(
        "[handleBulkStatusUpdate] Error upserting bulk attendance:",
        error,
      );
    } else {
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

  const filtersDisabled = attendanceLoading || !date || !allStudents ||
    allStudents.length === 0;

  return (
    <div className="space-y-4">
      <AttendanceHeader />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <AttendanceDatePicker
          date={date}
          onDateSelect={setDate}
          disabled={attendanceLoading}
        />

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
            <AttendanceBulkActions
              selectedCount={selectedStudentIds.size}
              bulkActionStatus={bulkActionStatus}
              onBulkActionStatusChange={setBulkActionStatus}
              onApply={handleBulkStatusUpdate}
              onClearSelection={() => setSelectedStudentIds(new Set())}
              disabled={attendanceLoading}
            />

            <AttendanceFilters
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              disabled={filtersDisabled}
            />

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
              <AttendanceTable
                filteredStudents={filteredStudents}
                hasStudents={allStudents.length > 0}
                selectedStudentIds={selectedStudentIds}
                editingStudentId={editingStudentId}
                attendanceLoading={attendanceLoading}
                isAllFilteredSelected={isAllFilteredSelected}
                isSomeFilteredSelected={isSomeFilteredSelected}
                onSelectAllChange={handleSelectAllChange}
                onRowCheckboxChange={handleRowCheckboxChange}
                onStatusUpdate={handleStatusUpdate}
                onEditStudent={setEditingStudentId}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
