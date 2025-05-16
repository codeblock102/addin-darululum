import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Eye, Users } from "lucide-react";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
  completed_juz?: number[];
  current_juz?: number | null;
}

interface StudentListProps {
  searchQuery: string;
  onEdit: (student: Student) => void;
}

export const StudentList = ({ searchQuery, onEdit }: StudentListProps) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      console.log("Raw student data from Supabase:", data);
      return data as Student[];
    },
    // Add a refetch interval to keep the list updated
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name && 
       student.guardian_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (filteredStudents?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No students found with the search criteria.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Guardian</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Enrollment Date</TableHead>
          <TableHead>Current Juz</TableHead>
          <TableHead>Completed Juz</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredStudents?.map((student) => (
          <TableRow 
            key={student.id}
            className="transition-colors hover:bg-muted/50 cursor-pointer group"
            onMouseEnter={() => setHoveredId(student.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => navigate(`/students/${student.id}`)}
          >
            <TableCell>
              <div className="font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs text-primary font-semibold">
                    {student.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                {student.name}
              </div>
            </TableCell>
            <TableCell>{student.guardian_name || '—'}</TableCell>
            <TableCell>{student.guardian_contact || '—'}</TableCell>
            <TableCell>
              {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : '—'}
            </TableCell>
            <TableCell>{student.current_juz ?? 'None'}</TableCell>
            <TableCell>
              {student.completed_juz && student.completed_juz.length > 0 
                ? student.completed_juz.join(', ') 
                : 'None'}
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                student.status === 'active' 
                  ? 'bg-green-50 text-green-700 ring-green-600/20' 
                  : 'bg-red-50 text-red-700 ring-red-600/20'
              }`}>
                {student.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/students/${student.id}`);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(student);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
