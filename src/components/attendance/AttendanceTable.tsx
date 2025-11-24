import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

interface AttendanceRecord {
  id: string;
  date: string;
  time: string | null;
  status: string;
  notes?: string;
  student_id: string;
  class_id: string;
  students: { id: string; name: string; section?: string } | null;
  classes: { id: string; name: string } | null;
}

export function AttendanceTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");

  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[], Error>({
    queryKey: ["attendance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `id, date, status, notes, student_id, class_id, time, students (id, name, section), classes (id, name)`,
        )
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching attendance records:", error);
        throw error;
      }
      // @ts-ignore - section might not be in the generated types yet but is in the DB
      return data || [];
    },
  });

  const uniqueSections = useMemo(() => {
    if (!attendanceRecords) return [];
    const sections = new Set(
      attendanceRecords
        .map((r) => r.students?.section)
        .filter((s): s is string => !!s)
    );
    return Array.from(sections).sort();
  }, [attendanceRecords]);

  const filteredRecords =
    attendanceRecords?.filter(
      (record) => {
        const matchesSearch = 
          record.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (record.classes?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        
        const matchesSection = 
          selectedSection === "all" 
            ? true 
            : selectedSection === "unassigned"
            ? !record.students?.section
            : record.students?.section === selectedSection;

        return matchesSearch && matchesSection;
      }
    ) || [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSection("all");
  };
  
  const hasFilters = searchQuery.length > 0 || selectedSection !== "all";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-black">Attendance History</CardTitle>
            <CardDescription className="text-black">
              View and search past attendance records.
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            {uniqueSections.length > 0 && (
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="unassigned">No Section</SelectItem>
                  {uniqueSections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full sm:w-[250px]"
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
            <AttendanceEmptyState hasFilters={hasFilters} resetFilters={resetFilters} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
