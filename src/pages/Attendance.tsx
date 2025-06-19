
import { useState } from "react";
import { AttendanceForm } from "@/components/attendance/AttendanceForm.tsx";
import { AttendanceTable } from "@/components/attendance/AttendanceTable.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  Clock,
  TrendingUp,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Download,
  Filter,
  MoreVertical,
  Plus,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";

const Attendance = () => {
  const [selectedTab, setSelectedTab] = useState("take-attendance");

  // Mock data for statistics
  const attendanceStats = {
    todayPresent: 28,
    todayTotal: 32,
    todayPercentage: 87.5,
    weekPresent: 142,
    weekTotal: 160,
    weekPercentage: 88.7,
    pendingReviews: 3,
    avgAttendance: 85,
  };

  return (
    <div className="min-h-screen admin-theme p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-100">
                  Attendance Management
                </h1>
                <p className="text-gray-400 text-sm lg:text-base">
                  Track and manage student attendance with comprehensive insights
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 px-3 py-1.5 text-xs sm:text-sm font-medium"
              >
                <CalendarCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-3 py-1.5 text-xs sm:text-sm font-medium"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 admin-btn-secondary"
                  size="lg"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="admin-theme">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Attendance
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className="gap-2 bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-medium"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Quick Attendance</span>
              <span className="sm:hidden">Quick</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Today's Attendance</p>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-100">
                      {attendanceStats.todayPresent}/{attendanceStats.todayTotal}
                    </div>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {attendanceStats.todayPercentage}% present
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">This Week</p>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-100">
                      {attendanceStats.weekPresent}/{attendanceStats.weekTotal}
                    </div>
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {attendanceStats.weekPercentage}% average
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Pending Reviews</p>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-100">
                      {attendanceStats.pendingReviews}
                    </div>
                    <p className="text-xs text-orange-400">
                      Require attention
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Average Attendance</p>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-100">
                      {attendanceStats.avgAttendance}%
                    </div>
                    <Progress
                      value={attendanceStats.avgAttendance}
                      className="h-2 bg-white/10"
                    />
                    <p className="text-xs text-gray-400">
                      Last 30 days
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="admin-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Attendance Dashboard
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
                    Live
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  Comprehensive attendance tracking and management system
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <div className="border-b border-white/10 bg-white/5">
                <TabsList className="w-full h-auto p-0 bg-transparent grid grid-cols-2 rounded-none">
                  <TabsTrigger
                    value="take-attendance"
                    className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-green-50/10 data-[state=active]:text-green-300 hover:bg-white/5"
                  >
                    <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Take Attendance</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="records"
                    className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50/10 data-[state=active]:text-blue-300 hover:bg-white/5"
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Records & History</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                <TabsContent
                  value="take-attendance"
                  className="mt-0 space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarCheck className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-100">
                      Record Student Attendance
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                      Select students and record attendance with flexible timing options and detailed notes for comprehensive tracking
                    </p>
                  </div>
                  <AttendanceForm />
                </TabsContent>

                <TabsContent
                  value="records"
                  className="mt-0 space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-100">
                      Attendance History & Records
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                      View, search, and manage all attendance records with advanced filtering and export capabilities
                    </p>
                  </div>
                  <AttendanceTable />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
