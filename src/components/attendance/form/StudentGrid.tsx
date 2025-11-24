import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { User } from '@supabase/supabase-js';

import { supabase } from '../../../integrations/supabase/client.ts';
import { Database } from '../../../integrations/supabase/types.ts';

import { Button } from '../../ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.tsx';
import { Checkbox } from '../../ui/checkbox.tsx';
import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { useI18n } from '@/contexts/I18nContext.tsx';

type Student = Database['public']['Tables']['students']['Row'];

async function fetchStudentsForUser(
  user: User | null,
  classId?: string,
  sectionFilter?: string,
): Promise<Student[]> {
  if (!user) {
    return [];
  }

  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('madrassah_id, role')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user data:', userError);
    throw new Error('Could not fetch user profile.');
  }

  if (!userData?.madrassah_id) {
    console.log('No madrassah_id found for this user.');
    return [];
  }

  if (userData.role === 'teacher') {
    // If classId is provided, fetch only that class; otherwise all teacher classes
    const query = supabase
      .from('classes')
      .select('id, current_students, teacher_ids');
    const { data: teacherClasses, error: classesError } = classId
      ? await query.eq('id', classId)
      : await query.contains('teacher_ids', [user.id]);
    
    if (classesError) {
      console.error('Error fetching teacher classes:', classesError);
      throw new Error('Failed to load classes for teacher.');
    }

    const teacherClassRows = (teacherClasses || []);
    // Verify teacher actually teaches the requested class
    if (classId) {
      type TeacherClass = { id: string };
      const cls = (teacherClassRows as TeacherClass[]).find((c) => c.id === classId);
      if (!cls) return [];
    }

    const studentIds = teacherClassRows
      .flatMap(c => c.current_students || [])
      .filter((id, index, self) => id && self.indexOf(id) === index);

    if (studentIds.length === 0) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('status', 'active') // Only fetch active students
      .in('id', studentIds);

    if (error) {
      console.error('Error fetching students for teacher:', error);
      throw new Error('Failed to load students for teacher.');
    }
    return data as Student[];
  }

  // Admin or other roles logic
  const { madrassah_id } = userData;
  let query = supabase
    .from('students')
    .select('id, name, section')
    .eq('madrassah_id', madrassah_id);

  if (sectionFilter && sectionFilter.trim()) {
    query = query.ilike('section', sectionFilter.trim());
  }

  // Filter by status 'active' for attendance
  query = query.eq('status', 'active');

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching students for user:', error);
    throw new Error('Failed to load students.');
  }
  return data as Student[];
}

export interface StudentGridProps {
  user: User | null;
  selectedStudents: Set<string>;
  onStudentSelect: (id: string) => void;
  onSelectAll: (students: Student[]) => void;
  classId?: string;
  stagedStatus?: string;
  dateYmd?: string; // YYYY-MM-DD selected date
  sectionFilter?: string | null;
}

