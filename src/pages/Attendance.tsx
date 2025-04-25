import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users } from "lucide-react";
const Attendance = () => {
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  return <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">
            Take attendance for individual students and view attendance history.
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full bg-gray-800">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="take-attendance" className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700">
              <CalendarCheck className="h-4 w-4" />
              <span>Take Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2 text-gray-50 bg-gray-900 hover:bg-gray-800">
              <Users className="h-4 w-4" />
              <span>Attendance Records</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="take-attendance" className="mt-6">
            <AttendanceForm />
          </TabsContent>
          
          <TabsContent value="records" className="mt-6">
            <AttendanceTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>;
};
export default Attendance;