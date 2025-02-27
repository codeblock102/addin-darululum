
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  students?: number;
}

interface TeacherListProps {
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
}

export const TeacherList = ({ searchQuery, onEdit }: TeacherListProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          name,
          subject,
          experience,
          students_teachers (
            id
          )
        `);

      if (error) {
        toast({
          title: "Error fetching teachers",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data.map(teacher => ({
        ...teacher,
        students: teacher.students_teachers?.length || 0
      }));
    }
  });

  const handleDelete = async (teacherId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting teacher",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTeachers = teachers?.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Experience</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-10">
              Loading teachers...
            </TableCell>
          </TableRow>
        ) : filteredTeachers?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-10">
              {searchQuery ? "No teachers found matching your search." : "No teachers found. Add your first teacher!"}
            </TableCell>
          </TableRow>
        ) : (
          filteredTeachers?.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell className="font-medium">{teacher.name}</TableCell>
              <TableCell>{teacher.subject}</TableCell>
              <TableCell>{teacher.students}</TableCell>
              <TableCell>{teacher.experience}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(teacher)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {teacher.name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(teacher.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