export const StudentGrid = ({
  user,
  selectedStudents,
  onStudentSelect,
  onSelectAll,
  classId,
  stagedStatus,
  dateYmd,
  sectionFilter,
}: StudentGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useI18n();

  const { data: students = [], isLoading, isError, error } = useQuery<Student[]>({
    queryKey: ['students', user?.id, classId || null, sectionFilter || null],
    queryFn: () => fetchStudentsForUser(user, classId, sectionFilter || undefined),
    enabled: !!user,
  });

  const studentList: Student[] = Array.isArray(students) ? students : [];
  const filteredStudents = studentList.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch attendance records for the selected date to indicate taken attendance
  const ymd = dateYmd || new Date().toISOString().split('T')[0];
  const { data: attendanceRows = [] } = useQuery<{ student_id: string; status?: string; late_reason?: string | null; time?: string | null }[]>({
    queryKey: ['attendance-day', ymd, classId || null, user?.id],
    enabled: !!user && studentList.length > 0 && !!ymd,
    queryFn: async () => {
      // Limit to the displayed students only
      const ids = studentList.map(s => s.id);
      if (ids.length === 0) return [] as { student_id: string; status?: string; late_reason?: string | null; time?: string | null }[];
      const q = supabase
        .from('attendance')
        .select('student_id, status, late_reason, time')
        .eq('date', ymd)
        .in('student_id', ids);
      if (classId) q.eq('class_id', classId);
      const { data, error } = await q;
      if (error) {
        console.error('Error fetching attendance for grid indicators:', error);
        return [] as { student_id: string; status?: string; late_reason?: string | null; time?: string | null }[];
      }
      return (data || []) as { student_id: string; status?: string; late_reason?: string | null; time?: string | null }[];
    }
  });

  // Build maps of student_id -> status and -> time
  const statusMap: Record<string, string> = {};
  const timeMap: Record<string, string> = {};
  for (const r of (attendanceRows || [])) {
    if (r && r.student_id) {
      statusMap[r.student_id] = String(r.status || '').toLowerCase();
      if (r.time) timeMap[r.student_id] = String(r.time);
    }
  }

  // If a class is selected, fetch its start_time to compute lateness
  const { data: classRow } = useQuery<{ id: string; time_slots?: { start_time?: string | null }[] } | null>({
    queryKey: ['class-start', classId || null],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, time_slots')
        .eq('id', classId!)
        .maybeSingle();
      return (data || null) as { id: string; time_slots?: { start_time?: string | null }[] } | null;
    }
  });

  function parseStartTimeFromClass(row: { id: string; time_slots?: { start_time?: string | null }[] } | null): string | null {
    try {
      const slots = Array.isArray(row?.time_slots) ? row!.time_slots! : [];
      const first = slots?.[0];
      const hm = typeof first?.start_time === 'string' ? first.start_time : null;
      return hm && /\d{2}:\d{2}/.test(hm) ? hm : null;
    } catch {
      return null;
    }
  }

  function hmToMinutes(hm: string): number {
    const [h, m] = hm.split(':').map((v: string) => parseInt(v, 10));
    return (h || 0) * 60 + (m || 0);
  }

  function computeLateMinutes(attHm?: string, classHm?: string): number | null {
    if (!attHm || !classHm) return null;
    if (!/\d{2}:\d{2}/.test(attHm) || !/\d{2}:\d{2}/.test(classHm)) return null;
    const diff = hmToMinutes(attHm) - hmToMinutes(classHm);
    return diff > 0 ? diff : 0;
  }

  const classStartHm = classRow ? parseStartTimeFromClass(classRow) : null;

  function statusBadgeClasses(status?: string): string {
    switch ((status || "").toLowerCase()) {
      case "present":
        return "bg-emerald-100 text-emerald-700";
      case "absent":
        return "bg-red-100 text-red-700";
      case "late":
        return "bg-amber-100 text-amber-700";
      case "excused":
        return "bg-blue-100 text-blue-700";
      case "early_departure":
        return "bg-indigo-100 text-indigo-700";
      case "not_marked":
      case "not-marked":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
  }

  if (isError) {
    console.error(error);
    return <div className="flex justify-center items-center h-48 text-black"><AlertCircle className="mr-2"/> {t('pages.attendance.grid.error', 'Error loading students. See console for details.')}</div>;
  }

  if (!user) {
    return (
      <Card className="flex items-center justify-center h-48">
        <p className="text-black">{t('pages.attendance.grid.noUser', 'Could not identify user to fetch students.')}</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-black">{t('pages.attendance.grid.selectStudents', 'Select Students')}</CardTitle>
          <Button variant="outline" onClick={() => onSelectAll(studentList)}>
            {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? t('pages.attendance.grid.deselectAll', 'Deselect All') : t('pages.attendance.grid.selectAll', 'Select All')}
          </Button>
        </div>
        <Input
          placeholder={t('pages.attendance.grid.searchPlaceholder', 'Search students...')}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="text-black"
        />
      </CardHeader>
      <CardContent>
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`w-full p-3 border rounded-lg cursor-pointer transition-all flex items-center space-x-3 ${
                  selectedStudents.has(student.id)
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={student.id}
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => {
                      onStudentSelect(student.id);
                    }}
                  />
                  <Label htmlFor={student.id} className="text-black font-medium cursor-pointer">
                    {student.name}
                  </Label>
                  {statusMap[student.id] && (
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadgeClasses(statusMap[student.id])}`}>
                      {statusMap[student.id]}
                      {statusMap[student.id] === 'late' && (
                        (() => {
                          const mins = computeLateMinutes(timeMap[student.id], classStartHm || undefined);
                          const parts: string[] = [];
                          if (typeof mins === 'number' && mins > 0) parts.push(`${mins}m`);
                          if (timeMap[student.id]) parts.push(`${timeMap[student.id]}`);
                          return parts.length ? ` · ${parts.join(' · ')}` : '';
                        })()
                      )}
                    </span>
                  )}
                  {selectedStudents.has(student.id) && stagedStatus && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                      {stagedStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-black">
              {searchQuery ? t('pages.attendance.grid.noSearchResults', 'No students found for "{query}".').replace('{query}', searchQuery) : t('pages.attendance.grid.noStudents', 'No students found.')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}