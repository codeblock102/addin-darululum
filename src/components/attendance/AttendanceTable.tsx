
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
        // Simple query to avoid excessive type instantiation
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id, date, status, notes, 
            student_id, class_id
          `);
          
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
        
        // For each attendance record, get the student and class details
        const enhancedRecords = await Promise.all(data.map(async (record) => {
          // Get student details
          const { data: studentData } = await supabase
            .from('students')
            .select('id, name')
            .eq('id', record.student_id)
            .single();
            
          // Get class details if available
          let className = "N/A";
          if (record.class_id) {
            const { data: classData } = await supabase
              .from('classes')
              .select('name')
              .eq('id', record.class_id)
              .single();
              
            if (classData) {
              className = classData.name;
            }
          }
          
          return {
            ...record,
            student: studentData || { id: record.student_id || "", name: "Unknown Student" },
            class_schedule: { class_name: className }
          };
        }));
        
        return enhancedRecords as AttendanceRecord[];
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
