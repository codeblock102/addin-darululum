import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Search,
  Loader2,
  TrendingUp,
  BarChart3,
  Target,
  CheckCircle,
  Calendar,
  Award,
  ArrowUp,
  ArrowDown,
  Star,
  Trophy,
  Lightbulb,
} from "lucide-react";

interface UserProfileData { madrassah_id?: string; section?: string }
interface MonthlyProgressProps {
  isAdmin?: boolean;
  teacherId?: string;
  userProfileData?: UserProfileData;
}

interface ProgressEntry {
  id: string;
  date: string;
  student_id: string;
  student_name: string;
  pages_memorized: number;
  verses_memorized: number;
  memorization_quality: string;
  notes?: string;
}

interface MonthlyStats {
  month: string;
  totalPages: number;
  totalRevisions: number;
  averageQuality: number;
  entriesCount: number;
  qualityDistribution: Record<string, number>;
}

export const MonthlyProgress = ({ isAdmin, teacherId, userProfileData }: MonthlyProgressProps) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonths, setSelectedMonths] = useState(6);

  type StudentRow = { id: string; name: string; status: string };

  const { data: students, isLoading: studentsLoading } = useQuery<StudentRow[]>({
    queryKey: [
      "students-for-monthly-progress",
      {
        isAdmin,
        userMadrassahId: userProfileData?.madrassah_id,
        teacherId,
      },
    ],
    queryFn: async () => {
      if (!userProfileData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .eq("madrassah_id", userProfileData.madrassah_id);

      if (isAdmin) {
        if (teacherId && teacherId !== "all") {
          const { data: links, error: linkError } = await supabase
            .from("students_teachers")
            .select("student_name")
            .eq("teacher_id", teacherId);

          if (linkError) {
            console.error("Error fetching teacher's students", linkError);
            return [];
          }

          const names = Array.from(new Set(((links || []) as Array<{ student_name: string | null }>).map((l) => l.student_name).filter(Boolean))) as string[];
          if (names.length === 0) return [];

          const { data: studs, error: sErr } = await supabase
            .from("students")
            .select("id, name")
            .in("name", names);
          if (sErr) {
            console.error("Error resolving student IDs", sErr);
            return [];
          }
          const ids = ((studs || []) as Array<{ id: string; name: string }>).map((s) => s.id);
          query = query.in("id", ids);
        }
      } else if (teacherId && userProfileData.section) {
        const { data: links, error: linkError } = await supabase
          .from("students_teachers")
          .select("student_name")
          .eq("teacher_id", teacherId);

        if (linkError) {
          console.error("Error fetching teacher's students", linkError);
          return [];
        }

        const names = Array.from(new Set(((links || []) as Array<{ student_name: string | null }>).map((l) => l.student_name).filter(Boolean))) as string[];
        if (names.length === 0) return [];

        const { data: studs, error: sErr } = await supabase
          .from("students")
          .select("id, name")
          .in("name", names);
        if (sErr) {
          console.error("Error resolving student IDs", sErr);
          return [];
        }
        const ids = ((studs || []) as Array<{ id: string; name: string }>).map((s) => s.id);
        if (ids.length === 0) return [];
        query = query.in("id", ids).eq("section", userProfileData.section);
      } else {
        return [];
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }
      return (data || []) as StudentRow[];
    },
    enabled: !!userProfileData,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressEntry[]>({
    queryKey: ["monthly-progress-data", selectedStudentId, selectedMonths],
    queryFn: async () => {
      if (!selectedStudentId) return [];

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - selectedMonths);

      const { data, error } = await supabase
        .from("dhor_book_progress")
        .select("*")
        .eq("student_id", selectedStudentId)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching progress data:", error);
        return [];
      }

      return (data || []) as ProgressEntry[];
    },
    enabled: !!selectedStudentId,
  });

  const selectedStudent = students?.find((s: StudentRow) => s.id === selectedStudentId);
  const filteredStudents = students?.filter((student: StudentRow) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQualityScore = (quality: string): number => {
    const qualityMap: Record<string, number> = {
      "excellent": 5,
      "good": 4,
      "fair": 3,
      "needs_improvement": 2,
      "poor": 1,
    };
    return qualityMap[quality] || 0;
  };

  const getQualityColor = (score: number): string => {
    if (score >= 4.5) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 3.5) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 2.5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (score >= 1.5) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const generateProgressAnalysis = () => {
    if (!progressData || progressData.length === 0) return null;

    // Group data by month
    const monthlyData: Record<string, ProgressEntry[]> = {};
    progressData.forEach((entry: ProgressEntry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = [];
      monthlyData[monthKey].push(entry);
    });

    const getTrend = () => {
      const months = Object.keys(monthlyData).sort();
      if (months.length < 2) return "stable";

      const current = monthlyData[months[months.length - 1]];
      const previous = monthlyData[months[months.length - 2]];

      const currentPages = current.reduce((sum, entry) => sum + entry.pages_memorized, 0);
      const previousPages = previous.reduce((sum, entry) => sum + entry.pages_memorized, 0);

      const currentQuality = current.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality), 0) / current.length;
      const previousQuality = previous.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality), 0) / previous.length;

      if (currentPages > previousPages && currentQuality >= previousQuality) return "improving";
      if (currentPages < previousPages || currentQuality < previousQuality) return "declining";
      return "stable";
    };

    const totalPages = progressData.reduce((sum: number, entry: ProgressEntry) => sum + entry.pages_memorized, 0);
    const totalRevisions = progressData.filter((entry: ProgressEntry) => entry.pages_memorized === 0).length;
    const averageQuality = progressData.reduce((sum: number, entry: ProgressEntry) => sum + getQualityScore(entry.memorization_quality), 0) / progressData.length;
    const monthCount = Object.keys(monthlyData).length;

    const insights = [];
    if (totalPages >= 50) {
      insights.push({
        type: "achievement",
        icon: "trophy",
        title: "Outstanding Progress!",
        description: `Memorized ${totalPages} pages - excellent dedication and consistency.`
      });
    }
    if (averageQuality >= 4) {
      insights.push({
        type: "good",
        icon: "star",
        title: "High Quality Memorization",
        description: "Maintaining excellent memorization quality standards."
      });
    }
    if ((totalPages / monthCount) < 8) {
      insights.push({
        type: "improvement",
        icon: "lightbulb",
        title: "Increase Practice Frequency",
        description: "Consider increasing daily practice sessions to improve monthly progress."
      });
    }

    const months = Object.keys(monthlyData).sort();
    const currentMonth = months.length > 0 ? monthlyData[months[months.length - 1]] : null;
    const previousMonth = months.length > 1 ? monthlyData[months[months.length - 2]] : null;

    return {
      totalPages,
      totalRevisions,
      averageQuality,
      monthCount,
      trend: getTrend(),
      insights,
      currentMonth: currentMonth ? {
        totalPages: currentMonth.reduce((sum, entry) => sum + entry.pages_memorized, 0),
        averageQuality: currentMonth.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality), 0) / currentMonth.length,
        entriesCount: currentMonth.length,
        totalRevisions: currentMonth.filter(entry => entry.pages_memorized === 0).length
      } : null,
      previousMonth: previousMonth ? {
        totalPages: previousMonth.reduce((sum, entry) => sum + entry.pages_memorized, 0),
        averageQuality: previousMonth.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality), 0) / previousMonth.length,
        entriesCount: previousMonth.length,
        totalRevisions: previousMonth.filter(entry => entry.pages_memorized === 0).length
      } : null
    };
  };

  const analysis = generateProgressAnalysis();

  // Process monthly data for display
  const monthlyData: MonthlyStats[] = progressData ? (() => {
    const monthlyMap: Record<string, ProgressEntry[]> = {};
    progressData.forEach((entry: ProgressEntry) => {
      const date = new Date(entry.date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = [];
      monthlyMap[monthKey].push(entry);
    });

    return Object.entries(monthlyMap).map(([month, entries]) => {
      const qualityDistribution: Record<string, number> = {};
      entries.forEach((entry: ProgressEntry) => {
        const quality = entry.memorization_quality;
        qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
      });

      return {
        month,
        totalPages: entries.reduce((sum, entry) => sum + entry.pages_memorized, 0),
        totalRevisions: entries.filter(entry => entry.pages_memorized === 0).length,
        averageQuality: entries.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality), 0) / entries.length,
        entriesCount: entries.length,
        qualityDistribution,
      };
    }).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  })() : [];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "declining": return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTrendDescription = (trend: string) => {
    switch (trend) {
      case "improving": return "Performance is trending upward with increasing progress and quality.";
      case "declining": return "Performance shows a declining trend. Focus on consistency and revision.";
      default: return "Performance is stable with consistent progress patterns.";
    }
  };

  const getInsightIcon = (iconType: string) => {
    switch (iconType) {
      case "trophy": return <Trophy className="h-4 w-4" />;
      case "star": return <Star className="h-4 w-4" />;
      case "lightbulb": return <Lightbulb className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Select Student</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              {studentsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </div>
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents?.map((student: StudentRow) => (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                          selectedStudentId === student.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {student.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Time Range Selection */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Time Range</h3>
              <Select value={selectedMonths.toString()} onValueChange={(value: string) => setSelectedMonths(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 2 years</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Progress Display */}
        <div className="lg:col-span-3">
          {selectedStudentId ? (
            progressLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                  Loading monthly progress...
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Monthly Progress - {selectedStudent?.name}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Progress Summary & Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Overall Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border">
                          <div className="text-2xl font-bold text-blue-700">{analysis.totalPages}</div>
                          <div className="text-sm text-blue-600">Total Pages ({analysis.monthCount} months)</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border">
                          <div className="text-2xl font-bold text-green-700">{analysis.totalRevisions}</div>
                          <div className="text-sm text-green-600">Total Revisions</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border">
                          <div className="text-2xl font-bold text-purple-700">{analysis.averageQuality.toFixed(1)}</div>
                          <div className="text-sm text-purple-600">Average Quality</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border">
                          <div className="text-2xl font-bold text-orange-700">
                            {(analysis.totalPages / analysis.monthCount).toFixed(1)}
                          </div>
                          <div className="text-sm text-orange-600">Pages/Month</div>
                        </div>
                      </div>

                      {/* Trend Analysis */}
                      <div className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          {getTrendIcon(analysis.trend)}
                          <h3 className="font-semibold text-gray-800">Performance Trend</h3>
                        </div>
                        <p className="text-gray-700">{getTrendDescription(analysis.trend)}</p>
                        {analysis.previousMonth && (
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span>Pages Change:</span>
                              <span className={`font-medium ${
                                analysis.currentMonth!.totalPages >= analysis.previousMonth.totalPages 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.currentMonth!.totalPages >= analysis.previousMonth.totalPages ? '+' : ''}
                                {analysis.currentMonth!.totalPages - analysis.previousMonth.totalPages}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quality Change:</span>
                              <span className={`font-medium ${
                                analysis.currentMonth!.averageQuality >= analysis.previousMonth.averageQuality 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.currentMonth!.averageQuality >= analysis.previousMonth.averageQuality ? '+' : ''}
                                {(analysis.currentMonth!.averageQuality - analysis.previousMonth.averageQuality).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Insights & Recommendations */}
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Key Insights & Recommendations
                        </h3>
                        <div className="grid gap-3">
                          {analysis.insights.map((insight, index) => (
                            <div 
                              key={index}
                              className={`p-3 rounded-lg border-l-4 ${
                                insight.type === 'achievement' 
                                  ? 'bg-green-50 border-green-400' 
                                  : insight.type === 'good'
                                  ? 'bg-blue-50 border-blue-400'
                                  : 'bg-orange-50 border-orange-400'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 ${
                                  insight.type === 'achievement' 
                                    ? 'text-green-600' 
                                    : insight.type === 'good'
                                    ? 'text-blue-600'
                                    : 'text-orange-600'
                                }`}>
                                  {getInsightIcon(insight.icon)}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${
                                    insight.type === 'achievement' 
                                      ? 'text-green-800' 
                                      : insight.type === 'good'
                                      ? 'text-blue-800'
                                      : 'text-orange-800'
                                  }`}>
                                    {insight.title}
                                  </h4>
                                  <p className={`text-sm ${
                                    insight.type === 'achievement' 
                                      ? 'text-green-700' 
                                      : insight.type === 'good'
                                      ? 'text-blue-700'
                                      : 'text-orange-700'
                                  }`}>
                                    {insight.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Performance Recommendations */}
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Action Plan
                        </h3>
                        <div className="text-sm text-indigo-700 space-y-1">
                          {analysis.currentMonth?.averageQuality && analysis.currentMonth.averageQuality < 3.5 && (
                            <p>• Focus on revision sessions to improve memorization quality</p>
                          )}
                          {analysis.currentMonth?.entriesCount && analysis.currentMonth.entriesCount < 15 && (
                            <p>• Increase practice frequency to at least 4-5 sessions per week</p>
                          )}
                          {analysis.currentMonth?.totalPages && analysis.currentMonth.totalPages < 10 && (
                            <p>• Set a target of memorizing 10-15 pages per month</p>
                          )}
                          {analysis.currentMonth?.totalRevisions && analysis.currentMonth.totalPages && 
                           analysis.currentMonth.totalRevisions < analysis.currentMonth.totalPages && (
                            <p>• Implement regular revision schedule - aim for 1:1 ratio of new pages to revision</p>
                          )}
                          {analysis.insights.filter(i => i.type === 'achievement').length > 0 && (
                            <p>• Continue current excellent practices and maintain momentum</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {monthlyData && monthlyData.length > 0 ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Monthly Breakdown
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    
                    <div className="grid gap-4">
                      {monthlyData.map((monthStats) => (
                        <Card key={monthStats.month}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {monthStats.month}
                              </h3>
                              <Badge className={getQualityColor(monthStats.averageQuality)}>
                                Avg Quality: {monthStats.averageQuality.toFixed(1)}/5
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <BookOpen className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                                <div className="text-2xl font-bold text-blue-600">{monthStats.totalPages}</div>
                                <div className="text-sm text-gray-600">Pages Memorized</div>
                              </div>
                              
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
                                <div className="text-2xl font-bold text-green-600">{monthStats.totalRevisions}</div>
                                <div className="text-sm text-gray-600">Pages Revised</div>
                              </div>
                              
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <Award className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                                <div className="text-2xl font-bold text-purple-600">{monthStats.entriesCount}</div>
                                <div className="text-sm text-gray-600">Study Sessions</div>
                              </div>
                              
                              <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <Calendar className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                                <div className="text-2xl font-bold text-orange-600">
                                  {(monthStats.totalPages / Math.max(monthStats.entriesCount, 1)).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Pages/Session</div>
                              </div>
                            </div>

                            {/* Quality Distribution */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Quality Distribution</h4>
                              <div className="flex gap-1 flex-wrap">
                                {Object.entries(monthStats.qualityDistribution).map(([quality, count]) => (
                                  <Badge key={quality} variant="outline" className="text-xs">
                                    {quality}: {count}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center p-8">
                      <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Progress Data</h3>
                      <p className="text-gray-600">No progress entries found for the selected time period.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-full p-8 text-center">
                <div>
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800">Select a Student</h3>
                  <p className="text-sm text-gray-600">Choose a student to view their monthly progress summary.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 