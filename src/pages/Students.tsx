
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Search, Trash2, UserPlus } from "lucide-react";
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
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

const Students = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    enrollment_date: new Date().toISOString().split('T')[0],
    guardian_name: "",
    guardian_contact: "",
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "Error fetching students",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Student[];
    }
  });

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.guardian_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (selectedStudent) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', selectedStudent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        // Add new student
        const { error } = await supabase
          .from('students')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        date_of_birth: "",
        enrollment_date: new Date().toISOString().split('T')[0],
        guardian_name: "",
        guardian_contact: "",
      });
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      date_of_birth: student.date_of_birth || "",
      enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
      guardian_name: student.guardian_name || "",
      guardian_contact: student.guardian_contact || "",
    });
  };

  const handleDelete = async (studentId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error: any) {
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Students</h1>
            <p className="text-gray-500">Manage and monitor student progress</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedStudent ? "Edit Student" : "Add New Student"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter student's full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment_date">Enrollment Date</Label>
                  <Input
                    id="enrollment_date"
                    type="date"
                    value={formData.enrollment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, enrollment_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name</Label>
                  <Input
                    id="guardian_name"
                    placeholder="Enter guardian's name"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_contact">Guardian Contact</Label>
                  <Input
                    id="guardian_contact"
                    placeholder="Enter guardian's contact number"
                    value={formData.guardian_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, guardian_contact: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="submit"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : selectedStudent ? "Update Student" : "Add Student"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search students by name or guardian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {searchQuery ? "No students found matching your search." : "No students found. Add your first student!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.guardian_name || '-'}</TableCell>
                    <TableCell>{student.guardian_contact || '-'}</TableCell>
                    <TableCell>{student.enrollment_date || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(student)}
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
                            <AlertDialogTitle>Delete Student</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {student.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(student.id)}
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Students;

