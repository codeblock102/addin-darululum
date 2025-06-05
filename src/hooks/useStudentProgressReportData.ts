import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentProgressReportData, ProgressEntry, SabaqParaEntry, JuzRevisionEntry, AttendanceEntry } from '@/types/reports';
import { Student } from '@/types/student';
import { format, isValid } from 'date-fns';

export const useStudentProgressReportData = (reportDate: Date | undefined) => {
  const formattedReportDate = reportDate && isValid(reportDate) ? format(reportDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  return useQuery<
    StudentProgressReportData[], 
    Error,
    StudentProgressReportData[],
    [string, string] // QueryKey type
  > ({
    queryKey: ['studentProgressReportData', formattedReportDate],
    queryFn: async () => {
      let studentsToProcess: Student[] = [];

      // Attempt 1: Fetch with guardian_email
      const { data: studentsWithEmailData, error: errorWithEmail } = await supabase
        .from('students')
        .select('id, name, status, guardian_email') // Student type includes guardian_email as optional
        .eq('status', 'active');

      if (errorWithEmail) {
        console.error('Error fetching students (with guardian_email attempt):', errorWithEmail.message);
        // Check if the error is specifically about the guardian_email column
        if (errorWithEmail.message.includes("column") && errorWithEmail.message.includes("guardian_email") && errorWithEmail.message.includes("does not exist")) {
          console.warn("'guardian_email' column likely does not exist in 'students' table. Retrying without it.");
          
          // Attempt 2: Fetch without guardian_email
          const { data: studentsWithoutEmailData, error: errorWithoutEmail } = await supabase
            .from('students')
            .select('id, name, status') // Only select fields known to exist for sure
            .eq('status', 'active');

          if (errorWithoutEmail) {
            console.error('Error fetching students (retry without guardian_email):', errorWithoutEmail.message);
            throw errorWithoutEmail; // Rethrow critical error from retry
          }
          // Ensure guardian_email is explicitly null if not fetched
          studentsToProcess = (studentsWithoutEmailData || []).map(s => ({ ...s, guardian_email: null })) as Student[];
        } else {
          throw errorWithEmail; // Other critical error, rethrow
        }
      } else {
        // Success with guardian_email (or it was null but column exists)
        studentsToProcess = (studentsWithEmailData || []) as Student[];
      }

      if (studentsToProcess.length === 0) {
        console.log("No active students found or an issue occurred before processing.");
        return []; 
      }
      
      return processStudentData(studentsToProcess, formattedReportDate);
    },
    enabled: !!reportDate && isValid(reportDate), 
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
  });
};

// Helper function to process student data and fetch related progress
async function processStudentData(students: Student[], formattedReportDate: string): Promise<StudentProgressReportData[]> {
  const reportDataPromises = students.map(async (student) => {
    const studentId = student.id;

    // 2. Fetch latest sabaq (progress table)
    const { data: sabaqEntries, error: sabaqError } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', formattedReportDate)
      .order('created_at', { ascending: false }); 
    
    if (sabaqError) console.error(`Error fetching sabaq for ${studentId} on ${formattedReportDate}:`, sabaqError.message);
    const latestSabaq = sabaqEntries?.[0] as ProgressEntry | undefined;

    // 3. Fetch latest sabaq_para
    const { data: sabaqParaEntries, error: sabaqParaError } = await supabase
      .from('sabaq_para')
      .select('*')
      .eq('student_id', studentId)
      .eq('revision_date', formattedReportDate)
      .order('created_at', { ascending: false });

    if (sabaqParaError) console.error(`Error fetching sabaq_para for ${studentId} on ${formattedReportDate}:`, sabaqParaError.message);
    const latestSabaqPara = sabaqParaEntries?.[0] as SabaqParaEntry | undefined;

    // 4. Fetch dhor (juz_revisions)
    const { data: dhorEntries, error: dhorError } = await supabase
      .from('juz_revisions')
      .select('*')
      .eq('student_id', studentId)
      .eq('revision_date', formattedReportDate)
      .order('dhor_slot', { ascending: true });
    
    if (dhorError) console.error(`Error fetching dhor for ${studentId} on ${formattedReportDate}:`, dhorError.message);
    const dhorRevisions = dhorEntries as JuzRevisionEntry[] | undefined;

    // 5. Fetch attendance
    const { data: attendanceEntries, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', formattedReportDate)
      .order('created_at', { ascending: false });
    
    if (attendanceError) console.error(`Error fetching attendance for ${studentId} on ${formattedReportDate}:`, attendanceError.message);
    const latestAttendance = attendanceEntries?.[0] as AttendanceEntry | undefined;

    return {
      student_id: student.id,
      student_name: student.name,
      guardian_email: student.guardian_email ?? null, 
      report_date: formattedReportDate,
      sabaq_current_juz: latestSabaq?.current_juz ?? null,
      sabaq_current_surah: latestSabaq?.current_surah ?? null,
      sabaq_start_ayat: latestSabaq?.start_ayat ?? null,
      sabaq_end_ayat: latestSabaq?.end_ayat ?? null,
      sabaq_memorization_quality: latestSabaq?.memorization_quality ?? null,
      sabaq_comments: latestSabaq?.comments ?? null,
      sabaq_para_juz: latestSabaqPara?.juz ?? null,
      sabaq_para_number: latestSabaqPara?.para_number ?? null,
      sabaq_para_pages_revised: latestSabaqPara?.pages_revised ?? null,
      sabaq_para_teacher_notes: latestSabaqPara?.teacher_notes ?? null,
      dhor_juz_revisions: dhorRevisions?.map(d => ({
        juz_number: d.juz_number,
        dhor_type: d.dhor_type ?? null,
        lines_memorized: d.lines_memorized ?? null,
        teacher_comments: d.teacher_comments ?? null,
        revision_quality: d.revision_quality ?? null,
        dhor_slot: d.dhor_slot ?? null,
      })) ?? null,
      attendance_status: latestAttendance?.status ?? 'not-marked',
      attendance_notes: latestAttendance?.notes ?? null,
    } as StudentProgressReportData;
  });

  return Promise.all(reportDataPromises);
} 