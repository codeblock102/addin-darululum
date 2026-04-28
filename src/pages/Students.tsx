import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { StudentDialog } from "@/components/students/StudentDialog.tsx";
import { StudentList } from "@/components/students/StudentList.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PlusCircle, Search, Users, Activity, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import {
  AdminPageShell,
  AdminPrimaryBtn,
  AdminStatCard,
} from "@/components/admin/AdminPageShell.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  guardian_email?: string | null;
  status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated";
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg?: string;
  description: string;
  isLoading: boolean;
}

const StatCard = ({ title, value, icon, iconBg, description, isLoading }: StatCardProps) => (
  isLoading
    ? <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
    : <AdminStatCard label={title} value={value} icon={icon} iconBg={iconBg} meta={description} />
);

const Students = () => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["students", userId],
    queryFn: async () => {
      if (!userId) return { students: [], userData: null };

      const { data: userData } = await supabase
        .from("profiles")
        .select("madrassah_id, role")
        .eq("id", userId)
        .single();

      if (!userData?.madrassah_id) {
        return { students: [], userData };
      }

      if (userData.role === "admin") {
        const { data: students, error } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes",
          )
          .eq("madrassah_id", userData.madrassah_id);

        if (error) throw error;
        return { students: students || [], userData };
      }

      if (userData.role === "teacher") {
        const { data: teacherClasses, error: classesError } = await supabase
          .from("classes")
          .select("current_students")
          .contains("teacher_ids", `{${userId}}`);

        if (classesError) throw classesError;
        
        const studentIds = (teacherClasses || [])
          .flatMap(c => c.current_students || [])
          .filter((id, index, self) => id && self.indexOf(id) === index);

        if (studentIds.length === 0) {
          return { students: [], userData };
        }

        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select(
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes",
          )
          .in("id", studentIds);
        
        if (studentsError) throw studentsError;
        return { students: students || [], userData };
      }

      return { students: [], userData };
    },
    enabled: !!userId,
  });

  const isAdmin = data?.userData?.role === "admin";
  const isTeacher = data?.userData?.role === "teacher";
  const students = data?.students || [];
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "active").length;
  const inactiveStudents = totalStudents - activeStudents;

  const uniqueSections = Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort();

  const filteredStudents = students.filter(
    (student) => {
      const sectionMatch =
        selectedSection === "all"
          ? true
          : selectedSection === "unassigned"
          ? !student.section
          : student.section === selectedSection;

      const searchMatch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.guardian_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      return sectionMatch && searchMatch;
    }
  );

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedStudent(null);
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["students", userId] });
  };

  return (
    <AdminPageShell
      title={t("pages.students.title")}
      subtitle={t("pages.students.subtitle")}
      icon={<Users className="h-5 w-5 text-green-700" />}
      iconBg="bg-green-50"
      actions={
        (isAdmin || isTeacher) ? (
          <AdminPrimaryBtn onClick={handleAddStudent}>
            <PlusCircle className="h-4 w-4" />
            {t("pages.students.add")}
          </AdminPrimaryBtn>
        ) : undefined
      }
    >
      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("pages.students.statsTotal")}
          value={totalStudents}
          description={`${activeStudents} ${t("pages.students.statsActive").toLowerCase()}`}
          icon={<Users className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-50"
          isLoading={isLoading}
        />
        <StatCard
          title={t("pages.students.statsActive")}
          value={activeStudents}
          description={`${((activeStudents / totalStudents) * 100 || 0).toFixed(0)}% of students`}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          iconBg="bg-green-50"
          isLoading={isLoading}
        />
        <StatCard
          title={t("pages.students.statsInactive")}
          value={inactiveStudents}
          description={`${((inactiveStudents / totalStudents) * 100 || 0).toFixed(0)}% of students`}
          icon={<Activity className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-50"
          isLoading={isLoading}
        />
      </div>

      {/* Student list card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{t("pages.students.allStudents")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("pages.students.allStudentsDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder={t("pages.students.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white h-10"
              />
            </div>
            {isAdmin && uniqueSections.length > 0 && (
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-gray-200 h-10">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="unassigned">No Section</SelectItem>
                  {uniqueSections.map((section) => (
                    <SelectItem key={section as string} value={section as string}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="p-0">
          <StudentList
            students={filteredStudents}
            isLoading={isLoading}
            onEditStudent={handleEditStudent}
          />
        </div>
      </div>

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseDialog}
        madrassahId={data?.userData?.madrassah_id}
      />
    </AdminPageShell>
  );
};

export default Students;
