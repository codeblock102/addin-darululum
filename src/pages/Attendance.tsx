
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users, Info, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const Attendance = () => {
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Attendance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage student attendance records
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
            >
              <CalendarCheck className="h-3 w-3 mr-1" />
              Today: {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>
        
        <Card className="border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  Attendance Dashboard
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                      <p>Record and view student attendance information</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </Badge>
              </div>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Take attendance for individual students and view attendance history
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs 
              value={selectedTab} 
              onValueChange={setSelectedTab} 
              className="w-full"
            >
              <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-800">
                <TabsTrigger 
                  value="take-attendance" 
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-200 
                           data-[state=active]:bg-purple-600 data-[state=active]:text-white 
                           rounded-md transition-all duration-200"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Take Attendance</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="records" 
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-200 
                           data-[state=active]:bg-purple-600 data-[state=active]:text-white 
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
