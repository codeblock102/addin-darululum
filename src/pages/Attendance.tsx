import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRBAC } from "@/hooks/useRBAC.ts";
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
import { useI18n } from "@/contexts/I18nContext.tsx";

const Attendance = () => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAdmin, isAttendanceTaker, isLoading } = useRBAC();

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin && !isAttendanceTaker) {
      navigate("/");
    }
  }, [isLoading, isAdmin, isAttendanceTaker, navigate]);

  const statsCards = [
    {
      title: t("pages.attendance.statToday"),
      value: "28/32",
      percentage: "87.5%",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      title: t("pages.attendance.statWeek"),
      value: "142/160",
      percentage: "88.7%",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      title: t("pages.attendance.statPending"),
      value: "3",
      percentage: "Low",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-8">
        {/* Mobile-optimized Header Section */}
        <div className="relative overflow-hidden">
          <div className="relative bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:gap-6">

              <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] to-[hsl(142.8,64.2%,32%)] rounded-lg sm:rounded-xl text-white shadow-sm">
                    <BookOpen className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-black">{t("pages.attendance.headerTitle")}</h1>
                    <p className="text-black text-sm sm:text-lg">{t("pages.attendance.headerDesc")}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5 text-xs sm:text-sm font-medium"
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
                  className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5 text-xs sm:text-sm font-medium"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
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
              className="bg-white border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-black">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-black">
                        {stat.value}
                      </p>
                      <p className={`text-xs sm:text-sm font-medium ${stat.color}`}>
                        {stat.percentage}
                      </p>
                    </div>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.color} bg-white/50 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile-optimized Main Content */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-lg sm:text-2xl font-bold text-black flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] to-[hsl(142.8,64.2%,32%)] rounded-md sm:rounded-lg text-white">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  {t("pages.attendance.dashboardTitle")}
                </CardTitle>
                <CardDescription className="text-black mt-1 sm:mt-2 text-sm sm:text-base">{t("pages.attendance.dashboardDesc")}</CardDescription>
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
              <div className="border-b border-gray-200 bg-gray-50">
                <TabsList className="w-full h-auto p-0 bg-transparent grid grid-cols-2 rounded-none">
                  <TabsTrigger
                    value="take-attendance"
                    className="flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(142.8,64.2%,24.1%)] data-[state=active]:bg-[hsl(142.8,64.2%,24.1%)]/10 data-[state=active]:text-[hsl(142.8,64.2%,24.1%)] hover:bg-gray-100 text-black"
                  >
                    <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-base">{t("pages.attendance.tabs.take")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="records"
                    className="flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 hover:bg-gray-100 text-black"
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-base">{t("pages.attendance.tabs.records")}</span>
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
                      <h3 className="text-lg sm:text-xl font-semibold text-black">{t("pages.attendance.recordTitle")}</h3>
                      <p className="text-black text-sm sm:text-base">{t("pages.attendance.recordDesc")}</p>
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
                      <h3 className="text-lg sm:text-xl font-semibold text-black">{t("pages.attendance.historyTitle")}</h3>
                      <p className="text-black text-sm sm:text-base">{t("pages.attendance.historyDesc")}</p>
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
