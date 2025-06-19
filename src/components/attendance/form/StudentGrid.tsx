
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Circle, User, Users } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { AttendanceFormValues } from '@/types/attendance-form';
import { cn } from '@/lib/utils';

interface StudentGridProps {
  form: UseFormReturn<AttendanceFormValues>;
  selectedClassId: string;
  multiSelect?: boolean;
  selectedStudents?: Set<string>;
  onStudentSelect?: (studentId: string) => void;
}

interface Student {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  section?: string;
}

export function StudentGrid({ 
  form, 
  selectedClassId, 
  multiSelect = false, 
  selectedStudents = new Set(), 
  onStudentSelect 
}: StudentGridProps) {
  const selectedStudentId = form.watch('student_id');

  const { data: students, isLoading } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];

      const { data, error } = await supabase
        .from('students')
        .select('id, name, status, section')
        .eq('class_id', selectedClassId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!selectedClassId,
  });

  const handleStudentClick = (student: Student) => {
    if (multiSelect && onStudentSelect) {
      onStudentSelect(student.id);
    } else {
      form.setValue('student_id', student.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!selectedClassId) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Select a Class First
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
            Choose a class from the dropdown above to view and select students for attendance recording.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-5 w-20 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <Skeleton className="h-3 w-16 bg-white/10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!students?.length) {
    return (
      <Card className="border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Active Students
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
            There are no active students in this class. Add students to the class to record attendance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-400" />
            Select Students
          </h3>
          <p className="text-sm text-gray-400">
            {multiSelect ? 'Choose multiple students for bulk attendance' : 'Choose a student to record attendance'}
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
          {students.length} students
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => {
          const isSelected = multiSelect 
            ? selectedStudents.has(student.id)
            : selectedStudentId === student.id;

          return (
            <Card
              key={student.id}
              className={cn(
                "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                "bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg",
                "hover:bg-white/10 hover:border-green-500/30",
                isSelected && "bg-green-500/20 border-green-500/50 shadow-green-500/20"
              )}
              onClick={() => handleStudentClick(student)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className={cn(
                        "h-14 w-14 ring-2 transition-colors duration-300",
                        isSelected 
                          ? "ring-green-400 ring-offset-2 ring-offset-slate-800" 
                          : "ring-white/20 group-hover:ring-green-400/50"
                      )}>
                        <AvatarFallback className={cn(
                          "text-sm font-semibold transition-colors duration-300",
                          isSelected
                            ? "bg-green-500 text-white"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:from-green-500 group-hover:to-green-600"
                        )}>
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className={cn(
                        "font-medium transition-colors duration-300",
                        isSelected ? "text-green-300" : "text-gray-100 group-hover:text-green-300"
                      )}>
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs border transition-colors duration-300",
                            isSelected 
                              ? "bg-green-500/20 text-green-300 border-green-500/50"
                              : "bg-blue-500/20 text-blue-300 border-blue-500/50 group-hover:bg-green-500/20 group-hover:text-green-300 group-hover:border-green-500/50"
                          )}
                        >
                          Active Student
                        </Badge>
                        {student.section && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-white/10 text-gray-300 border-white/20"
                          >
                            {student.section}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "transition-colors duration-300",
                    isSelected ? "text-green-400" : "text-gray-400 group-hover:text-green-400"
                  )}>
                    {isSelected ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {multiSelect && selectedStudents.size > 0 && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-300 font-medium">
            {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected for attendance recording
          </p>
        </div>
      )}
    </div>
  );
}
