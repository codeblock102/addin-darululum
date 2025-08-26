import { useState } from "react";
import { TeacherAccountsTable } from "@/components/admin/teacher-accounts/TeacherAccountsTable";
import { TeacherAccountsLoading } from "@/components/admin/teacher-accounts/TeacherAccountsLoading";
import { useTeacherAccounts } from "@/hooks/useTeacherAccounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherAccountSearch } from "@/components/admin/teacher-accounts/TeacherAccountSearch";
import { TeacherAccountFilters } from "@/components/admin/teacher-accounts/TeacherAccountFilters";
import { Users, Shield, Activity } from "lucide-react";

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-gray-600 mt-1">
            Manage teacher accounts, permissions, and access controls
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search Teachers
              </label>
              <TeacherAccountSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            
            {/* Filters */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status Filter
                </label>
                <TeacherAccountFilters
                  statusFilter={statusFilter}
                  activityFilter={activityFilter}
                  onStatusFilterChange={setStatusFilter}
                  onActivityFilterChange={setActivityFilter}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Accounts Table */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            Teacher Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TeacherAccountsTable teachers={filteredTeachers} />
        </CardContent>
      </Card>
    </div>
  );
}
