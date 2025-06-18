
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
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
} from "@/components/ui/alert-dialog.tsx";
import {
  Award,
  BookOpen,
  Calendar,
  Edit,
  Eye,
  GraduationCap,
  Phone,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive";
  madrassah_id?: string;
  section?: string;
}

interface StudentListProps {
  students?: Student[];
  isLoading?: boolean;
  onEdit?: (student: Student) => void;
}

export const StudentList = ({ students, isLoading, onEdit }: StudentListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-3 w-[200px]" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No students found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                <Badge
                  variant={student.status === "active" ? "default" : "secondary"}
                  className={
                    student.status === "active"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }
                >
                  {student.status}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                {student.guardian_name && (
                  <p>Guardian: {student.guardian_name}</p>
                )}
                {student.guardian_contact && (
                  <p>Contact: {student.guardian_contact}</p>
                )}
                {student.enrollment_date && (
                  <p>
                    Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(student)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
