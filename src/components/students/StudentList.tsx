
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
import { Edit, Eye } from "lucide-react";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

interface StudentListProps {
  searchQuery: string;
  onEdit: (student: Student) => void;
}

export const StudentList = ({ searchQuery, onEdit }: StudentListProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      setIsLoading(false);
      return data as Student[];
    },
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
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (filteredStudents?.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No students found with the search criteria.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Guardian</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Enrollment Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredStudents?.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.guardian_name || '—'}</TableCell>
            <TableCell>{student.guardian_contact || '—'}</TableCell>
            <TableCell>
              {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : '—'}
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {student.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => onEdit(student)}
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
