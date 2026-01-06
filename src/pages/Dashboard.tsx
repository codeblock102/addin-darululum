/**
 * @file src/pages/Dashboard.tsx
 * @summary This file defines the main Dashboard page, which serves as a unified landing page for both Admins and Teachers.
 *
 * The component dynamically renders content based on the user's role (Admin or Teacher).
 * - For Admins: It displays a tabbed interface with "Overview", "Analytics", and "Messages" sections.
 *   The "Overview" tab includes general admin statistics and a view of the Teacher Dashboard (in admin mode).
 * - For Teachers: It primarily renders the `TeacherDashboard` component, displaying teacher-specific information and tools.
 *
 * Key Functionalities:
 * - Role-based rendering using `useRBAC` hook.
 * - Fetches teacher-specific profile data using `useQuery` if the user is a teacher.
 * - Includes logic to handle cases where a teacher profile might not be found or if access is denied.
 * - Provides loading states while data or role information is being fetched.
 * - Admin view includes an `AdminHeader`, `DashboardStats`, `AdminDashboardTabs`, and `AdminMessaging` components.
 * - Uses `DashboardLayout` for the overall page structure.
 */
import { useAuth } from "@/hooks/use-auth.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { TeacherDashboard } from "@/components/teacher-portal/TeacherDashboard.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { LoadingState } from "@/components/teacher-portal/LoadingState.tsx";
import { AccessDenied } from "@/components/teacher-portal/AccessDenied.tsx";
import { ProfileNotFound } from "@/components/teacher-portal/ProfileNotFound.tsx";
import { Teacher } from "@/types/teacher.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";

/**
 * @component Dashboard
 * @description The main dashboard page component.
 *
 * This component acts as a router for displaying different dashboard views based on user role.
 * For admins, it provides a tabbed interface with admin-specific sections and an embedded view of the teacher portal.
 * For teachers, it displays their specific dashboard.
 *
 * State Management:
 *  - Uses React Query for server state management - no local state needed for data fetching.
 *
 * Hooks:
 *  - `useAuth`: To get the current session and refreshSession function.
 *  - `useToast`: To display notifications.
 *  - `useRBAC`: To determine if the user is a teacher, admin, and the role loading state.
 *  - `useQuery`: To fetch the teacher's profile data if the user is not an admin.
 *  - `useQueryClient`: To invalidate queries when manual refresh is needed.
 *
 * Conditional Rendering Logic:
 *  - Shows a `LoadingState` if role/profile data is being fetched (for non-admins).
 *  - If the user is an Admin:
 *    - Renders an admin-specific layout with tabs for "Overview", "Analytics", and "Messages".
 *    - The "Overview" tab includes admin stats and an embedded `TeacherDashboard` with a mock admin profile.
 *  - If the user is a Teacher (and data is loaded):
 *    - Renders the `TeacherDashboard` with their profile data.
 *  - If a non-admin user's teacher profile is not found:
 *    - Renders the `ProfileNotFound` component.
 *  - If a user is neither an admin nor a teacher (after checks complete):
 *    - Renders an `AccessDenied` component.
 *  - A fallback `LoadingState` is shown if none of the above conditions are met, covering edge cases.
 *
 * @returns {JSX.Element} The rendered dashboard page, tailored to the user's role and data.
 */
const Dashboard = () => {
  const { session, refreshSession } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTeacher, isAdmin, isLoading: isRoleLoading } = useRBAC();

  // Fetch teacher profile data - useQuery handles caching and refetching automatically
  const {
    data: teacherData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teacher-profile", session?.user?.email],
    /**
     * @function queryFn (for useQuery)
     * @description Fetches the teacher profile from the 'teachers' table based on the session user's email.
     * This query is disabled for admin users.
     * @async
     * @returns {Promise<Teacher | null>} The teacher's profile data or null if not found or if admin.
     * @throws Will throw an error if the Supabase query fails.
     */
    queryFn: async () => {
      if (!session?.user?.email) return null;

      // Skip the query for admin users
      if (isAdmin) {
        console.log("Admin user, skipping teacher profile query");
        return null;
      }

      console.log("Fetching teacher profile for email:", session.user.email);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, subject, email, bio, phone")
        .eq("email", session.user.email)
        .limit(1);

      if (error) {
        console.error("Error fetching teacher profile:", error);
        throw error;
      }

      // Handle potential duplicate records gracefully
      const profileData = data && data.length > 0 ? data[0] : null;
      
      if (data && data.length > 1) {
        console.warn(`Warning: Found ${data.length} profiles for email ${session.user.email}. Using the first one.`, data);
      }

      console.log("Teacher profile fetch result:", profileData);
      return profileData ? (profileData as unknown as Teacher) : null;
    },
    enabled: !!session?.user?.email && !isAdmin, // Only enabled for non-admin users
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Disable automatic refetch on window focus
  });

  /**
   * @function handleRefresh
   * @description Manually triggers a refresh of the session and teacher profile data.
   * Uses queryClient.invalidateQueries instead of refreshKey pattern for cleaner state management.
   * @async
   */
  const handleRefresh = async () => {
    await refreshSession();
    // Invalidate and refetch teacher profile query
    await queryClient.invalidateQueries({ queryKey: ["teacher-profile", session?.user?.email] });
  };

  if (error) {
    console.error("Error loading teacher profile:", error);
    toast({
      title: "Error loading profile",
      description:
        "Could not load your teacher profile. Please try again later.",
      variant: "destructive",
    });
    // Optionally, return an error component here if needed
  }

  // Show loading state while checking roles or fetching teacher data
  if ((isLoading || isRoleLoading) && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoadingState />
        </div>
      </div>
    );
  }

  // If user is admin, they should be able to view the teacher portal with a generic profile
  if (isAdmin) {
    const adminViewProfile: Teacher = {
      id: session?.user?.id ?? "fallback-admin-id",
      name: "Admin View",
      subject: "Administration",
      email: session?.user?.email || "admin@example.com",
      bio: "Viewing the teacher portal as an administrator",
      phone: "",
    };

    return <TeacherDashboard teacher={adminViewProfile} isAdmin={true} />;
  }

  // Show profile not found if teacher data is missing (for non-admin users)
  if (!teacherData && !isLoading && !isRoleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <ProfileNotFound
            email={session?.user?.email}
            onRefresh={handleRefresh}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    );
  }

  if (!isTeacher && !isAdmin && !isRoleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AccessDenied />
        </div>
      </div>
    );
  }

  if (teacherData && isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TeacherDashboard teacher={teacherData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoadingState />
      </div>
    </div>
  );
};

export default Dashboard;
