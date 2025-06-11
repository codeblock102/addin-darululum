
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, Users, TrendingUp } from "lucide-react";
import { SummaryData } from "@/types/teacher";

interface DashboardSummaryProps {
  summaryData: SummaryData | undefined;
}

export const DashboardSummary = ({ summaryData }: DashboardSummaryProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
        <div className="relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="font-semibold text-green-800 text-sm sm:text-base">Total Students</h3>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">
                {summaryData?.studentsCount || 0}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">Recent Progress</span>
              </div>
              <span className="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {summaryData?.recentProgressEntries || 0} entries
              </span>
            </div>
          </CardContent>
        </div>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
        <div className="relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full"></div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="font-semibold text-amber-800 text-sm sm:text-base">Today's Classes</h3>
              <p className="text-3xl sm:text-4xl font-bold text-amber-700">
                {summaryData?.todayClasses || 0}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                <span className="text-gray-600">Average Quality</span>
              </div>
              <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full capitalize">
                {summaryData?.averageQuality || "N/A"}
              </span>
            </div>
          </CardContent>
        </div>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
        <div className="relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Total Revisions</h3>
              <p className="text-3xl sm:text-4xl font-bold text-blue-700">
                {summaryData?.totalRevisions || 0}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Pending</span>
              </div>
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {summaryData?.pendingRevisions || 0} revisions
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};
