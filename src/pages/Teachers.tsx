import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherDialog from "@/components/teachers/TeacherDialog.tsx";
import { AdminPageShell, AdminPrimaryBtn } from "@/components/admin/AdminPageShell.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { UserPlus } from "lucide-react";
import { LoadingState } from "@/components/teacher-portal/LoadingState.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useQuery } from "@tanstack/react-query";
import { Teacher } from "@/types/teacher.ts";
import { TeacherProfilesTab } from "@/components/teachers/TeacherProfilesTab.tsx";
import { TeacherStatsSection } from "@/components/teachers/TeacherStatsSection.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

/**
 * @file Teachers.tsx
 * @description This file defines the `Teachers` page component, which serves as a central hub for managing teacher profiles and accounts.
 * It provides functionality to view teacher statistics (total teachers, total students, active teachers, subject count), add new teachers, and edit existing teacher information.
 * The component uses a tabbed interface to switch between viewing teacher profiles and managing teacher accounts (though account management might be a placeholder or future feature based on `TeacherAccountsTab` usage).
 * It includes authentication checks to ensure a user session exists, redirecting to an authentication page if not.
 * Data fetching for teacher statistics is done using Tanstack Query, and a dialog (`TeacherDialog`) is used for adding or editing teacher details.
 * Loading states are handled to provide user feedback during data fetching and authentication checks.
 */

/**
 * @function Teachers
 * @description The main component for the Teacher Management Center page.
 * It handles displaying teacher statistics, managing teacher profiles and accounts via tabs,
 * and provides dialogs for adding or editing teacher information.
 * It also performs an authentication check on component mount.
 * @returns {JSX.Element} The rendered teacher management page.
 */
const Teachers = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profiles");
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: adminData } = useQuery({
    queryKey: ["adminDataForTeachersPage", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("Error fetching admin data:", error);
        throw error;
      }
      return data;
    },
    enabled: !!userId,
  });

  // Get teacher stats
  const { data: stats } = useQuery({
    queryKey: ["teacher-stats", adminData],
    /**
     * @function queryFn (for teacher stats)
     * @description Fetches statistics related to teachers and students from Supabase.
     * This includes total number of teachers, total students, number of active teachers (those with an email), and the count of unique subjects taught.
     * @async
     * @returns {Promise<object>} A promise that resolves to an object containing teacher and student statistics.
     * @property {number} totalTeachers - Total number of teachers.
     * @property {number} totalStudents - Total number of students.
     * @property {number} activeTeachers - Number of teachers with an email address (considered active).
     * @property {number} subjectCount - Number of unique subjects taught by teachers.
     * @property {number} totalClasses - Placeholder for total classes (currently 0).
     */
    queryFn: async () => {
      let teacherQuery = supabase
        .from("profiles")
        .select("id, name, email, role, subject, madrassah_id, bio, phone, experience")
        .eq("role", "teacher");

      let studentQuery = supabase
        .from("students")
        .select("id, madrassah_id");

      // Only filter by madrassah if the admin has one set
      if (adminData?.madrassah_id) {
        teacherQuery = teacherQuery.eq("madrassah_id", adminData.madrassah_id);
        studentQuery = studentQuery.eq("madrassah_id", adminData.madrassah_id);
      }

      const { data: teachers } = await teacherQuery;
      const { data: students } = await studentQuery;

      return {
        totalTeachers: teachers?.length || 0,
        totalStudents: students?.length || 0,
        activeTeachers: teachers?.filter((t) => t.email).length || 0,
        subjectCount: teachers
          ? new Set(teachers.map((t) => t.subject)).size
          : 0,
        totalClasses: 0, // Will be populated later
      };
    },
    enabled: true,
  });

  // Check authentication
  useEffect(() => {
    /**
     * @function checkAuth
     * @description Asynchronously checks if a user session exists using Supabase authentication.
     * If no session is found, it navigates the user to the /auth page.
     * It handles potential errors during authentication and displays a toast notification.
     * Sets loading state during the check.
     * @async
     * @returns {Promise<void>}
     */
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description:
            "Unable to verify your session. Please try logging in again.",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  /**
   * @function handleEditTeacher
   * @description Sets the selected teacher and opens the teacher dialog for editing.
   * @param {Teacher} teacher - The teacher object to be edited.
   * @input teacher - The teacher data to populate the edit dialog.
   * @output Opens the teacher editing dialog pre-filled with the selected teacher's information.
   * @returns {void}
   */
  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  /**
   * @function handleCreateTeacher
   * @description Clears any selected teacher and opens the teacher dialog for creating a new teacher.
   * @input None.
   * @output Opens the teacher dialog in "add new" mode.
   * @returns {void}
   */
  const handleCreateTeacher = () => {
    setSelectedTeacher(null);
    setDialogOpen(true);
  };

  /**
   * @function handleCloseDialog
   * @description Closes the teacher dialog and clears the selected teacher state.
   * @input None.
   * @output Closes the teacher dialog and resets selected teacher data.
   * @returns {void}
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTeacher(null);
  };

  /**
   * @section Render Logic
   * @description Renders the Teacher Management Center.
   * Displays a loading spinner if `isLoading` is true.
   * Otherwise, it shows the main layout with statistics, action buttons, and tabbed content for profiles and accounts.
   */
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <AdminPageShell
      title={t("pages.teachers.headerTitle")}
      subtitle={t("pages.teachers.headerDesc")}
      actions={
        <AdminPrimaryBtn onClick={handleCreateTeacher}>
          <UserPlus className="h-4 w-4" />
          {t("pages.teachers.addTeacher")}
        </AdminPrimaryBtn>
      }
    >
      <TeacherStatsSection stats={stats || undefined} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Tabs defaultValue="profiles" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-100 px-6 pt-5">
            <TabsList className="bg-gray-100 rounded-xl p-1 h-9">
              <TabsTrigger
                value="profiles"
                className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:text-green-800 data-[state=active]:shadow-sm"
              >
                {t("pages.teachers.tabProfiles")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="profiles" className="p-6">
            <TeacherProfilesTab
              onEditTeacher={handleEditTeacher}
              madrassahId={adminData?.madrassah_id}
            />
          </TabsContent>
        </Tabs>
      </div>

      {dialogOpen && adminData?.madrassah_id && (
        <TeacherDialog
          selectedTeacher={selectedTeacher}
          onClose={handleCloseDialog}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          madrassahId={adminData?.madrassah_id}
        />
      )}
    </AdminPageShell>
  );
};

export default Teachers;
