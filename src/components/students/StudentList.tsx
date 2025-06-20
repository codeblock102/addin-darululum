
import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
  Mail,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
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
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border border-white/10 rounded-lg bg-white/5">
            <Skeleton className="h-14 w-14 rounded-full bg-white/10" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-[250px] bg-white/10" />
              <Skeleton className="h-4 w-[200px] bg-white/10" />
              <Skeleton className="h-4 w-[180px] bg-white/10" />
            </div>
            <Skeleton className="h-10 w-20 bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">No students found</h3>
        <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4 p-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-black font-semibold text-sm">
                  {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-100 truncate">{student.name}</h3>
                  <Badge
                    variant={student.status === "active" ? "default" : "secondary"}
                    className={
                      student.status === "active"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/30"
                    }
                  >
                    {student.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-gray-400">
                  {student.section && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3 w-3" />
                      <span>Section: {student.section}</span>
                    </div>
                  )}
                  {student.guardian_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{student.guardian_name}</span>
                    </div>
                  )}
                  {student.guardian_contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{student.guardian_contact}</span>
                    </div>
                  )}
                  {student.enrollment_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {onEdit && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(student)}
                      className="w-full admin-btn-secondary"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Student
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-gray-300 font-medium">Student</TableHead>
            <TableHead className="text-gray-300 font-medium">Section</TableHead>
            <TableHead className="text-gray-300 font-medium">Guardian</TableHead>
            <TableHead className="text-gray-300 font-medium">Contact</TableHead>
            <TableHead className="text-gray-300 font-medium">Enrollment</TableHead>
            <TableHead className="text-gray-300 font-medium">Status</TableHead>
            <TableHead className="text-gray-300 font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              className="border-white/5 hover:bg-white/5 transition-colors"
            >
              <TableCell className="py-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-black font-semibold">
                      {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-100">{student.name}</div>
                    <div className="text-sm text-gray-400">ID: {student.id.slice(0, 8)}...</div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-gray-300">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                  {student.section || "General"}
                </div>
              </TableCell>
              
              <TableCell className="text-gray-300">
                {student.guardian_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {student.guardian_name}
                  </div>
                )}
              </TableCell>
              
              <TableCell className="text-gray-300">
                {student.guardian_contact && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {student.guardian_contact}
                  </div>
                )}
              </TableCell>
              
              <TableCell className="text-gray-300">
                {student.enrollment_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(student.enrollment_date).toLocaleDateString()}
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <Badge
                  variant={student.status === "active" ? "default" : "secondary"}
                  className={
                    student.status === "active"
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }
                >
                  {student.status}
                </Badge>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(student)}
                      className="admin-btn-secondary"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
