
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Edit, Eye, Trash2, Users, Phone, Calendar, User, BookOpen, Award, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { useIsMobile } from "@/hooks/use-mobile";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive";
  completed_juz?: number[];
  current_juz?: number | null;
}

interface StudentListProps {
  searchQuery: string;
  onEdit: (student: Student) => void;
}

export const StudentList = ({ searchQuery, onEdit }: StudentListProps) => {
  const navigate = useNavigate();
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      console.log("Raw student data from Supabase:", data);
      return data as Student[];
    },
    refetchInterval: 30000,
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error: relationshipError } = await supabase
        .from("students_teachers")
        .delete()
        .eq("student_name", studentToDelete?.name || "");

      if (relationshipError) throw relationshipError;

      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;
      return studentId;
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: `${studentToDelete?.name} has been removed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
    }
  };

  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name &&
        student.guardian_name.toLowerCase().includes(
          searchQuery.toLowerCase(),
        )),
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredStudents?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No students found
        </h3>
        <p className="text-gray-600 max-w-md">
          {searchQuery 
            ? "No students match your search criteria. Try adjusting your search terms."
            : "No students have been added yet. Start by adding your first student."
          }
        </p>
      </div>
    );
  }

  // Mobile view with enhanced cards
  if (isMobile) {
    return (
      <div className="p-4 space-y-4">
        {filteredStudents?.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={() => navigate(`/students/${student.id}`)}
          >
            <div className="p-4">
              {/* Student Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {student.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    student.status === "active" ? "bg-green-500" : "bg-red-500"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {student.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-2 mb-4">
                {student.guardian_name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{student.guardian_name}</span>
                  </div>
                )}
                {student.guardian_contact && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{student.guardian_contact}</span>
                  </div>
                )}
                {student.enrollment_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Enrolled {new Date(student.enrollment_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Progress Info */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Current Juz</span>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {student.current_juz ?? "Not Set"}
                </span>
              </div>

              {student.completed_juz && student.completed_juz.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Completed Juz</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.completed_juz.slice(0, 5).map((juz) => (
                      <span
                        key={juz}
                        className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium"
                      >
                        {juz}
                      </span>
                    ))}
                    {student.completed_juz.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{student.completed_juz.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/students/${student.id}`);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-gray-600 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(student);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  onClick={(e) => handleDeleteClick(e, student)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop view with enhanced styling
  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 border-b">
            <TableHead className="font-semibold text-gray-700">Student</TableHead>
            <TableHead className="font-semibold text-gray-700">Guardian</TableHead>
            <TableHead className="font-semibold text-gray-700">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700">Enrollment</TableHead>
            <TableHead className="font-semibold text-gray-700">Current Juz</TableHead>
            <TableHead className="font-semibold text-gray-700">Completed</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents?.map((student, index) => (
            <TableRow
              key={student.id}
              className={`transition-colors hover:bg-blue-50/50 cursor-pointer group ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              }`}
              onClick={() => navigate(`/students/${student.id}`)}
            >
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {student.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      student.status === "active" ? "bg-green-500" : "bg-red-500"
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">ID: {student.id.slice(0, 8)}...</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-700">
                {student.guardian_name || "—"}
              </TableCell>
              <TableCell className="text-gray-700">
                <div className="flex items-center space-x-1">
                  {student.guardian_contact ? (
                    <>
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{student.guardian_contact}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </TableCell>
              <TableCell className="text-gray-700">
                <div className="flex items-center space-x-1">
                  {student.enrollment_date ? (
                    <>
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{new Date(student.enrollment_date).toLocaleDateString()}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {student.current_juz ?? "Not Set"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {student.completed_juz && student.completed_juz.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-w-32">
                    {student.completed_juz.slice(0, 3).map((juz) => (
                      <span
                        key={juz}
                        className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium"
                      >
                        {juz}
                      </span>
                    ))}
                    {student.completed_juz.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{student.completed_juz.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">None</span>
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                    student.status === "active"
                      ? "bg-green-50 text-green-700 ring-green-600/20"
                      : "bg-red-50 text-red-700 ring-red-600/20"
                  }`}
                >
                  {student.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:bg-blue-100"
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
                    className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(student);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDeleteClick(e, student)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {studentToDelete?.name}? This action cannot be undone and will
              remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
