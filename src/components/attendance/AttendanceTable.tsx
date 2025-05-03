
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceFilters } from "./AttendanceFilters";
import { AttendanceTableHeader } from "./table/AttendanceTableHeader";
import { SearchInput } from "./table/SearchInput";
import { AttendanceDataTable } from "./table/AttendanceDataTable";
import { AttendanceEmptyState } from "./table/AttendanceEmptyState";
import { useAttendanceRecords } from "./table/useAttendanceRecords";

export function AttendanceTable() {
  const {
    attendanceRecords,
    isLoadingAttendance,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    resetFilters
  } = useAttendanceRecords();

  const hasFilters = !!searchQuery || !!statusFilter || !!dateFilter;

  return (
    <Card className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden animate-fadeIn">
      <AttendanceTableHeader />
      <CardContent className="p-6">
        <div className="mb-6 space-y-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
          
          <AttendanceFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        <AttendanceDataTable 
          isLoading={isLoadingAttendance}
          attendanceRecords={attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords : []}
        />

        {!isLoadingAttendance && (!attendanceRecords || attendanceRecords.length === 0) && (
          <AttendanceEmptyState 
            hasFilters={hasFilters}
            resetFilters={resetFilters}
          />
        )}
      </CardContent>
    </Card>
  );
}
