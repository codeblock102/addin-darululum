import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherDialog from "@/components/teachers/TeacherDialog.tsx";
// import { AdminHeader } from "@/components/admin/AdminHeader.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Loader2, UserPlus } from "lucide-react";
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

  const { data: adminData, isLoading: isAdminDataLoading } = useQuery({
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
      if (!adminData?.madrassah_id) return null;

      const { data: teachers } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .eq("madrassah_id", adminData.madrassah_id);

      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("madrassah_id", adminData.madrassah_id);

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
    enabled: !!adminData,
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("pages.teachers.headerTitle")}</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-lg">{t("pages.teachers.headerDesc")}</p>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium shadow-sm transition-all duration-200 self-start"
              onClick={handleCreateTeacher}
              disabled={isAdminDataLoading}
            >
              <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t("pages.teachers.addTeacher")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <TeacherStatsSection stats={stats || undefined} />

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Tabs
            defaultValue="profiles"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b border-gray-200 px-4 sm:px-6 pt-4 sm:pt-6">
              <TabsList className="w-full sm:w-auto bg-gray-50 border border-gray-200 p-1 h-10 sm:h-12 rounded-lg overflow-x-auto">
                <TabsTrigger 
                  value="profiles" 
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all duration-200 px-4 sm:px-8 rounded-md text-sm sm:text-base"
                >
                  {t("pages.teachers.tabProfiles")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profiles Tab */}
            <TabsContent value="profiles" className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
              <TeacherProfilesTab
                onEditTeacher={handleEditTeacher}
                madrassahId={adminData?.madrassah_id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Teacher Dialog Modal */}
      {dialogOpen && adminData?.madrassah_id && (
        <TeacherDialog
          selectedTeacher={selectedTeacher}
          onClose={handleCloseDialog}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          madrassahId={adminData?.madrassah_id}
        />
      )}
    </div>
  );
};

export default Teachers;
