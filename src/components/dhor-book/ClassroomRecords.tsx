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

  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: ["classroom-students", teacherId, isAdmin, teacherData],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("id, name, status")
        .not("madrassah_id", "is", null);

      if (isAdmin) {
        // Admins see all students in their madrassah
        if (teacherData?.madrassah_id) {
          query = query.eq("madrassah_id", teacherData.madrassah_id);
        } else {
          return []; // No madrassah, no students
        }
      } else {
        // If not an admin, must be a teacher. Apply teacher filters.
        if (teacherData?.madrassah_id && teacherData?.section) {
          query = query
            .eq("madrassah_id", teacherData.madrassah_id)
            .ilike("section", teacherData.section)
            .order("name", { ascending: true });
        } else {
          // If teacher has no madrassah_id or section, they see no students.
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
              Error loading classroom data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard section */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <CardHeader>
          <CardTitle className="flex items-center text-center justify-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            <span>Today's Leaderboard</span>
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
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                {topStudents.slice(0, 3).map((student, index) => (
                  <Card
                    key={student.id}
                    className={`w-full sm:w-[250px] md:w-64 ${
                      index === 0 ? "border-yellow-500/50 shadow-lg" : ""
                    }`}
                  >
                    <CardContent className="pt-6 text-center flex flex-col items-center">
                      <div className="mb-4">
                        {LeaderboardRankIcons[index]}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{student.name}</h3>
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
                            View Details
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
                  No student records available for today's leaderboard.
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
              <span>Classroom Records</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Total Students
                      </div>
                      <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Sabaq Completed
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.sabaq}{" "}
                        <span className="text-sm text-muted-foreground">
                          / {stats.total}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Sabaq Para Completed
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.sabaqPara}{" "}
                        <span className="text-sm text-muted-foreground">
                          / {stats.total}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Dhor Completed
                      </div>
                      <div className="text-2xl font-bold">
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
                      placeholder="Search students..."
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
                      <SelectValue placeholder="Show all records" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All records</SelectItem>
                      <SelectItem value="complete">
                        Completed records
                      </SelectItem>
                      <SelectItem value="incomplete">
                        Incomplete records
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredRecords && filteredRecords.length > 0
                  ? (
                    <div className="overflow-x-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-center">Sabaq</TableHead>
                            <TableHead className="text-center">
                              Sabaq Para
                            </TableHead>
                            <TableHead className="text-center">Dhor</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecords.map((record, index) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                {index < 3
                                  ? (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                      {index === 0 && (
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                      )}
                                      {index === 1 && (
                                        <Medal className="h-4 w-4 text-zinc-400" />
                                      )}
                                      {index === 2 && (
                                        <Award className="h-4 w-4 text-amber-700" />
                                      )}
                                    </div>
                                  )
                                  : (
                                    <span className="font-medium">
                                      {index + 1}
                                    </span>
                                  )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {record.name}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {record.sabaq.done
                                    ? (
                                      <>
                                        <Check className="h-5 w-5 text-green-500" />
                                        {getQualityBadge(record.sabaq.quality)}
                                      </>
                                    )
                                    : <X className="h-5 w-5 text-red-500" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {record.sabaqPara.done
                                    ? (
                                      <>
                                        <Check className="h-5 w-5 text-green-500" />
                                        {getQualityBadge(
                                          record.sabaqPara.quality,
                                        )}
                                      </>
                                    )
                                    : <X className="h-5 w-5 text-red-500" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {record.dhor.done
                                    ? (
                                      <>
                                        <Check className="h-5 w-5 text-green-500" />
                                        {getQualityBadge(record.dhor.quality)}
                                      </>
                                    )
                                    : <X className="h-5 w-5 text-red-500" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/students/${record.id}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                  : (
                    <div className="text-center py-12 border rounded-md bg-muted/20">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      {(students && students.length > 0)
                        ? (
                          <>
                            <h3 className="text-lg font-medium mb-1">
                              No records found
                            </h3>
                            <p className="text-muted-foreground">
                              No student records found for the selected date or
                              filter criteria.
                            </p>
                          </>
                        )
                        : (
                          <>
                            <h3 className="text-lg font-medium mb-1">
                              No students assigned
                            </h3>
                            <p className="text-muted-foreground">
                              You don't have any students assigned to you.
                              Please contact an administrator.
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
