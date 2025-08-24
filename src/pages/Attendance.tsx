import { useState } from "react";
import { AttendanceForm } from "@/components/attendance/AttendanceForm.tsx";
import { AttendanceTable } from "@/components/attendance/AttendanceTable.tsx";
import { AttendanceCutoffSettings } from "@/components/attendance/AttendanceCutoffSettings.tsx";
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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

const Attendance = () => {
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  const isMobile = useIsMobile();

  const statsCards = [
    {
      title: "Today's Attendance",
      value: "28/32",
      percentage: "87.5%",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      title: "This Week",
      value: "142/160",
      percentage: "88.7%",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "Pending Reviews",
      value: "3",
      percentage: "Low",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-8">
        {/* Mobile-optimized Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-teal-600/10 rounded-2xl sm:rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col gap-4 sm:gap-6">

              <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl text-white shadow-lg">
                    <BookOpen className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                      Attendance Management
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-lg">
                      Track and manage student attendance with ease
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 px-3 py-1.5 text-xs sm:text-sm font-medium"
                >

                  <CalendarCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: isMobile ? 'short' : 'long', 
                    month: isMobile ? 'short' : 'long', 
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
          </div>
        </div>

        {/* Mobile-optimized Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {statsCards.map((stat, index) => (
            <Card
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {stat.value}
                      </p>
                      <p className={`text-xs sm:text-sm font-medium ${stat.color}`}>
                        {stat.percentage}
                      </p>
                    </div>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.color} bg-white/50 dark:bg-slate-800/50 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />

                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile-optimized Main Content */}
        <Card className="border-0 shadow-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-md sm:rounded-lg text-white">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  Attendance Dashboard
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 mt-1 sm:mt-2 text-sm sm:text-base">
                  Select students directly and record attendance with flexible timing and reasons

                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="p-3 sm:p-6 lg:p-8 pt-4">
              <AttendanceCutoffSettings />
            </div>
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <TabsList className="w-full h-auto p-0 bg-transparent grid grid-cols-2 rounded-none">
                  <TabsTrigger
                    value="take-attendance"
                    className="flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  >
                    <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-base">Take Attendance</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="records"
                    className="flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-base">Records</span>

                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-3 sm:p-6 lg:p-8">
                <TabsContent
                  value="take-attendance"
                  className="mt-0 animate-fadeIn"
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center space-y-1 sm:space-y-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Record Student Attendance
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        Select students and set attendance with custom timing

                      </p>
                    </div>
                    <AttendanceForm />
                  </div>
                </TabsContent>

                <TabsContent
                  value="records"
                  className="mt-0 animate-fadeIn"
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center space-y-1 sm:space-y-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Attendance History
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        View and manage all attendance records

                      </p>
                    </div>
                    <AttendanceTable />
                  </div>
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
