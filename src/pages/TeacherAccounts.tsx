/**
 * @file TeacherAccounts.tsx
 * @description This file defines the `TeacherAccounts` page component, which is an administrative interface for managing teacher accounts.
 * It allows administrators to view a list of all teacher accounts, see statistics about these accounts (e.g., total, active, recently active),
 * search for specific teachers, and filter them based on their account status (all, active, suspended) and activity level (all, last 7 days, last 30 days, inactive).
 * The component ensures that only users with an administrator role can access this page; others are redirected.
 * It utilizes several sub-components for displaying the header, statistics cards, search/filter controls, and the main table of teacher accounts.
 * Data fetching for teacher accounts and user role verification is handled by custom hooks (`useTeacherAccounts`, `useUserRole`).
 * Loading states are managed to provide feedback to the user while data is being fetched.
 */
import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader.tsx";
import { TeacherAccountsTable } from "@/components/admin/teacher-accounts/TeacherAccountsTable.tsx";
import { TeacherAccountsLoading } from "@/components/admin/teacher-accounts/TeacherAccountsLoading.tsx";
import { TeacherStatsCards } from "@/components/admin/teacher-accounts/TeacherStatsCards.tsx";
import { TeacherSearchAndFilters } from "@/components/admin/teacher-accounts/TeacherSearchAndFilters.tsx";
import { useTeacherAccounts } from "@/hooks/useTeacherAccounts.ts";
import { useUserRole } from "@/hooks/useUserRole.ts";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast.ts";

/**
 * @function TeacherAccounts
 * @description The main component for the Teacher Account Control Center page.
 * It handles fetching, filtering, and displaying teacher account data.
 * It includes role-based access control, redirecting non-admin users.
 * It provides search and filter functionality for the teacher accounts list.
 * @returns {JSX.Element | null} The rendered teacher accounts management page, or null if the user is not an admin.
 */
export default function TeacherAccounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");
  const [activityFilter, setActivityFilter] = useState<
    "all" | "7days" | "30days" | "inactive"
  >("all");

  const { isAdmin, isLoading } = useUserRole();
  const { teachers, isLoadingTeachers, filterTeachers } = useTeacherAccounts();

  // Check if admin and redirect if not
  if (!isLoading && !isAdmin) {
    toast({
      title: "Access Denied",
      description: "Only administrators can access this page",
      variant: "destructive",
    });
    navigate("/");
    return null;
  }

  // Apply filters to teachers data
  const filteredTeachers = filterTeachers(
    teachers,
    searchQuery,
    statusFilter,
    activityFilter,
  );

  /**
   * @section Render Logic
   * @description Determines what to render based on loading states and admin privileges.
   * If data is loading, it shows a loading component.
   * If the user is an admin and data is loaded, it displays the teacher account management interface.
   */
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Teacher Account Control Center"
        description="Manage and monitor all teacher accounts in the system"
      />

      {(isLoading || isLoadingTeachers) ? <TeacherAccountsLoading /> : (
        <>
          {/* Stats Cards */}
          <TeacherStatsCards teachers={teachers} />

          {/* Search and Filter Controls */}
          <TeacherSearchAndFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            activityFilter={activityFilter}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onActivityFilterChange={setActivityFilter}
          />

          {/* Teacher Accounts Table */}
          <TeacherAccountsTable teachers={filteredTeachers} />
        </>
      )}
    </div>
  );
}
