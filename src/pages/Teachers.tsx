
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  students?: number;
}

const Teachers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    experience: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingTeacher(true);

    try {
      const { error } = await supabase
        .from('teachers')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teacher added successfully",
      });

      // Reset form and close dialog
      setFormData({ name: "", subject: "", experience: "" });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      
    } catch (error: any) {
      toast({
        title: "Error adding teacher",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingTeacher(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teachers</h1>
            <p className="text-gray-500">Manage teaching staff and assignments</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter teacher's name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    placeholder="Years of experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="submit"
                    disabled={isAddingTeacher}
                  >
                    {isAddingTeacher ? "Adding..." : "Add Teacher"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
