import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  ArrowLeft, BookOpen, FolderOpen, Heart, RefreshCw,
  Phone, Mail, Calendar, GraduationCap, User2, TrendingUp,
  BookMarked, Clock, CheckCircle2,
} from "lucide-react";
import { StudentProgressChart } from "@/components/students/StudentProgressChart.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { NewProgressEntry } from "@/components/students/NewProgressEntry.tsx";
import { StudentDossier } from "@/components/students/StudentDossier.tsx";
import { StudentHealthIEP } from "@/components/students/StudentHealthIEP.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { DhorBook } from "@/components/dhor-book/DhorBook.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useTeacherStatus } from "@/hooks/useTeacherStatus.ts";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  guardian_email: string | null;
  status: "active" | "inactive";
  grade?: string | null;
  section?: string | null;
  gender?: string | null;
  permanent_code?: string | null;
  health_card?: string | null;
  secondary_guardian_email?: string | null;
  street?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  class_ids?: string[] | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function capitalize(str: string) {
  return str
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { session } = useAuth();
  const { isAdmin } = useTeacherStatus();

  const { data: student, isLoading: studentLoading, error: studentError } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!id) throw new Error("Student ID is required");
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade, gender, section, class_ids, guardian_name, guardian_email, guardian_contact, secondary_guardian_email, permanent_code, health_card, date_of_birth, enrollment_date, street, city, province, postal_code, madrassah_id, created_at, status")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Student;
    },
    enabled: !!id,
  });

  const { data: userProfileData, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ["userProfileForStudentDetail", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: progressEntries, isLoading: progressLoading } = useQuery({
    queryKey: ["student-progress", id],
    queryFn: async () => {
      if (!id) throw new Error("Student ID is required");
      const { data, error } = await supabase
        .from("progress")
        .select("id, student_id, date, current_surah, current_ayah, memorization_quality, notes, teacher_id, pages_memorized")
        .eq("student_id", id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ["student-attendance-summary", id],
    queryFn: async () => {
      if (!id) return null;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);
      if (error) return null;
      const total = data?.length ?? 0;
      const present = data?.filter(r => r.status === "present" || r.status === "late").length ?? 0;
      return { total, rate: total > 0 ? Math.round((present / total) * 100) : null };
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (studentError) {
      toast({ title: "Error", description: "Failed to load student details.", variant: "destructive" });
      navigate("/students");
    }
  }, [studentError, navigate, toast]);

  // ── Loading skeleton ─────────────────────────────────────────────
  if (studentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
        <Button onClick={() => navigate("/students")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
        </Button>
      </div>
    );
  }

  const latestProgress = progressEntries?.[0];
  const totalEntries = progressEntries?.length ?? 0;
  const enrolledYear = student.enrollment_date
    ? new Date(student.enrollment_date).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-md"
        style={{ background: "linear-gradient(135deg, #0f4c35 0%, #1a6b4a 50%, #0f766e 100%)" }}>

        {/* Back button */}
        <button
          onClick={() => navigate("/students")}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white text-sm font-semibold transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Students
        </button>

        {/* Log Progress button */}
        <div className="absolute top-4 right-4">
          <NewProgressEntry
            studentId={student.id}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            studentName={student.name}
          />
        </div>

        <div className="px-6 pt-16 pb-7 flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-black/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg">
            {getInitials(student.name)}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">
              {student.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {student.section && (
                <span className="text-xs font-bold bg-black/20 text-white px-3 py-1 rounded-full">
                  {capitalize(student.section)}
                </span>
              )}
              {student.grade && (
                <span className="text-xs font-bold bg-black/20 text-white px-3 py-1 rounded-full">
                  Grade {student.grade}
                </span>
              )}
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                student.status === "active"
                  ? "bg-emerald-500/40 text-white"
                  : "bg-red-500/40 text-white"
              }`}>
                {student.status === "active" ? "✓ Active" : "Inactive"}
              </span>
              {enrolledYear && (
                <span className="text-xs font-semibold text-white/80 px-3 py-1 rounded-full bg-black/15">
                  Enrolled {enrolledYear}
                </span>
              )}
            </div>
          </div>

          {/* Quick contact strip */}
          <div className="flex flex-col gap-2 shrink-0 text-right">
            {student.guardian_name && (
              <div className="flex items-center gap-1.5 text-white text-sm font-bold justify-end">
                <User2 className="h-3.5 w-3.5 text-white/60" />
                <span>{student.guardian_name}</span>
              </div>
            )}
            {student.guardian_contact && (
              <a
                href={`tel:${student.guardian_contact}`}
                className="flex items-center gap-1.5 text-white text-sm font-semibold justify-end hover:text-white/80 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-white/60" />
                <span>{student.guardian_contact}</span>
              </a>
            )}
            {student.guardian_email && (
              <a
                href={`mailto:${student.guardian_email}`}
                className="flex items-center gap-1.5 text-white text-sm font-semibold justify-end hover:text-white/80 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-white/60" />
                <span className="truncate max-w-[200px]">{student.guardian_email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookMarked className="h-5 w-5" />}
          label="Progress Entries"
          value={totalEntries}
          sub={totalEntries === 1 ? "session logged" : "sessions logged"}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Latest Surah"
          value={latestProgress ? `Surah ${latestProgress.current_surah}` : "—"}
          sub={latestProgress?.date ? new Date(latestProgress.date).toLocaleDateString() : "No entries yet"}
          color="green"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Attendance (30d)"
          value={attendanceSummary?.rate != null ? `${attendanceSummary.rate}%` : "—"}
          sub={attendanceSummary?.total ? `${attendanceSummary.total} sessions` : "No records"}
          color="amber"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Date of Birth"
          value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—"}
          sub={student.date_of_birth ? `Age ${new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}` : "Not provided"}
          color="purple"
        />
      </div>

      {/* ── PROGRESS CHART ─────────────────────────────────── */}
      {!progressLoading && progressEntries && progressEntries.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <StudentProgressChart progress={progressEntries} />
          </CardContent>
        </Card>
      )}

      {/* ── TABS ───────────────────────────────────────────── */}
      <Tabs defaultValue="dhor-book" className="w-full">
        <TabsList className="h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-wrap gap-1">
          <TabsTrigger value="dhor-book" className="rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-1.5" />
            Progress Book
          </TabsTrigger>
          <TabsTrigger value="dossier" className="rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-sm">
            <FolderOpen className="w-4 h-4 mr-1.5" />
            Dossier
          </TabsTrigger>
          <TabsTrigger value="health" className="rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-sm">
            <Heart className="w-4 h-4 mr-1.5" />
            Health & IEP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dhor-book" className="mt-4">
          <DhorBook
            studentId={student.id}
            teacherId={session?.user?.id}
            teacherData={userProfileData}
            isAdmin={isAdmin}
            isLoadingTeacher={isLoadingUserProfile}
          />
        </TabsContent>

        <TabsContent value="dossier" className="mt-4">
          <StudentDossier studentId={student.id} student={student} />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <StudentHealthIEP studentId={student.id} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetail;
