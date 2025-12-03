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
import { Button } from "@/components/ui/button.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils.ts";

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
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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

        const matchesDate = !dateFilter || (() => {
          // Compare dates as strings to avoid timezone issues
          // record.date is already in "YYYY-MM-DD" format from the database
          const filterDateStr = format(dateFilter, "yyyy-MM-dd");
          return record.date === filterDateStr;
        })();

        const matchesStatus = 
          selectedStatus === "all" 
            ? true 
            : record.status === selectedStatus;

        return matchesSearch && matchesSection && matchesDate && matchesStatus;
      }
    ) || [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSection("all");
    setDateFilter(null);
    setSelectedStatus("all");
  };
  
  const hasFilters = searchQuery.length > 0 || selectedSection !== "all" || dateFilter !== null || selectedStatus !== "all";

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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
                <SelectItem value="early_departure">Early Departure</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[180px] justify-start text-left font-normal bg-white text-black border-gray-300 hover:bg-gray-50",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter ?? undefined}
                  onSelect={(date) => setDateFilter(date ?? null)}
                  initialFocus
                />
                {dateFilter && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-center"
                      onClick={() => setDateFilter(null)}
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
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
