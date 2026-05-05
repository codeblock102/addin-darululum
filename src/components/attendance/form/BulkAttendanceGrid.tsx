
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Loader2, Users, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form.ts";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";

interface BulkAttendanceGridProps {
  form: UseFormReturn<AttendanceFormValues>;
}

interface BulkAttendanceData {
  student_ids: string[];
  status: string;
  time: string;
  date: string;
  notes?: string;
  late_reason?: string;
}

export function BulkAttendanceGrid({ form }: BulkAttendanceGridProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkTime, setBulkTime] = useState<string>(format(new Date(), "HH:mm"));
  const [bulkNotes, setBulkNotes] = useState<string>("");
  const [bulkLateReason, setBulkLateReason] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: students, isLoading } = useQuery<{ id: string; name: string; status: string }[]>({
    queryKey: ["all-students-bulk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students for bulk attendance:", error);
        throw error;
      }
      return (data || []) as { id: string; name: string; status: string }[];
    },
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: BulkAttendanceData) => {
      const attendanceRecords = Array.from(selectedStudents).map(studentId => ({
        student_id: studentId,
        date: data.date,
        status: data.status,
        time: data.time,
        notes: data.notes,
        late_reason: data.status === "late" ? data.late_reason : null,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(attendanceRecords, { onConflict: "student_id,date" });

      if (error) throw error;
      return attendanceRecords.length;
    },
    onSuccess: (count: number) => {
      toast({
        title: t("pages.attendance.bulk.successTitle", "Success"),
        description: t("pages.attendance.bulk.successDesc", "Attendance recorded for {count} students").replace("{count}", String(count)),
      });
      setSelectedStudents(new Set());
      setBulkStatus("");
      setBulkNotes("");
      setBulkLateReason("");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: unknown) => {
      toast({
        title: t("common.error", "Error"),
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (checked: boolean | string) => {
    if (checked === true && students) {
      setSelectedStudents(new Set(students.map((s: { id: string }) => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleBulkSubmit = () => {
    if (selectedStudents.size === 0) {
      toast({
        title: t("pages.attendance.bulk.noneSelectedTitle", "No students selected"),
        description: t("pages.attendance.bulk.noneSelectedDesc", "Please select at least one student"),
        variant: "destructive",
      });
      return;
    }

    if (!bulkStatus) {
      toast({
        title: t("pages.attendance.bulk.statusRequiredTitle", "Status required"),
        description: t("pages.attendance.bulk.statusRequiredDesc", "Please select an attendance status"),
        variant: "destructive",
      });
      return;
    }

    const currentDate = form.getValues("date") as Date;
    bulkAttendanceMutation.mutate({
      student_ids: Array.from(selectedStudents),
      status: bulkStatus,
      time: bulkTime,
      date: format(currentDate, "yyyy-MM-dd"),
      notes: bulkNotes,
      late_reason: bulkLateReason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {t("pages.attendance.bulk.loading", "Loading students...")}
      </div>
    );
  }

  const isAllSelected = students && selectedStudents.size === students.length;
  const isSomeSelected = selectedStudents.size > 0 && !isAllSelected;

  return (
    <div className="space-y-6">
      {/* Bulk Actions Header */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-sm font-medium text-foreground">
                {selectedStudents.size > 0 
                  ? t("pages.attendance.bulk.selectedCount", "{count} students selected").replace("{count}", String(selectedStudents.size))
                  : t("pages.attendance.bulk.selectPrompt", "Select students for bulk attendance")}
              </span>
            </div>

            {selectedStudents.size > 0 && (
              <div className="flex flex-wrap gap-3 items-center">
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder={t("pages.attendance.bulk.statusPlaceholder", "Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">{t("pages.attendance.status.present", "Present")}</SelectItem>
                    <SelectItem value="absent">{t("pages.attendance.status.absent", "Absent")}</SelectItem>
                    <SelectItem value="late">{t("pages.attendance.status.late", "Late")}</SelectItem>
                    <SelectItem value="excused">{t("pages.attendance.status.excused", "Excused")}</SelectItem>
                    <SelectItem value="early_departure">{t("pages.attendance.status.earlyDeparture", "Early Departure")}</SelectItem>
                    <SelectItem value="sick">{t("pages.attendance.status.sick", "Sick")}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="time"
                  value={bulkTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkTime(e.target.value)}
                  className="w-[120px] h-9"
                />

                {bulkStatus === "late" && (
                  <Input
                    placeholder={t("pages.attendance.bulk.lateReason", "Late reason")}
                    value={bulkLateReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkLateReason(e.target.value)}
                    className="w-[140px] h-9"
                  />
                )}

                <Input
                  placeholder={t("pages.attendance.bulk.notes", "Notes")}
                  value={bulkNotes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkNotes(e.target.value)}
                  className="w-[140px] h-9"
                />

                <Button
                  onClick={handleBulkSubmit}
                  disabled={bulkAttendanceMutation.isPending}
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                >
                  {bulkAttendanceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  )}
                  {t("pages.attendance.bulk.apply", "Apply to Selected")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Grid */}
      <FormField
        control={form.control}
        name="student_id"
        render={({ field: _field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("pages.attendance.bulk.gridLabel", "Select Students for Bulk Attendance")}
            </FormLabel>
            <FormControl>
              <ScrollArea className="h-96 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students?.map((student: { id: string; name: string }, idx: number) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentToggle(student.id, !selectedStudents.has(student.id))}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        selectedStudents.has(student.id)
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : idx % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <span className="text-xs text-gray-400 w-6 text-right shrink-0 select-none">{idx + 1}</span>
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleStudentToggle(student.id, !!checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="flex-1 text-sm font-medium text-foreground">{student.name}</span>
                      {selectedStudents.has(student.id) && (
                        <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                {(!students || students.length === 0) && (
                  <div className="text-center py-8 text-foreground">
                    {t("pages.attendance.bulk.none", "No students found")}
                  </div>
                )}
              </ScrollArea>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Selected Students Summary */}
      {selectedStudents.size > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  {t("pages.attendance.bulk.badgeSelected", "{count} Selected").replace("{count}", String(selectedStudents.size))}
                </Badge>
                <span className="text-sm text-foreground">
                  {t("pages.attendance.bulk.ready", "Ready for bulk attendance recording")}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
                className="text-foreground hover:text-gray-800"
              >
                {t("pages.attendance.bulk.clear", "Clear Selection")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
