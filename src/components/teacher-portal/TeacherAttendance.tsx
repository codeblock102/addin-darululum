
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, MoreHorizontal, Search } from 'lucide-react';

interface TeacherAttendanceProps {
  teacherId: string;
}

export const TeacherAttendance = ({ teacherId }: TeacherAttendanceProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch students assigned to this teacher
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      // Return mock data until the issue with students_teachers is resolved
      return [
        { id: '1', name: 'Student 1' },
        { id: '2', name: 'Student 2' },
        { id: '3', name: 'Student 3' },
      ];
    },
  });

  // Fetch attendance records for the selected date
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-records', teacherId, date ? format(date, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!date) return [];
      
      // Let's return mock attendance data for now
      return [
        { 
          id: '1', 
          student_id: '1', 
          student_name: 'Student 1',
          date: format(date, 'yyyy-MM-dd'),
          status: 'present',
          notes: 'Arrived on time'
        },
        { 
          id: '2', 
          student_id: '2',
          student_name: 'Student 2',
          date: format(date, 'yyyy-MM-dd'),
          status: 'absent',
          notes: 'Not feeling well'
        },
        { 
          id: '3', 
          student_id: '3',
          student_name: 'Student 3',
          date: format(date, 'yyyy-MM-dd'),
          status: 'late',
          notes: 'Late by 15 minutes'
        }
      ];
    },
    enabled: !!date,
  });

  const filteredAttendance = attendanceRecords?.filter(record => {
    const matchesStatus = !selectedStatus || record.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      record.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Excused</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Management</h2>
          <p className="text-muted-foreground">Record and monitor student attendance</p>
        </div>
        <Button>Mark Today's Attendance</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Calendar Sidebar */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view or record attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            {date && (
              <div className="mt-4">
                <p className="text-sm font-medium">Selected Date</p>
                <div className="flex items-center mt-1 gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(date, 'PPPP')}</span>
                </div>
              </div>
            )}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
              <div className="flex items-center space-x-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.student_name}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Status</DropdownMenuItem>
                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAttendance?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
