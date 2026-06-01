import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { StudentDialog } from "@/components/students/StudentDialog.tsx";
import { StudentList } from "@/components/students/StudentList.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Filter, Plus, Search, Upload } from "lucide-react";
import { LottiePlayer } from "@/components/ui/lottie-player.tsx";
import { PageGuide } from "@/components/ui/page-guide.tsx";
import { QuickActions } from "@/components/ui/quick-actions.tsx";
import emptyStudents from "@/assets/lottie/empty-students.json";
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
import { Button } from "@/components/ui/button.tsx";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { StatCard } from "@/components/ui/stat-card.tsx";

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
  photo_url?: string | null;
}

const Students = () => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
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
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes, photo_url",
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
            "id, name, date_of_birth, enrollment_date, guardian_name, guardian_contact, guardian_email, status, madrassah_id, section, medical_condition, gender, grade, health_card, permanent_code, street, city, province, postal_code, completed_juz, current_juz, status_start_date, status_end_date, status_notes, photo_url",
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

  const STATUS_FILTERS: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "vacation", label: "Vacation" },
    { value: "hospitalized", label: "Hospitalized" },
    { value: "suspended", label: "Suspended" },
    { value: "graduated", label: "Graduated" },
  ];

  const filteredStudents = students.filter(
    (student) => {
      const sectionMatch =
        selectedSection === "all"
          ? true
          : selectedSection === "unassigned"
          ? !student.section
          : student.section === selectedSection;

      const statusMatch =
        selectedStatus === "all" || student.status === selectedStatus;

      const searchMatch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.guardian_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      return sectionMatch && statusMatch && searchMatch;
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
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <PageHeader
        title={t("pages.students.title")}
        description={t("pages.students.subtitle")}
        actions={
          (isAdmin || isTeacher) ? (
            <Button onClick={handleAddStudent}>
              <Plus className="h-4 w-4 mr-2" />
              {t("pages.students.add")}
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-6 p-4 lg:p-8">
      <PageGuide
        id="students:intro"
        title="Manage your students"
        body="Search, filter, or add a new student above."
      />
      <QuickActions
        className="mt-3"
        actions={[
          { id: 'add', label: 'Add Student', icon: <Plus className="h-4 w-4"/>, onClick: () => setIsDialogOpen(true) },
          { id: 'bulk', label: 'Bulk Import', icon: <Upload className="h-4 w-4"/>, onClick: () => {} },
          { id: 'filter', label: 'Show Inactive', icon: <Filter className="h-4 w-4"/>, onClick: () => setSelectedStatus('inactive') },
        ]}
      />
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              index={0}
              label={t("pages.students.statsTotal")}
              value={totalStudents}
              hint={`${activeStudents} ${t("pages.students.statsActive").toLowerCase()}`}
              tone="default"
            />
            <StatCard
              index={1}
              label={t("pages.students.statsActive")}
              value={activeStudents}
              hint={`${totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% of students`}
              tone="success"
            />
            <StatCard
              index={2}
              label={t("pages.students.statsInactive")}
              value={inactiveStudents}
              hint={`${totalStudents > 0 ? 100 - Math.round((activeStudents / totalStudents) * 100) : 0}% of students`}
              tone="warning"
            />
          </>
        )}
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
          <div className="inline-flex items-center gap-1.5 flex-wrap mt-3">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={
                  selectedStatus === filter.value
                    ? "px-3 py-1 rounded-full text-xs font-medium bg-green-700 text-white shadow-sm transition-colors"
                    : "px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 bg-white border border-gray-200 transition-colors"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-0">
          {!isLoading && filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <LottiePlayer src={emptyStudents} className="w-40 h-40" loop />
              <p className="text-muted-foreground text-sm">No students match your filters.</p>
            </div>
          ) : (
            <StudentList
              students={filteredStudents}
              isLoading={isLoading}
              onEditStudent={handleEditStudent}
            />
          )}
        </div>
      </div>

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStudent={selectedStudent}
        onClose={handleCloseDialog}
        madrassahId={data?.userData?.madrassah_id}
      />
      </div>
    </div>
  );
};

export default Students;
