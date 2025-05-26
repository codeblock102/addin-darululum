import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceDataTable } from "./table/AttendanceDataTable";
import { AttendanceEmptyState } from "./table/AttendanceEmptyState";
import { AttendanceTableHeader } from "./table/AttendanceTableHeader";
import { SearchInput } from "../table/SearchInput";

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
  
  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[], Error>({
    queryKey: ['attendance-records', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id, date, status, notes, student_id, class_id,
          students (id, name), 
          classes (id, name)
        `)
        .order('date', { ascending: false });
        
      if (error) {
        console.error("Error fetching attendance records:", error);
        throw error;
      }
      
      if (!data) {
        return [] as AttendanceRecord[];
      }
      
      return data.map(record => ({
        ...record,
        students: record.students, 
        classes: record.classes,
      })) as AttendanceRecord[];
    }
  });
  
  // Filter records by search query
  const filteredRecords = attendanceRecords?.filter(record =>
    record.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.classes?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
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
        placeholder="Search students, status..."
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
