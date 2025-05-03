
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceStatusBadge } from "./table/AttendanceStatusBadge";
import { AttendanceDataTable } from "./table/AttendanceDataTable";
import { AttendanceEmptyState } from "./table/AttendanceEmptyState";
import { AttendanceTableHeader } from "./table/AttendanceTableHeader";
import { SearchInput } from "./table/SearchInput";

interface AttendanceTableProps {
  teacherId?: string;
}

// Define the AttendanceRecord interface to match what we expect from the database
interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes?: string;
  student: {
    id: string;
    name: string;
  };
  class_schedule?: {
    class_name?: string;
  };
}

export function AttendanceTable({ teacherId }: AttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['attendance-records', teacherId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('attendance')
          .select(`
            id,
            date,
            status,
            notes,
            student:student_id (id, name),
            class_schedule:class_id (name:name)
          `);
          
        if (teacherId) {
          query = query.eq('teacher_id', teacherId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // If no data, return sample data for development
        if (!data || data.length === 0) {
          return [
            {
              id: "1",
              date: "2025-05-01",
              status: "present",
              notes: "Arrived on time",
              student: { id: "101", name: "Ahmed Ali" },
              class_schedule: { class_name: "Morning Hifz Class" }
            },
            {
              id: "2",
              date: "2025-05-01",
              status: "absent",
              notes: "Called in sick",
              student: { id: "102", name: "Sara Khan" },
              class_schedule: { class_name: "Morning Hifz Class" }
            },
            {
              id: "3",
              date: "2025-05-01",
              status: "late",
              notes: "10 minutes late",
              student: { id: "103", name: "Muhammad Yousuf" },
              class_schedule: { class_name: "Afternoon Tajweed" }
            }
          ] as AttendanceRecord[];
        }
        
        // Cast the data to our AttendanceRecord type, ensuring proper class name mapping
        return (data as any[]).map(record => ({
          ...record,
          class_schedule: { class_name: record.class_schedule?.name || "N/A" }
        })) as AttendanceRecord[];
      } catch (error) {
        console.error("Error fetching attendance records:", error);
        return [] as AttendanceRecord[];
      }
    }
  });
  
  // Filter records by search query
  const filteredRecords = attendanceRecords?.filter(record =>
    record.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.class_schedule?.class_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
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
    <div className="space-y-4">
      <AttendanceTableHeader />
      
      <SearchInput 
        value={searchQuery}
        onChange={handleSearchChange}
      />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : !filteredRecords?.length ? (
        <AttendanceEmptyState 
          hasFilters={hasFilters} 
          resetFilters={resetFilters} 
        />
      ) : (
        <AttendanceDataTable 
          isLoading={isLoading}
          attendanceRecords={filteredRecords}
        />
      )}
    </div>
  );
}
