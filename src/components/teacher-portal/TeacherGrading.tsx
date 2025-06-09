
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { FileCheck, GraduationCap, Loader2, Save } from "lucide-react";

interface GradingProps {
  teacherId: string;
}

interface Student {
  name: string;
  id: string;
  status?: string;
  current_surah?: number;
  current_juz?: number;
  last_grade?: string;
  memorization_quality?: string;
}

interface ProgressData {
  current_surah?: number;
  current_juz?: number;
  memorization_quality?: string;
}

interface GradeData {
  memorization_quality: "excellent" | "good" | "average" | "needsWork" | "horrible";
  notes: string;
}

interface StudentGrade {
  created_at: string;
  memorization_quality: string | null;
  current_surah: number | null;
  current_juz: number | null;
  contributor_name: string | null;
}

export const TeacherGrading = ({ teacherId }: GradingProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [gradeData, setGradeData] = useState<GradeData>({
    memorization_quality: "average",
    notes: "",
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["all-students-for-grading"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }

      const studentsWithProgress = await Promise.all(
        data.map(async (student) => {
          const { data: progressData, error: progressError } = await supabase
            .from("progress")
            .select("current_surah, current_juz, memorization_quality")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (progressError) {
            console.error("Error fetching student progress:", progressError);
            return {
              id: student.id,
              name: student.name,
              status: student.status,
            } as Student;
          }

          if (progressData && progressData.length > 0) {
            try {
              const progress = progressData[0] as ProgressData;
              return {
                id: student.id,
                name: student.name,
                status: student.status,
                current_surah: progress.current_surah,
                current_juz: progress.current_juz,
                memorization_quality: progress.memorization_quality,
              } as Student;
            } catch (e) {
              console.error("Error processing progress data:", e);
            }
          }

          return {
            id: student.id,
            name: student.name,
            status: student.status,
          } as Student;
        }),
      );

      return studentsWithProgress;
    },
  });

  const { data: studentGrades } = useQuery({
    queryKey: ["student-grades", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const student = students?.find((s) => s.name === selectedStudent);
      if (!student) return [];

      const { data, error } = await supabase
        .from("progress")
        .select("current_surah, current_juz, memorization_quality, created_at, notes")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching student grades:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!selectedStudent && !!students,
  });

  const { data: teacherData } = useQuery({
    queryKey: ["teacher-details-for-grading", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("id", teacherId)
        .single();

      if (error) {
        console.error("Error fetching teacher details:", error);
        return null;
      }

      return data;
    },
  });

  const submitGradeMutation = useMutation({
    mutationFn: async (data: GradeData) => {
      const student = students?.find((s) => s.name === selectedStudent);
      if (!student) {
        throw new Error("Student not found");
      }

      const contributorInfo = teacherData
        ? {
          notes: `Teacher ${teacherData.name}: ${data.notes}`,
        }
        : {
          notes: `Teacher: ${data.notes}`,
        };

      const { data: result, error } = await supabase
        .from("progress")
        .insert({
          student_id: student.id,
          memorization_quality: data.memorization_quality,
          date: new Date().toISOString().split("T")[0],
          ...contributorInfo,
        });

      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-grades", selectedStudent],
      });
      toast({
        title: "Grade Submitted",
        description: "The student's grade has been successfully recorded.",
      });
      setGradeData({
        memorization_quality: "average",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit grade: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setGradeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setGradeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student.",
        variant: "destructive",
      });
      return;
    }

    submitGradeMutation.mutate(gradeData);
  };

  const getQualityColor = (quality: string | null | undefined) => {
    switch (quality) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "average":
        return "text-yellow-600";
      case "needsWork":
        return "text-orange-600";
      case "horrible":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getQualityPercentage = (quality: string | null | undefined) => {
    switch (quality) {
      case "excellent":
        return 100;
      case "good":
        return 80;
      case "average":
        return 60;
      case "needsWork":
        return 40;
      case "horrible":
        return 20;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Student Grading System
          </CardTitle>
          <CardDescription>
            Evaluate and track student performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="students">Student Grades</TabsTrigger>
              <TabsTrigger value="new-grade">New Grade</TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Student Performance Overview
                  </h3>
                </div>

                {studentsLoading
                  ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )
                  : students && students.length > 0
                  ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Current Surah</TableHead>
                            <TableHead>Current Juz</TableHead>
                            <TableHead>Memorization Quality</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student: Student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                {student.name}
                              </TableCell>
                              <TableCell>
                                {student.current_surah || "N/A"}
                              </TableCell>
                              <TableCell>
                                {student.current_juz || "N/A"}
                              </TableCell>
                              <TableCell>
                                {student.memorization_quality
                                  ? (
                                    <div className="flex flex-col gap-1">
                                      <span
                                        className={getQualityColor(
                                          student.memorization_quality,
                                        )}
                                      >
                                        {student.memorization_quality}
                                      </span>
                                      <Progress
                                        value={getQualityPercentage(
                                          student.memorization_quality,
                                        )}
                                        className="h-1"
                                      />
                                    </div>
                                  )
                                  : (
                                    "Not graded"
                                  )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStudent(student.name);
                                    setActiveTab("new-grade");
                                  }}
                                >
                                  Grade
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                  : (
                    <div className="text-center p-6 border rounded-md">
                      <FileCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                      <p>No students in the database</p>
                    </div>
                  )}
              </div>
            </TabsContent>

            <TabsContent value="new-grade">
              <div className="space-y-4">
                <form onSubmit={handleSubmitGrade} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">Select Student</Label>
                    <Select
                      value={selectedStudent}
                      onValueChange={setSelectedStudent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsLoading
                          ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )
                          : students && students.length > 0
                          ? (
                            students.map((student: Student) => (
                              <SelectItem
                                key={student.name}
                                value={student.name}
                              >
                                {student.name}
                              </SelectItem>
                            ))
                          )
                          : (
                            <SelectItem value="none" disabled>
                              No students available
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStudent && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="memorization_quality">
                          Memorization Quality
                        </Label>
                        <Select
                          value={gradeData.memorization_quality}
                          onValueChange={(value) =>
                            handleSelectChange("memorization_quality", value)}
                        >
                          <SelectTrigger id="memorization_quality">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">
                              Excellent
                            </SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="needsWork">
                              Needs Work
                            </SelectItem>
                            <SelectItem value="horrible">
                              Incomplete
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Teacher Notes</Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={gradeData.notes}
                          onChange={handleInputChange}
                          placeholder="Additional notes about the student's performance"
                          className="w-full min-h-[100px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={submitGradeMutation.isPending}
                        >
                          {submitGradeMutation.isPending
                            ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            )
                            : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Submit Grade
                              </>
                            )}
                        </Button>
                      </div>
                    </>
                  )}
                </form>

                {selectedStudent && studentGrades && studentGrades.length > 0 &&
                  (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">
                        Previous Grades for {selectedStudent}
                      </h3>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Memorization</TableHead>
                              <TableHead>Surah</TableHead>
                              <TableHead>Juz</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentGrades.map((grade: any, index: number) => (
                              <TableRow key={grade.created_at || index}>
                                <TableCell>
                                  {new Date(grade.created_at)
                                    .toLocaleDateString()}
                                </TableCell>
                                <TableCell
                                  className={getQualityColor(
                                    grade.memorization_quality,
                                  )}
                                >
                                  {grade.memorization_quality || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {grade.current_surah || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {grade.current_juz || "N/A"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
