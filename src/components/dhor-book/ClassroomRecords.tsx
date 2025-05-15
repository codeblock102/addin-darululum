import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, Check, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ClassroomRecordsProps {
  teacherId: string;
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
}

export function ClassroomRecords({ teacherId }: ClassroomRecordsProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [recordType, setRecordType] = useState<"all" | "incomplete" | "complete">("all");
  
  console.log("ClassroomRecords component mounted for teacher:", teacherId, "selected date:", selectedDate);
  
  // Fetch students associated with this teacher
  const { data: teacherStudents, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ["teacher-students", teacherId],
    queryFn: async () => {
      console.log("Fetching teacher's students for:", teacherId);
      const { data, error } = await supabase
        .from("students_teachers")
        .select("student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);

      if (error) {
        console.error("Error fetching teacher's students:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No students found for teacher:", teacherId);
        return [];
      }

      console.log("Found students for teacher:", data.length);

      // Get full student details
      const studentPromises = data.map(async ({ student_name }) => {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, name, status")
          .eq("name", student_name)
          .single();

        if (studentError) {
          console.error(`Error fetching student ${student_name}:`, studentError);
          return null;
        }

        return studentData;
      });

      const students = await Promise.all(studentPromises);
      return students.filter(student => student !== null);
    },
  });

  // Fetch records for the given date
  const { data: recordsData, isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ["classroom-records", selectedDate, teacherId],
    queryFn: async () => {
      if (!teacherStudents || teacherStudents.length === 0) {
        console.log("No students to fetch records for");
        return [];
      }

      const studentIds = teacherStudents.map((student) => student?.id).filter(Boolean);
      console.log("Fetching records for student IDs:", studentIds, "date:", selectedDate);

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
      const { data: juzRevisionsData, error: juzRevisionsError } = await supabase
        .from("juz_revisions")
        .select("student_id, memorization_quality, revision_date")
        .in("student_id", studentIds)
        .eq("revision_date", selectedDate);

      if (juzRevisionsError) {
        console.error("Error fetching juz revisions:", juzRevisionsError);
      }

      console.log("Records fetched - Progress:", progressData?.length || 0, 
                  "Sabaq Para:", sabaqParaData?.length || 0, 
                  "Juz Revisions:", juzRevisionsData?.length || 0);

      // Create summary for each student
      const studentSummaries: StudentRecordSummary[] = teacherStudents.map((student) => {
        const progressRecord = progressData?.find(
          (p) => p.student_id === student?.id
        );
        
        const sabaqParaRecord = sabaqParaData?.find(
          (sp) => sp.student_id === student?.id
        );
        
        const juzRevisionRecord = juzRevisionsData?.find(
          (jr) => jr.student_id === student?.id
        );

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
        };
      });

      return studentSummaries;
    },
    enabled: !!teacherStudents && teacherStudents.length > 0,
  });

  // Filter records based on search and record type
  const filteredRecords = recordsData?.filter((record) => {
    // Filter by search query
    const matchesSearch = record.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Filter by record type
    if (recordType === "complete") {
      return matchesSearch && (record.sabaq.done && record.sabaqPara.done && record.dhor.done);
    } else if (recordType === "incomplete") {
      return matchesSearch && (!record.sabaq.done || !record.sabaqPara.done || !record.dhor.done);
    }

    return matchesSearch;
  });

  const getQualityBadge = (quality?: string) => {
    if (!quality) return null;
    
    let variant = "outline";
    switch(quality) {
      case "excellent":
        variant = "default";
        break;
      case "good":
        variant = "secondary";
        break;
      case "average":
        variant = "outline";
        break;
      case "needsWork":
        variant = "destructive";
        break;
      case "horrible":
        variant = "destructive";
        break;
    }
    
    return <Badge variant={variant as any}>{quality}</Badge>;
  };

  const getCompletionStats = () => {
    if (!recordsData || recordsData.length === 0) return { sabaq: 0, sabaqPara: 0, dhor: 0, total: 0 };
    
    const total = recordsData.length;
    const sabaqCompleted = recordsData.filter(r => r.sabaq.done).length;
    const sabaqParaCompleted = recordsData.filter(r => r.sabaqPara.done).length;
    const dhorCompleted = recordsData.filter(r => r.dhor.done).length;
    
    return {
      sabaq: sabaqCompleted,
      sabaqPara: sabaqParaCompleted,
      dhor: dhorCompleted,
      total
    };
  };

  const stats = getCompletionStats();
  const isLoading = studentsLoading || recordsLoading;
  const hasError = studentsError || recordsError;

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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
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
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-muted/40">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Students</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Sabaq Completed</div>
                    <div className="text-2xl font-bold">
                      {stats.sabaq} <span className="text-sm text-muted-foreground">/ {stats.total}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Sabaq Para Completed</div>
                    <div className="text-2xl font-bold">
                      {stats.sabaqPara} <span className="text-sm text-muted-foreground">/ {stats.total}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Dhor Completed</div>
                    <div className="text-2xl font-bold">
                      {stats.dhor} <span className="text-sm text-muted-foreground">/ {stats.total}</span>
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
                  onValueChange={(value) => setRecordType(value as "all" | "incomplete" | "complete")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Show all records" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All records</SelectItem>
                    <SelectItem value="complete">Completed records</SelectItem>
                    <SelectItem value="incomplete">Incomplete records</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredRecords && filteredRecords.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Sabaq</TableHead>
                        <TableHead className="text-center">Sabaq Para</TableHead>
                        <TableHead className="text-center">Dhor</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => window.location.href = `/dhor-book?studentId=${record.id}`}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/20">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  {teacherStudents && teacherStudents.length > 0 ? (
                    <>
                      <h3 className="text-lg font-medium mb-1">No records found</h3>
                      <p className="text-muted-foreground">
                        No student records found for the selected date or filter criteria.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-1">No students assigned</h3>
                      <p className="text-muted-foreground">
                        You don't have any students assigned to you. Please contact an administrator.
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
