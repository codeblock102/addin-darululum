import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  AlertCircle,
  Award,
  Calendar,
  Check,
  Loader2,
  Medal,
  Search,
  Trophy,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";

interface ClassroomRecordsProps {
  teacherId?: string;
  isAdmin: boolean;
}

interface StudentRecordSummary {
  id: string;
  name: string;
  sabaq: {
    done: boolean;
    date?: string;
    quality?: string;
  };
  sabaqPara: {
    done: boolean;
    date?: string;
    quality?: string;
  };
  dhor: {
    done: boolean;
    date?: string;
    quality?: string;
  };
  completionScore?: number;
}

export function ClassroomRecords(
  { teacherId, isAdmin }: ClassroomRecordsProps,
) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [recordType, setRecordType] = useState<
    "all" | "incomplete" | "complete"
  >("all");

  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["teacherData", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId)
        .single();
      if (error) {
        console.error("Error fetching teacher data:", error);
        throw error;
      }
      return data;
    },
    enabled: !!teacherId && !isAdmin,
  });

  // Load classes assigned to this teacher to scope student roster precisely
  const { data: teacherClasses = [] } = useTeacherClasses(teacherId || "");

  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: [
      "classroom-students",
      teacherId,
      isAdmin,
      teacherData?.madrassah_id,
      teacherData?.section,
      (teacherClasses || []).map((c: { id: string }) => c.id).join(","),
    ],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("id, name, status")
        .not("madrassah_id", "is", null);

      if (isAdmin) {
        // Admins: fall back to madrassah filter if available
        if (teacherData?.madrassah_id) {
          query = query.eq("madrassah_id", teacherData.madrassah_id);
        } else {
          return [];
        }
      } else {
        // Teachers: strictly scope to students in the teacher's assigned classes
        const classIds: string[] = (teacherClasses || []).map(
          (c: { id: string }) => c.id,
        );
        if (classIds.length > 0) {
          const { data: cls } = await supabase
            .from("classes")
            .select("current_students, id")
            .in("id", classIds);
          const studentIds = (cls || [])
            .flatMap((c: { current_students?: string[] }) => c.current_students || [])
            .filter((id: string, i: number, arr: string[]) => id && arr.indexOf(id) === i);
          if (studentIds.length === 0) return [];
          query = query.in("id", studentIds).order("name", { ascending: true });
        } else if (teacherData?.madrassah_id && teacherData?.section) {
          // Fallback: older behavior if classes aren't configured
          query = query
            .eq("madrassah_id", teacherData.madrassah_id)
            .ilike("section", teacherData.section)
            .order("name", { ascending: true });
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      return data || [];
    },
    enabled: isAdmin || (!isLoadingTeacher && !!teacherData),
  });

  // Fetch records for the given date and all students
  const { data: recordsData, isLoading: recordsLoading, error: recordsError } =
    useQuery({
      queryKey: ["classroom-records", selectedDate, students],
      queryFn: async () => {
        if (!students || students.length === 0) {
          console.log("No students to fetch records for");
          return [];
        }

        const studentIds = students.map((student) => student?.id).filter(
          Boolean,
        );
        console.log(
          "Fetching records for student IDs:",
          studentIds,
          "date:",
          selectedDate,
        );

        // Fetch progress records (sabaq)
        const { data: progressData, error: progressError } = await supabase
          .from("progress")
          .select("student_id, current_surah, memorization_quality, date")
          .in("student_id", studentIds)
          .eq("date", selectedDate);

        if (progressError) {
          console.error("Error fetching progress:", progressError);
        }

        // Fetch sabaq_para records
        const { data: sabaqParaData, error: sabaqParaError } = await supabase
          .from("sabaq_para")
          .select("student_id, quality_rating, revision_date")
          .in("student_id", studentIds)
          .eq("revision_date", selectedDate);

        if (sabaqParaError) {
          console.error("Error fetching sabaq para:", sabaqParaError);
        }

        // Fetch juz_revisions records (dhor)
        const { data: juzRevisionsData, error: juzRevisionsError } =
          await supabase
            .from("juz_revisions")
            .select("student_id, memorization_quality, revision_date")
            .in("student_id", studentIds)
            .eq("revision_date", selectedDate);

        if (juzRevisionsError) {
          console.error("Error fetching juz revisions:", juzRevisionsError);
        }

        console.log(
          "Records fetched - Progress:",
          progressData?.length || 0,
          "Sabaq Para:",
          sabaqParaData?.length || 0,
          "Juz Revisions:",
          juzRevisionsData?.length || 0,
        );

        // Create summary for each student
        const studentSummaries: StudentRecordSummary[] = students.map(
          (student) => {
            const progressRecord = progressData?.find(
              (p) => p.student_id === student?.id,
            );

            const sabaqParaRecord = sabaqParaData?.find(
              (sp) => sp.student_id === student?.id,
            );

            const juzRevisionRecord = juzRevisionsData?.find(
              (jr) => jr.student_id === student?.id,
            );

            // Calculate completion score for leaderboard ranking
            const completionScore = (progressRecord ? 1 : 0) +
              (sabaqParaRecord ? 1 : 0) +
              (juzRevisionRecord ? 1 : 0);

            // Quality score - bonus points based on quality ratings
            let qualityBonus = 0;

            if (progressRecord?.memorization_quality === "excellent") {
              qualityBonus += 0.5;
            }
            if (sabaqParaRecord?.quality_rating === "excellent") {
              qualityBonus += 0.5;
            }
            if (juzRevisionRecord?.memorization_quality === "excellent") {
              qualityBonus += 0.5;
            }

            return {
              id: student?.id || "",
              name: student?.name || "",
              sabaq: {
                done: !!progressRecord,
                date: progressRecord?.date,
                quality: progressRecord?.memorization_quality,
              },
              sabaqPara: {
                done: !!sabaqParaRecord,
                date: sabaqParaRecord?.revision_date,
                quality: sabaqParaRecord?.quality_rating,
              },
              dhor: {
                done: !!juzRevisionRecord,
                date: juzRevisionRecord?.revision_date,
                quality: juzRevisionRecord?.memorization_quality,
              },
              completionScore: completionScore + qualityBonus,
            };
          },
        );

        // Sort by completion score for leaderboard
        return studentSummaries.sort((a, b) =>
          (b.completionScore ?? 0) - (a.completionScore ?? 0)
        );
      },
      enabled: isAdmin || (!isLoadingTeacher && !!teacherData),
    });

  // Filter records based on search and record type
  const filteredRecords = recordsData?.filter((record) => {
    // Filter by search query
    const matchesSearch = record.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Filter by record type
    if (recordType === "complete") {
      return matchesSearch &&
        (record.sabaq.done && record.sabaqPara.done && record.dhor.done);
    } else if (recordType === "incomplete") {
      return matchesSearch &&
        (!record.sabaq.done || !record.sabaqPara.done || !record.dhor.done);
    }

    return matchesSearch;
  });

  // Get top 3 students for the leaderboard
  const topStudents = recordsData?.slice(0, 3) || [];

  type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

  const getQualityBadge = (quality?: string) => {
    if (!quality) return null;

    let variant: BadgeVariant = "outline";
    switch (quality) {
      case "excellent":
        variant = "default";
        break;
      case "good":
        variant = "secondary";
        break;
      case "average":
        variant = "outline";
        break;
      case "poor":
        variant = "destructive";
        break;
      case "unsatisfactory":
        variant = "destructive";
        break;
    }

    return <Badge variant={variant}>{quality}</Badge>;
  };

  const getCompletionStats = () => {
    if (!recordsData || recordsData.length === 0) {
      return { sabaq: 0, sabaqPara: 0, dhor: 0, total: 0 };
    }

    const total = recordsData.length;
    const sabaqCompleted = recordsData.filter((r) => r.sabaq.done).length;
    const sabaqParaCompleted =
      recordsData.filter((r) => r.sabaqPara.done).length;
    const dhorCompleted = recordsData.filter((r) => r.dhor.done).length;

    return {
      sabaq: sabaqCompleted,
      sabaqPara: sabaqParaCompleted,
      dhor: dhorCompleted,
      total,
    };
  };

  const stats = getCompletionStats();
  const isLoading = studentsLoading || recordsLoading || isLoadingTeacher;
  const hasError = studentsError || recordsError;

  // Award components for top 3 places
  const LeaderboardRankIcons = [
    <Trophy key="1st" className="h-8 w-8 text-yellow-500" />,
    <Medal key="2nd" className="h-8 w-8 text-zinc-400" />,
    <Award key="3rd" className="h-8 w-8 text-amber-700" />,
  ];

  return (
    <div className="space-y-6">
      {hasError && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">
              {t("pages.teacherPortal.classroom.error", "Error loading classroom data. Please try refreshing the page.")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard section */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <CardHeader>
          <CardTitle className="flex items-center text-center justify-center text-base sm:text-lg">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            <span>{t("pages.teacherPortal.classroom.leaderboard", "Today's Leaderboard")}</span>
            <Trophy className="h-6 w-6 ml-2 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )
            : topStudents.length > 0
            ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {topStudents.slice(0, 3).map((student, index) => (
                  <Card
                    key={student.id}
                    className={`${
                      index === 0 ? "border-yellow-500/50 shadow-lg" : ""
                    }`}
                  >
                    <CardContent className="pt-6 text-center flex flex-col items-center">
                      <div className="mb-4">
                        {LeaderboardRankIcons[index]}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2">{student.name}</h3>
                      <div className="space-y-1 w-full mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Sabaq:</span>
                          <span>
                            {student.sabaq.done
                              ? (
                                <Check className="h-4 w-4 text-green-500 inline ml-1" />
                              )
                              : (
                                <X className="h-4 w-4 text-red-500 inline ml-1" />
                              )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sabaq Para:</span>
                          <span>
                            {student.sabaqPara.done
                              ? (
                                <Check className="h-4 w-4 text-green-500 inline ml-1" />
                              )
                              : (
                                <X className="h-4 w-4 text-red-500 inline ml-1" />
                              )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Dhor:</span>
                          <span>
                            {student.dhor.done
                              ? (
                                <Check className="h-4 w-4 text-green-500 inline ml-1" />
                              )
                              : (
                                <X className="h-4 w-4 text-red-500 inline ml-1" />
                              )}
                          </span>
                        </div>
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => navigate(`/students/${student.id}`)}
                          >
                            {t("pages.teacherPortal.classroom.viewDetails", "View Details")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
            : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  {t("pages.teacherPortal.classroom.noLeaderboard", "No student records available for today's leaderboard.")}
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{t("pages.teacherPortal.classroom.title", "Classroom Records")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )
            : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <Card className="bg-muted/40">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-sm text-muted-foreground">
                        {t("pages.teacherPortal.classroom.metrics.totalStudents", "Total Students")}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-sm text-muted-foreground">
                        {t("pages.teacherPortal.classroom.metrics.sabaqCompleted", "Sabaq Completed")}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {stats.sabaq}{" "}
                        <span className="text-sm text-muted-foreground">
                          / {stats.total}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-sm text-muted-foreground">
                        {t("pages.teacherPortal.classroom.metrics.sabaqParaCompleted", "Sabaq Para Completed")}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {stats.sabaqPara}{" "}
                        <span className="text-sm text-muted-foreground">
                          / {stats.total}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-sm text-muted-foreground">
                        {t("pages.teacherPortal.classroom.metrics.dhorCompleted", "Dhor Completed")}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {stats.dhor}{" "}
                        <span className="text-sm text-muted-foreground">
                          / {stats.total}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("pages.teacherPortal.classroom.searchPlaceholder", "Search students...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <Select
                    value={recordType}
                    onValueChange={(value) =>
                      setRecordType(value as "all" | "incomplete" | "complete")}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("pages.teacherPortal.classroom.filterPlaceholder", "Show all records")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("pages.teacherPortal.classroom.filters.all", "All records")}</SelectItem>
                      <SelectItem value="complete">
                        {t("pages.teacherPortal.classroom.filters.completed", "Completed records")}
                      </SelectItem>
                      <SelectItem value="incomplete">
                        {t("pages.teacherPortal.classroom.filters.incomplete", "Incomplete records")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredRecords && filteredRecords.length > 0
                  ? (
                    <>
                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3">
                        {filteredRecords.map((record, index) => (
                          <Card key={record.id} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {index < 3 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                        {index === 1 && <Medal className="h-4 w-4 text-zinc-400" />}
                                        {index === 2 && <Award className="h-4 w-4 text-amber-700" />}
                                      </span>
                                    ) : (
                                      <span className="text-sm font-semibold">#{index + 1}</span>
                                    )}
                                    <span className="font-semibold truncate">{record.name}</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                    <div className="flex flex-col items-center border rounded-md py-2">
                                      <span className="text-muted-foreground">Sabaq</span>
                                      {record.sabaq.done ? (
                                        <>
                                          <Check className="h-4 w-4 text-green-500 mt-1" />
                                          <div className="mt-1">{getQualityBadge(record.sabaq.quality)}</div>
                                        </>
                                      ) : (
                                        <X className="h-4 w-4 text-red-500 mt-1" />
                                      )}
                                    </div>
                                    <div className="flex flex-col items-center border rounded-md py-2">
                                      <span className="text-muted-foreground">Sabaq Para</span>
                                      {record.sabaqPara.done ? (
                                        <>
                                          <Check className="h-4 w-4 text-green-500 mt-1" />
                                          <div className="mt-1">{getQualityBadge(record.sabaqPara.quality)}</div>
                                        </>
                                      ) : (
                                        <X className="h-4 w-4 text-red-500 mt-1" />
                                      )}
                                    </div>
                                    <div className="flex flex-col items-center border rounded-md py-2">
                                      <span className="text-muted-foreground">Dhor</span>
                                      {record.dhor.done ? (
                                        <>
                                          <Check className="h-4 w-4 text-green-500 mt-1" />
                                          <div className="mt-1">{getQualityBadge(record.dhor.quality)}</div>
                                        </>
                                      ) : (
                                        <X className="h-4 w-4 text-red-500 mt-1" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <Button variant="outline" size="sm" onClick={() => navigate(`/students/${record.id}`)}>
                                    {t("pages.teacherPortal.classroom.view", "View")}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("pages.teacherPortal.classroom.table.rank", "Rank")}</TableHead>
                              <TableHead>{t("pages.teacherPortal.classroom.table.student", "Student")}</TableHead>
                              <TableHead className="text-center">Sabaq</TableHead>
                              <TableHead className="text-center">Sabaq Para</TableHead>
                              <TableHead className="text-center">Dhor</TableHead>
                              <TableHead className="text-right">{t("pages.teacherPortal.classroom.table.actions", "Actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRecords.map((record, index) => (
                              <TableRow key={record.id}>
                                <TableCell>
                                  {index < 3 ? (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                      {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                      {index === 1 && <Medal className="h-4 w-4 text-zinc-400" />}
                                      {index === 2 && <Award className="h-4 w-4 text-amber-700" />}
                                    </div>
                                  ) : (
                                    <span className="font-medium">{index + 1}</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    {record.sabaq.done ? (
                                      <>
                                        <Check className="h-5 w-5 text-green-500" />
                                        {getQualityBadge(record.sabaq.quality)}
                                      </>
                                    ) : (
                                      <X className="h-5 w-5 text-red-500" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    {record.sabaqPara.done ? (
                                      <>
                                        <Check className="h-5 w-5 text-green-500" />
                                        {getQualityBadge(record.sabaqPara.quality)}
                                      </>
                                    ) : (
                                      <X className="h-5 w-5 text-red-500" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    {record.dhor.done ? (
                                      <>
                                        <Check className="h-5 w-5 text-green-500" />
                                        {getQualityBadge(record.dhor.quality)}
                                      </>
                                    ) : (
                                      <X className="h-5 w-5 text-red-500" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${record.id}`)}>
                                    {t("pages.teacherPortal.classroom.viewDetails", "View Details")}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )
                  : (
                    <div className="text-center py-12 border rounded-md bg-muted/20">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      {(students && students.length > 0)
                        ? (
                          <>
                            <h3 className="text-lg font-medium mb-1">
                              {t("pages.teacherPortal.classroom.noRecords.title", "No records found")}
                            </h3>
                            <p className="text-muted-foreground">
                              {t("pages.teacherPortal.classroom.noRecords.desc", "No student records found for the selected date or filter criteria.")}
                            </p>
                          </>
                        )
                        : (
                          <>
                            <h3 className="text-lg font-medium mb-1">
                              {t("pages.teacherPortal.classroom.noStudents.title", "No students assigned")}
                            </h3>
                            <p className="text-muted-foreground">
                              {t("pages.teacherPortal.classroom.noStudents.desc", "You don't have any students assigned to you. Please contact an administrator.")}
                            </p>
                          </>
                        )}
                    </div>
                  )}
              </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
