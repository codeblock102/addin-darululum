
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AttendanceFormValues } from '@/types/attendance-form';
import { StudentGridProps, Student } from './student-grid/types';
import { useStudentsQuery } from './student-grid/useStudentsQuery';
import { NoClassSelectedState, NoStudentsState, NoSearchResultsState } from './student-grid/EmptyStates';
import { StudentGridLoadingState } from './student-grid/LoadingState';
import { SearchBar } from './student-grid/SearchBar';
import { StudentGridHeader } from './student-grid/StudentGridHeader';
import { StudentCard } from './student-grid/StudentCard';

export function StudentGrid({ 
  form, 
  selectedClassId, 
  multiSelect = false, 
  selectedStudents = new Set(), 
  onStudentSelect 
}: StudentGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedStudentId = form.watch('student_id');

  const studentsQuery = useStudentsQuery(selectedClassId);
  const { data: students, isLoading } = studentsQuery;

  // Filter students based on search query
  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStudentClick = (student: Student) => {
    if (multiSelect && onStudentSelect) {
      onStudentSelect(student.id);
    } else {
      form.setValue('student_id', student.id);
    }
  };

  if (!selectedClassId) {
    return <NoClassSelectedState />;
  }

  if (isLoading) {
    return <StudentGridLoadingState />;
  }

  if (!students?.length) {
    return <NoStudentsState />;
  }

  return (
    <div className="space-y-6">
      <StudentGridHeader studentsCount={filteredStudents.length} multiSelect={multiSelect} />

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const isSelected = multiSelect 
            ? selectedStudents.has(student.id)
            : selectedStudentId === student.id;

          return (
            <StudentCard
              key={student.id}
              student={student}
              isSelected={isSelected}
              onClick={() => handleStudentClick(student)}
            />
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

      {searchQuery && filteredStudents.length === 0 && (
        <NoSearchResultsState searchQuery={searchQuery} />
      )}
    </div>
  );
}
