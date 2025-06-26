import { useState } from "react";
import { TeacherAccountsTable } from "@/components/admin/teacher-accounts/TeacherAccountsTable";
import { TeacherAccountsLoading } from "@/components/admin/teacher-accounts/TeacherAccountsLoading";
import { useTeacherAccounts } from "@/hooks/useTeacherAccounts";
import { Card } from "@/components/ui/card";
import { TeacherAccountSearch } from "@/components/admin/teacher-accounts/TeacherAccountSearch";
import { TeacherAccountFilters } from "@/components/admin/teacher-accounts/TeacherAccountFilters";

export function TeacherAccountsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");
  const [activityFilter, setActivityFilter] = useState<
    "all" | "7days" | "30days" | "inactive"
  >("all");

  const { teachers, isLoadingTeachers, filterTeachers } = useTeacherAccounts();

  // Apply filters to teachers data
  const filteredTeachers = filterTeachers(
    teachers,
    searchQuery,
    statusFilter,
    activityFilter,
  );

  if (isLoadingTeachers) {
    return <TeacherAccountsLoading />;
  }

  return (
    <Card className="bg-card border rounded-lg shadow">
      <div className="p-4 space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <TeacherAccountSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          <div className="w-full md:w-1/3">
            <TeacherAccountFilters
              statusFilter={statusFilter}
              activityFilter={activityFilter}
              onStatusFilterChange={setStatusFilter}
              onActivityFilterChange={setActivityFilter}
            />
          </div>
        </div>

        {/* Teacher Accounts Table */}
        <TeacherAccountsTable teachers={filteredTeachers} />
      </div>
    </Card>
  );
}
