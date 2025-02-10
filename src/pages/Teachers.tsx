
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
}

const Teachers = () => {
  const { toast } = useToast();

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teachers</h1>
            <p className="text-gray-500">Manage teaching staff and assignments</p>
          </div>
          <Button>
            <UserPlus className="mr-2" />
            Add Teacher
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
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
              ) : teachers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No teachers found. Add your first teacher!
                  </TableCell>
                </TableRow>
              ) : (
                teachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{teacher.students}</TableCell>
                    <TableCell>{teacher.experience}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
