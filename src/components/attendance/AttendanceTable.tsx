
import React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { AttendanceDataTable } from "./table/AttendanceDataTable.tsx";
import { AttendanceEmptyState } from "./table/AttendanceEmptyState.tsx";
import { AttendanceTableHeader } from "./table/AttendanceTableHeader.tsx";
import { SearchInput } from "../table/SearchInput.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface AttendanceTableProps {
  teacherId?: string;
}

// Define the AttendanceRecord interface to match what we expect from the database
interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes?: string;
  students: {
    id: string;
    name: string;
  } | null;
  classes: {
    name: string;
  } | null;
  student_id: string | null;
  class_id: string | null;
}

export function AttendanceTable({ teacherId }: AttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const { data: attendanceRecords, isLoading } = useQuery<
    AttendanceRecord[],
    Error
  >({
    queryKey: ["attendance-records", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id, date, status, notes,
          students (id, name), 
          classes (id, name)
        `)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching attendance records:", error);
        throw error;
      }

      if (!data) {
        return [];
      }

      return data;
    },
  });

  // Filter records by search query
  const filteredRecords = attendanceRecords?.filter((record) =>
    record.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.classes?.name?.toLowerCase() || "").includes(
      searchQuery.toLowerCase(),
    )
  );

  // Function to handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Function to reset filters
  const resetFilters = () => {
    setSearchQuery("");
  };

  const hasFilters = searchQuery.length > 0;

  return (
    <div className="space-y-6">
      <AttendanceTableHeader />

      {/* Enhanced Search Section */}
      <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search students, status, or classes..."
                  className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
            
            {hasFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {filteredRecords?.length || 0} record(s) found
                </p>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="space-y-4 text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Loading attendance records...
                </p>
              </div>
            </div>
          ) : !filteredRecords?.length ? (
            <div className="p-8">
              <AttendanceEmptyState
                hasFilters={hasFilters}
                resetFilters={resetFilters}
              />
            </div>
          ) : (
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <AttendanceDataTable
                isLoading={isLoading}
                attendanceRecords={filteredRecords}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
