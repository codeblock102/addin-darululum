
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TeacherAccountsTable } from "@/components/admin/teacher-accounts/TeacherAccountsTable";
import { TeacherAccountsLoading } from "@/components/admin/teacher-accounts/TeacherAccountsLoading";
import { TeacherStatsCards } from "@/components/admin/teacher-accounts/TeacherStatsCards";
import { TeacherSearchAndFilters } from "@/components/admin/teacher-accounts/TeacherSearchAndFilters";
import { useTeacherAccounts } from "@/hooks/useTeacherAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function TeacherAccounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "7days" | "30days" | "inactive">("all");
  
  const { isAdmin, isLoading } = useUserRole();
  const { teachers, isLoadingTeachers, filterTeachers } = useTeacherAccounts();

  // Check if admin and redirect if not
  if (!isLoading && !isAdmin) {
    toast({
      title: "Access Denied",
      description: "Only administrators can access this page",
      variant: "destructive"
    });
    navigate("/");
    return null;
  }

  // Apply filters to teachers data
  const filteredTeachers = filterTeachers(teachers, searchQuery, statusFilter, activityFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader 
          title="Teacher Account Control Center" 
          description="Manage and monitor all teacher accounts in the system" 
        />
        
        {(isLoading || isLoadingTeachers) ? (
          <TeacherAccountsLoading />
        ) : (
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
    </DashboardLayout>
  );
}
