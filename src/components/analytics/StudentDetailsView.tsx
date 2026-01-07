/**
 * Student Details View - Lazy Loaded
 * Shows detailed per-student metrics, tables, and filters
 * Only loads when user clicks "View Student Details"
 * Uses heavy calculation approach but doesn't block initial page load
 */

import { useStudentAnalytics } from "@/hooks/useStudentAnalytics.ts";
import { EmptyState } from "./EmptyState.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useState, useMemo } from "react";
import { subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface StudentDetailsViewProps {
  onBack: () => void;
}

export function StudentDetailsView({ onBack }: StudentDetailsViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "pace" | "risk" | "attendance">("risk");
  const [filterRisk, setFilterRisk] = useState<"all" | "high" | "medium" | "low">("all");
  
  const now = new Date();
  const currentRange = { from: subMonths(now, 3), to: now };
  
  const { data: studentMetrics, isLoading, error } = useStudentAnalytics(currentRange);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!studentMetrics || !Array.isArray(studentMetrics)) return [];

    let filtered = studentMetrics;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.studentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by risk level
    if (filterRisk !== "all") {
      filtered = filtered.filter((m) => {
        if (filterRisk === "high") return m.atRiskCompositeScore >= 70;
        if (filterRisk === "medium") return m.atRiskCompositeScore >= 40 && m.atRiskCompositeScore < 70;
        return m.atRiskCompositeScore < 40;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.studentName.localeCompare(b.studentName);
        case "pace":
          return b.averageMemorizationPace.pagesPerWeek - a.averageMemorizationPace.pagesPerWeek;
        case "risk":
          return b.atRiskCompositeScore - a.atRiskCompositeScore;
        case "attendance":
          return b.attendanceRate - a.attendanceRate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [studentMetrics, searchQuery, sortBy, filterRisk]);

  // Get risk status
  const getRiskStatus = (score: number) => {
    if (score >= 70) return { label: "High Risk", color: "destructive" };
    if (score >= 40) return { label: "Medium Risk", color: "default" };
    return { label: "Low Risk", color: "secondary" };
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading detailed student data...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load student details</p>
          <p className="text-sm text-gray-600 mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Summary
        </Button>
      </div>
    );
  }

  // Show empty state
  if (!studentMetrics || studentMetrics.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          message="No student data available"
          description="No students found in the selected time range."
        />
        <div className="flex justify-center">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Summary
          </Button>
        </div>
      </div>
    );
  }

  // At-risk students (top 10)
  const atRiskStudents = useMemo(() => {
    return filteredStudents
      .filter((m) => m.atRiskCompositeScore >= 50)
      .slice(0, 10);
  }, [filteredStudents]);

  // Stagnant students
  const stagnantStudents = useMemo(() => {
    return filteredStudents.filter((m) => m.stagnationDetection.isStagnant);
  }, [filteredStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Per-student metrics and breakdowns
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Summary
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search Students</label>
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Risk Score</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="pace">Memorization Pace</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Risk</label>
              <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v as typeof filterRisk)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="high">High Risk (≥70)</SelectItem>
                  <SelectItem value="medium">Medium Risk (40-69)</SelectItem>
                  <SelectItem value="low">Low Risk (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Students Table */}
      {atRiskStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              At-Risk Students ({atRiskStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Pace (pages/week)</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskStudents.map((student) => {
                    const riskStatus = getRiskStatus(student.atRiskCompositeScore);
                    return (
                      <TableRow
                        key={student.studentId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/students/${student.studentId}`)}
                      >
                        <TableCell className="font-medium">{student.studentName}</TableCell>
                        <TableCell>
                          <Badge variant={riskStatus.color as any}>
                            {Math.round(student.atRiskCompositeScore)}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.averageMemorizationPace.pagesPerWeek.toFixed(1)}</TableCell>
                        <TableCell>{Math.round(student.attendanceRate)}%</TableCell>
                        <TableCell>
                          {student.burnoutWarningFlag ? (
                            <Badge variant="destructive">Warning</Badge>
                          ) : student.stagnationDetection.isStagnant ? (
                            <Badge variant="default">Stagnant</Badge>
                          ) : (
                            <Badge variant="secondary">At Risk</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stagnant Students Table */}
      {stagnantStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Stagnant Students (No Progress ≥ 7 Days) ({stagnantStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Days Since Progress</TableHead>
                    <TableHead>Last Pace</TableHead>
                    <TableHead>Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stagnantStudents.map((student) => (
                    <TableRow
                      key={student.studentId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/students/${student.studentId}`)}
                    >
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                          {student.stagnationDetection.daysSinceLastProgress} days
                        </Badge>
                      </TableCell>
                      <TableCell>{student.averageMemorizationPace.pagesPerWeek.toFixed(1)} pages/week</TableCell>
                      <TableCell>{Math.round(student.attendanceRate)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Students Table (filtered) */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Students ({filteredStudents.length} of {studentMetrics.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Pace</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No students match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const riskStatus = getRiskStatus(student.atRiskCompositeScore);
                    return (
                      <TableRow
                        key={student.studentId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/students/${student.studentId}`)}
                      >
                        <TableCell className="font-medium">{student.studentName}</TableCell>
                        <TableCell>
                          <Badge variant={riskStatus.color as any}>
                            {Math.round(student.atRiskCompositeScore)}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.averageMemorizationPace.pagesPerWeek.toFixed(1)} pages/week</TableCell>
                        <TableCell>{Math.round(student.attendanceRate)}%</TableCell>
                        <TableCell>
                          {student.burnoutWarningFlag ? (
                            <Badge variant="destructive">Warning</Badge>
                          ) : student.stagnationDetection.isStagnant ? (
                            <Badge variant="default">Stagnant</Badge>
                          ) : student.atRiskCompositeScore >= 50 ? (
                            <Badge variant="secondary">At Risk</Badge>
                          ) : (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

