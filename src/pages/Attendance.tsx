
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users } from "lucide-react";

const Attendance = () => {
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  
  return (
    <DashboardLayout>
      <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Attendance Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Take attendance for individual students and view attendance history.
          </p>
        </div>

        <Tabs 
          value={selectedTab} 
          onValueChange={setSelectedTab} 
          className="w-full"
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger 
              value="take-attendance" 
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 
                         data-[state=active]:bg-primary data-[state=active]:text-white 
                         rounded-md transition-all duration-200"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Take Attendance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 
                         data-[state=active]:bg-primary data-[state=active]:text-white 
                         rounded-md transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span>Attendance Records</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent 
            value="take-attendance" 
            className="mt-6 animate-fadeIn"
          >
            <AttendanceForm />
          </TabsContent>
          
          <TabsContent 
            value="records" 
            className="mt-6 animate-fadeIn"
          >
            <AttendanceTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
