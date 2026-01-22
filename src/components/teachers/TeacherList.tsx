import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
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
} from "@/components/ui/alert-dialog.tsx";
import { Loader2, Pencil, Trash2, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  section?: string | null;
  grade?: number | null;
  bio?: string;
  email?: string;
  phone?: string;
  capabilities?: string[];
  students: number;
}
interface TeacherListProps {
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
  madrassahId?: string;
}
export const TeacherList = ({
  searchQuery,
  onEdit,
  madrassahId,
}: TeacherListProps) => {
  const {
    toast,
  } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const {
    data: teachers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profiles", madrassahId, "role", "teacher"],
    queryFn: async () => {
      let query = supabase.from("profiles").select(
        "id, name, subject, section, grade, email, phone, bio, capabilities",
      ).eq("role", "teacher");

      if (madrassahId) {
        query = query.eq("madrassah_id", madrassahId);
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        toast({
          title: "Error fetching teachers",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      const {
        data: studentData,
        error: studentError,
      } = await supabase.from("students_teachers").select("id, teacher_id");
      if (studentError) {
        console.error("Error fetching student assignments:", studentError);
      }
      return data.map((teacher) => {
        const studentCount = studentData
          ? studentData.filter((s) => s.teacher_id === teacher.id).length
          : 0;
        return {
          ...teacher,
          students: studentCount,
        } as Teacher;
      });
    },
  });
  const handleDelete = async (teacherId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("delete-teacher", {
        body: { userId: teacherId },
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["profiles", madrassahId, "role", "teacher"],
      });
    } catch (error: unknown) {
      toast({
        title: "Error deleting teacher",
        description: error instanceof Error
          ? error.message
          : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTeacherToDelete(null);
    }
  };
  const filteredTeachers = teachers?.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Teachers
          </h3>
          <p className="text-red-600">
            There was a problem fetching the teachers data. Please try again
            later.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      {/* Cards for mobile and tablets */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading teachers...</span>
          </div>
        ) : (filteredTeachers || []).length === 0 ? (
          <div className="text-center py-6 text-gray-600">
            {searchQuery ? "No teachers found matching your search." : "No teachers found. Add your first teacher!"}
          </div>
        ) : (
          (filteredTeachers || []).map((teacher) => (
            <Card key={teacher.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{teacher.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {teacher.subject}
                      </Badge>
                      <span className="flex items-center gap-1 text-gray-500"><Users className="h-4 w-4" />{teacher.students}</span>
                    </div>
                    <div className="mt-2 text-sm">
                      {teacher.email ? (
                        <a href={`mailto:${teacher.email}`} className="text-emerald-700 hover:underline break-all">{teacher.email}</a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{teacher.phone || "N/A"}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(teacher)}
                      title="Edit teacher"
                      className="border-gray-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={teacherToDelete === teacher.id}
                      onOpenChange={(open) => { if (!open) setTeacherToDelete(null); }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-gray-300"
                          onClick={() => setTeacherToDelete(teacher.id)}
                          title="Delete teacher"
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
                            disabled={isProcessing}
                          >
                            {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>) : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table (large screens only) */}
      <div className="hidden lg:block overflow-x-auto">
        <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading teachers...</span>
                  </div>
                </TableCell>
              </TableRow>
            )
            : filteredTeachers?.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  {searchQuery
                    ? "No teachers found matching your search."
                    : "No teachers found. Add your first teacher!"}
                </TableCell>
              </TableRow>
            )
            : filteredTeachers?.map((teacher) => (
              <TableRow key={teacher.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{teacher.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {teacher.subject}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{teacher.students}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {teacher.email
                    ? (
                      <a
                        href={`mailto:${teacher.email}`}
                        className="text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        {teacher.email}
                      </a>
                    )
                    : "N/A"}
                </TableCell>
                <TableCell>{teacher.phone || "N/A"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(teacher)}
                    title="Edit teacher"
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog
                    open={teacherToDelete === teacher.id}
                    onOpenChange={(open) => {
                      if (!open) setTeacherToDelete(null);
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-gray-300 hover:bg-red-50"
                        onClick={() => setTeacherToDelete(teacher.id)}
                        title="Delete teacher"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete{" "}
                          {teacher.name}? This action cannot be undone.
                          {teacher.students > 0 && (
                            <div className="mt-2 bg-amber-50 p-2 border border-amber-200 rounded-md text-amber-800">
                              <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-2" />
                                <span className="font-medium">Warning:</span>
                              </div>
                              <p className="mt-1">
                                This teacher has {teacher.students}{" "}
                                student{teacher.students !== 1 ? "s" : ""}{" "}
                                assigned. Deleting this teacher will remove
                                these assignments.
                              </p>
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(teacher.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            )
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
        </Table>
      </div>
    </>
  );
};
