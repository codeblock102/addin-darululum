import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";

// Standard student fields for list views
const STANDARD_STUDENT_FIELDS = "id, name, enrollment_date, status, date_of_birth, guardian_name, guardian_contact, madrassah_id, section, medical_condition";

// Extended student fields for detailed views
const EXTENDED_STUDENT_FIELDS = "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes";

export interface Student {
  id: string;
  name: string;
  enrollment_date: string | null;
  status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated";
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  guardian_email?: string | null;
  madrassah_id: string | null;
  section: string | null;
  medical_condition: string | null;
  gender?: string | null;
  grade?: string | null;
  health_card?: string | null;
  permanent_code?: string | null;
  street?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  completed_juz?: number[];
  current_juz?: number | null;
  status_start_date?: string | null;
  status_end_date?: string | null;
  status_notes?: string | null;
}

export interface UseStudentsQueryOptions {
  /** Filter to only active students */
  activeOnly?: boolean;
  /** Use extended fields for detailed student data */
  extendedFields?: boolean;
  /** Custom query key suffix */
  queryKeySuffix?: string;
  /** Override user ID (for admin viewing specific teacher's students) */
  overrideUserId?: string;
  /** Force admin mode (view all students in madrassah) */
  forceAdminMode?: boolean;
}

interface UserData {
  madrassah_id: string | null;
  role: string | null;
}

interface StudentsQueryResult {
  students: Student[];
  userData: UserData | null;
  isAdmin: boolean;
  isTeacher: boolean;
}

/**
 * Unified hook for fetching students based on user role.
 * - Admins see all students in their madrassah
 * - Teachers see students from their assigned classes
 */
export function useStudentsQuery(options: UseStudentsQueryOptions = {}) {
  const { session } = useAuth();
  const userId = options.overrideUserId || session?.user?.id;
  const {
    activeOnly = false,
    extendedFields = false,
    queryKeySuffix = "",
    forceAdminMode = false,
  } = options;

  const fields = extendedFields ? EXTENDED_STUDENT_FIELDS : STANDARD_STUDENT_FIELDS;

  const queryKey = ["students", userId, activeOnly, extendedFields, queryKeySuffix, forceAdminMode].filter(Boolean);

  const query = useQuery<StudentsQueryResult>({
    queryKey,
    queryFn: async (): Promise<StudentsQueryResult> => {
      if (!userId) {
        return { students: [], userData: null, isAdmin: false, isTeacher: false };
      }

      // Get user profile
      const { data: userData } = await supabase
        .from("profiles")
        .select("madrassah_id, role")
        .eq("id", userId)
        .single();

      if (!userData?.madrassah_id) {
        return { students: [], userData, isAdmin: false, isTeacher: false };
      }

      const isAdmin = userData.role === "admin" || forceAdminMode;
      const isTeacher = userData.role === "teacher";

      // Admin: fetch all students in madrassah
      if (isAdmin) {
        let query = supabase
          .from("students")
          .select(fields)
          .eq("madrassah_id", userData.madrassah_id);

        if (activeOnly) {
          query = query.eq("status", "active");
        }

        const { data: students, error } = await query;

        if (error) {
          console.error("Error fetching students for admin:", error);
          throw error;
        }

        return {
          students: (students as Student[]) || [],
          userData,
          isAdmin: true,
          isTeacher: false,
        };
      }

      // Teacher: fetch students from assigned classes
      if (isTeacher) {
        const { data: teacherClasses, error: classesError } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", `{${userId}}`);

        if (classesError) {
          console.error("Error fetching teacher classes:", classesError);
          throw classesError;
        }

        const studentIds = (teacherClasses || [])
          .flatMap((c) => c.current_students || [])
          .filter((id, index, self) => id && self.indexOf(id) === index);

        if (studentIds.length === 0) {
          return { students: [], userData, isAdmin: false, isTeacher: true };
        }

        let query = supabase
          .from("students")
          .select(fields)
          .in("id", studentIds);

        if (activeOnly) {
          query = query.eq("status", "active");
        }

        const { data: students, error: studentsError } = await query;

        if (studentsError) {
          console.error("Error fetching students for teacher:", studentsError);
          throw studentsError;
        }

        return {
          students: (students as Student[]) || [],
          userData,
          isAdmin: false,
          isTeacher: true,
        };
      }

      return { students: [], userData, isAdmin: false, isTeacher: false };
    },
    enabled: !!userId,
  });

  return {
    students: query.data?.students || [],
    userData: query.data?.userData || null,
    isAdmin: query.data?.isAdmin || false,
    isTeacher: query.data?.isTeacher || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Helper to get unique student IDs from teacher's classes
 */
export async function getTeacherStudentIds(teacherId: string): Promise<string[]> {
  const { data: teacherClasses, error } = await supabase
    .from("classes")
    .select("current_students")
    .contains("teacher_ids", `{${teacherId}}`);

  if (error) {
    console.error("Error fetching teacher classes:", error);
    return [];
  }

  return (teacherClasses || [])
    .flatMap((c) => c.current_students || [])
    .filter((id, index, self) => id && self.indexOf(id) === index);
}
