import React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { AttendanceDataTable } from "./table/AttendanceDataTable.tsx";
import { AttendanceEmptyState } from "./table/AttendanceEmptyState.tsx";
import { SearchInput } from "../table/SearchInput.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";

interface AttendanceRecord {
  id: string;
  date: string;
  time: string | null;
  status: string;
  notes?: string;
  student_id: string;
  class_id: string;
  students: { id: string; name: string } | null;
  classes: { id: string; name: string } | null;
}

export function AttendanceTable() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[], Error>({
    queryKey: ["attendance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `id, date, status, notes, student_id, class_id, time, students (id, name), classes (id, name)`,
        )
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching attendance records:", error);
        throw error;
      }
      return data || [];
    },
  });

  const filteredRecords =
    attendanceRecords?.filter(
      (record) =>
        record.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.classes?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
    ) || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const resetFilters = () => setSearchQuery("");
  const hasFilters = searchQuery.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              View and search past attendance records.
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by student, status, or class..."
              className="w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredRecords.length > 0 ? (
          <AttendanceDataTable attendanceRecords={filteredRecords} />
        ) : (
          <div className="text-center py-12">
            <AttendanceEmptyState hasFilters={hasFilters}>
              {hasFilters && (
                <Button onClick={resetFilters} variant="outline" className="mt-4">
                  Clear Filters
                </Button>
              )}
            </AttendanceEmptyState>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
