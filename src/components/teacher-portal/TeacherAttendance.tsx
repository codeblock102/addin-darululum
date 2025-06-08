import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';
import type { Database } from '@/integrations/supabase/types.ts';

// Define the structure of a student as fetched for this component
interface StudentData {
  id: string;
  name: string;
}

// Define the structure of an attendance record as fetched for this component
// It combines data from 'attendance' and the related 'students' table.
// Using Database types for better accuracy from attendance table structure
type StudentAttendanceRecord = Omit<Database["public"]["Tables"]["attendance"]["Row"], 'student_id'> & {
  student_id: string; // Ensure student_id is not null after join/filtering
  student_name: string; // Name from the joined 'students' table
  // Include other fields from attendance.Row if necessary, e.g., notes, class_id
};


export const TeacherAttendance = (/* { teacherId }: TeacherAttendanceProps */) => {
  // console.log("TeacherAttendance mounted with teacherId:", teacherId); // Removed teacherId related log
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null); // State for inline editing
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set()); // For bulk actions
  const [bulkActionStatus, setBulkActionStatus] = useState<string>(''); // Status for bulk update
  const queryClient = useQueryClient(); // For invalidating queries

  // 1. Fetch ALL students from the 'students' table.
  const { data: allStudents, isLoading: studentsLoading, error: studentsError } = useQuery<StudentData[], Error>({
    queryKey: ['all-students'], // Changed queryKey, removed teacherId
    queryFn: async () => {
      console.log("[QueryFn all-students] Starting to fetch all students.");
      const { data: studentDetails, error: studentDetailsError } = await supabase
        .from('students')
        .select('id, name');
        
      console.log("[QueryFn all-students] Fetched all studentDetails from students table:", studentDetails);
      if (studentDetailsError) {
        console.error("[QueryFn all-students] Error fetching all studentDetails:", studentDetailsError);
        throw studentDetailsError;
      }
      return studentDetails || []; 
    },
    // enabled: !!teacherId, // Removed: query should always be enabled
  });
  console.log("All Students Hook Result:", { allStudents, studentsLoading, studentsError });

  // 3. Fetch attendance records for ALL fetched students on the selected date.
  const { data: attendanceRecords, isLoading: attendanceLoading, error: attendanceError } = useQuery<StudentAttendanceRecord[], Error>({
    queryKey: ['student-attendance-records', date, allStudents?.map(s => s.id)], // Changed to allStudents
    queryFn: async () => {
      console.log("[QueryFn student-attendance-records] Starting. Date:", date, "All Students:", allStudents); // Changed to allStudents
      if (!date || !allStudents || allStudents.length === 0) return []; // Changed to allStudents
      const studentIds = allStudents.map(student => student.id); // Changed to allStudents
      if (studentIds.length === 0) return [];
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log("[QueryFn student-attendance-records] Fetching attendance for studentIds:", studentIds, "on date:", formattedDate);

      const { data, error } = await supabase
        .from('attendance') 
        .select(`
          id,
          date,
          status,
          notes,
          class_id,
          created_at,
          student_id,
          students:student_id (name) 
        `)
        .eq('date', formattedDate)
        .in('student_id', studentIds);
      console.log("[QueryFn student-attendance-records] Raw attendance data from Supabase:", data);
      if (error) {
        console.error("[QueryFn student-attendance-records] Error fetching attendance records:", error);
        throw error;
      }

      // Ensure record.students is properly handled if it might be null/undefined from the query result
      const mappedData = data?.map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        notes: record.notes,
        class_id: record.class_id,
        created_at: record.created_at,
        student_id: record.student_id!,
        student_name: record.students?.name || 'Unknown Student',
      })) || [];
      console.log("[QueryFn student-attendance-records] Mapped attendance data:", mappedData);
      return mappedData;
    },
    enabled: !!date && !!allStudents && allStudents.length > 0, // Changed to allStudents
  });
  console.log("Attendance Records Hook Result:", { attendanceRecords, attendanceLoading, attendanceError });

  const handleStatusUpdate = async (studentId: string, newStatus: string, currentDate: Date | undefined) => {
    if (!currentDate) return;
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    console.log(`[handleStatusUpdate] Upserting for studentId: ${studentId}, date: ${formattedDate}, status: ${newStatus}`);

    // Assuming a unique constraint on (student_id, date) in your attendance table
    const { error } = await supabase
      .from('attendance')
      .upsert(
        { student_id: studentId, date: formattedDate, status: newStatus },
        { onConflict: 'student_id, date' } 
      );

    if (error) {
      console.error('[handleStatusUpdate] Error upserting attendance:', error);
      // Optionally, show an error message to the user
    } else {
      console.log('[handleStatusUpdate] Upsert successful');
      await queryClient.invalidateQueries({ 
        queryKey: ['student-attendance-records', currentDate, allStudents?.map(s => s.id)] 
      });
      setEditingStudentId(null); // Exit editing mode
    }
  };

  // Create a map of attendance records by student_id for quick lookup
  const attendanceMap = new Map(attendanceRecords?.map(record => [record.student_id, record]));

  // Combine student data with their attendance, always using allStudents as the base
  const studentsWithAttendance = allStudents?.map(student => {
    const attendance = attendanceMap.get(student.id);
    return {
      ...student, // id, name
      status: attendance?.status, // present, absent, late, excused, or undefined
      notes: attendance?.notes,
      attendance_id: attendance?.id, // To be used as key if needed, or for actions
    };
  });

  const filteredStudents = studentsWithAttendance?.filter(student => {
    const studentName = student.name || '';
    const matchesStatus = !selectedStatus || student.status === selectedStatus || (selectedStatus === 'not-marked' && !student.status);
    const matchesSearch = !searchQuery || 
      studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  console.log("Filtered Students Result:", filteredStudents, "Selected Status:", selectedStatus, "Search Query:", searchQuery);

  const handleRowCheckboxChange = (studentId: string, checked: boolean | 'indeterminate') => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (checked === true) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allVisibleIds = new Set(filteredStudents?.map(s => s.id) || []);
      setSelectedStudentIds(allVisibleIds);
    } else {
      setSelectedStudentIds(new Set());
    }
  };
  
  const handleBulkStatusUpdate = async () => {
    if (!date || selectedStudentIds.size === 0 || !bulkActionStatus) {
      console.warn("[handleBulkStatusUpdate] Missing date, selected students, or bulk action status.");
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    const recordsToUpsert = Array.from(selectedStudentIds).map(studentId => ({
      student_id: studentId,
      date: formattedDate,
      status: bulkActionStatus,
    }));

    console.log(`[handleBulkStatusUpdate] Upserting ${recordsToUpsert.length} records with status: ${bulkActionStatus}`);

    const { error } = await supabase
      .from('attendance')
      .upsert(recordsToUpsert, { onConflict: 'student_id, date' });

    if (error) {
      console.error('[handleBulkStatusUpdate] Error upserting bulk attendance:', error);
      // TODO: Show error to user, e.g., using a toast notification
    } else {
      console.log('[handleBulkStatusUpdate] Bulk upsert successful');
      await queryClient.invalidateQueries({
        queryKey: ['student-attendance-records', date, allStudents?.map(s => s.id)]
      });
      setSelectedStudentIds(new Set()); // Clear selection
      setBulkActionStatus(''); // Reset bulk status dropdown
      setEditingStudentId(null); // Ensure individual edit mode is also exited
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Not Marked</Badge>;
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-700 dark:text-red-100">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-700 dark:text-yellow-100">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100">Excused</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-100">{status}</Badge>;
    }
  };
  
  // Early returns for loading/error states
  // if (!teacherId) return <Card><CardContent className="pt-6"><p>Teacher ID not provided. Unable to load student attendance data.</p></CardContent></Card>; // Removed teacherId check
  if (studentsLoading) return <Card><CardContent className="pt-6 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading student data...</CardContent></Card>; // Updated message
  if (studentsError) return <Card><CardContent className="pt-6 text-red-600">Error loading student data: {studentsError.message}</CardContent></Card>; // Updated message

  const isAllFilteredSelected = filteredStudents && filteredStudents.length > 0 &&
    selectedStudentIds.size === filteredStudents.length &&
    filteredStudents.every(s => selectedStudentIds.has(s.id));

  const isSomeFilteredSelected = selectedStudentIds.size > 0 && !isAllFilteredSelected;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Attendance</h2>
          <p className="text-muted-foreground">Record and monitor attendance for all students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Calendar Sidebar */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view or record attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {date && (
              <div className="mb-4">
                <p className="text-sm font-medium">Selected Date</p>
                <div className="flex items-center mt-1 gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(date, 'PPPP')}</span>
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
              {date ? `Attendance for ${format(date, 'MMMM d, yyyy')}` : 'Select a date to view records'}
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
                  disabled={attendanceLoading || !date || !allStudents || allStudents.length === 0} // Changed to allStudents
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
                  disabled={attendanceLoading || !date || !allStudents || allStudents.length === 0} // Changed to allStudents
                />
              </div>
            </div>

            {attendanceLoading && <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading attendance...</div>}
            {attendanceError && <p className="text-red-600">Error loading attendance: {attendanceError.message}</p>}
            {(!allStudents || allStudents.length === 0) && !studentsLoading && (
                <p className="text-center py-4">No students found in the system.</p>
            )}
            {!studentsLoading && !attendanceLoading && !attendanceError && allStudents && allStudents.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] px-2">
                        <Checkbox
                          checked={
                            isAllFilteredSelected
                              ? true
                              : isSomeFilteredSelected
                              ? 'indeterminate'
                              : false
                          }
                          onCheckedChange={handleSelectAllChange}
                          aria-label="Select all rows on this page"
                          disabled={!filteredStudents || filteredStudents.length === 0 || attendanceLoading}
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
                      <TableRow key={student.id} data-state={selectedStudentIds.has(student.id) ? "selected" : ""}>
                        <TableCell className="px-2">
                          <Checkbox
                            checked={selectedStudentIds.has(student.id)}
                            onCheckedChange={(checked) => handleRowCheckboxChange(student.id, checked)}
                            aria-label={`Select row for ${student.name}`}
                            disabled={attendanceLoading}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          {editingStudentId === student.id ? (
                            <Select
                              value={student.status || ''}
                              onValueChange={(newStatus) => {
                                handleStatusUpdate(student.id, newStatus, date);
                              }}
                            >
                              <SelectTrigger className="h-8 w-auto min-w-[100px]">
                                <SelectValue placeholder="Set status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="excused">Excused</SelectItem>
                                {/* Option to clear status / mark as 'Not Marked' could be added here if needed */}
                                {/* e.g. <SelectItem value="">Not Marked</SelectItem> or a separate action */}
                              </SelectContent>
                            </Select>
                          ) : (
                            getStatusBadge(student.status)
                          )}
                        </TableCell>
                        <TableCell>{student.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingStudentId(student.id)}>
                                Edit Status
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>Add Note</DropdownMenuItem>
                              <DropdownMenuItem disabled>View History</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredStudents || filteredStudents.length === 0) && allStudents && allStudents.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center"> {/* Adjusted colSpan */}
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
