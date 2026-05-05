
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Loader2, Users, CheckSquare, FileText, Phone, Mail } from "lucide-react";
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

interface AttendanceRecord {
  student_id: string;
  date: string;
  status: string;
  time: string;
  notes?: string;
  late_reason?: string | null;
}

export function BulkAttendanceGrid({ form }: BulkAttendanceGridProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkTime, setBulkTime] = useState<string>(format(new Date(), "HH:mm"));
  const [bulkLateReason, setBulkLateReason] = useState<string>("");

  // Per-student notes state
  const [studentNotes, setStudentNotes] = useState<Map<string, string>>(new Map());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: students, isLoading } = useQuery<{ id: string; name: string; guardian_contact?: string; guardian_email?: string }[]>({
    queryKey: ["all-students-bulk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status, guardian_contact, guardian_email")
        .eq("status", "active")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; name: string; guardian_contact?: string; guardian_email?: string }[];
    },
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async () => {
      const currentDate = form.getValues("date") as Date;
      const dateStr = format(currentDate, "yyyy-MM-dd");

      const attendanceRecords: AttendanceRecord[] = Array.from(selectedStudents).map(studentId => ({
        student_id: studentId,
        date: dateStr,
        status: bulkStatus,
        time: bulkTime,
        notes: studentNotes.get(studentId) || undefined,
        late_reason: bulkStatus === "late" ? (bulkLateReason || null) : null,
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
      setBulkLateReason("");
      setStudentNotes(new Map());
      setExpandedNotes(new Set());
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
    const next = new Set(selectedStudents);
    checked ? next.add(studentId) : next.delete(studentId);
    setSelectedStudents(next);
  };

  const handleSelectAll = (checked: boolean | string) => {
    if (checked === true && students) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const toggleNoteRow = (studentId: string) => {
    const next = new Set(expandedNotes);
    next.has(studentId) ? next.delete(studentId) : next.add(studentId);
    setExpandedNotes(next);
  };

  const setNote = (studentId: string, value: string) => {
    const next = new Map(studentNotes);
    if (value) {
      next.set(studentId, value);
    } else {
      next.delete(studentId);
    }
    setStudentNotes(next);
  };

  const handleSubmit = () => {
    if (selectedStudents.size === 0) {
      toast({ title: t("pages.attendance.bulk.noneSelectedTitle", "No students selected"), description: t("pages.attendance.bulk.noneSelectedDesc", "Please select at least one student"), variant: "destructive" });
      return;
    }
    if (!bulkStatus) {
      toast({ title: t("pages.attendance.bulk.statusRequiredTitle", "Status required"), description: t("pages.attendance.bulk.statusRequiredDesc", "Please select an attendance status"), variant: "destructive" });
      return;
    }
    bulkAttendanceMutation.mutate();
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

                <Button
                  onClick={handleSubmit}
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

      {/* Student List */}
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
              <ScrollArea className="h-[480px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students?.map((student, idx) => {
                    const isSelected = selectedStudents.has(student.id);
                    const noteOpen = expandedNotes.has(student.id);
                    const note = studentNotes.get(student.id) || "";

                    return (
                      <div key={student.id}>
                        {/* Main row */}
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/30"
                              : idx % 2 === 0
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50 dark:bg-gray-800"
                          }`}
                        >
                          {/* Row number */}
                          <span className="text-xs text-gray-400 w-6 text-right shrink-0 select-none">{idx + 1}</span>

                          {/* Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleStudentToggle(student.id, !!checked)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />

                          {/* Name */}
                          <span className="flex-1 text-sm font-medium text-foreground cursor-pointer" onClick={() => handleStudentToggle(student.id, !isSelected)}>
                            {student.name}
                          </span>

                          {/* Selected checkmark */}
                          {isSelected && <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />}

                          {/* Note indicator */}
                          {note && !noteOpen && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 font-medium shrink-0">note</span>
                          )}

                          {/* HubSpot-style action buttons */}
                          <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            {/* Note */}
                            <button
                              type="button"
                              onClick={() => toggleNoteRow(student.id)}
                              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-[10px] font-medium transition-colors min-w-[36px] ${
                                noteOpen || note
                                  ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                                  : "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              }`}
                              title="Add note"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Note</span>
                            </button>

                            {/* Email */}
                            <button
                              type="button"
                              onClick={() => student.guardian_email && window.open(`mailto:${student.guardian_email}`)}
                              disabled={!student.guardian_email}
                              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-[10px] font-medium transition-colors min-w-[36px] ${
                                student.guardian_email
                                  ? "text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  : "text-gray-200 dark:text-gray-700 cursor-not-allowed"
                              }`}
                              title={student.guardian_email || "No email on file"}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span>Email</span>
                            </button>

                            {/* Call */}
                            <button
                              type="button"
                              onClick={() => student.guardian_contact && window.open(`tel:${student.guardian_contact}`)}
                              disabled={!student.guardian_contact}
                              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-[10px] font-medium transition-colors min-w-[36px] ${
                                student.guardian_contact
                                  ? "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  : "text-gray-200 dark:text-gray-700 cursor-not-allowed"
                              }`}
                              title={student.guardian_contact || "No phone on file"}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>Call</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable notes row */}
                        {noteOpen && (
                          <div className={`px-12 py-2 border-t border-dashed border-gray-200 dark:border-gray-700 ${
                            idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"
                          }`}>
                            <Input
                              placeholder={`Note for ${student.name}…`}
                              value={note}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(student.id, e.target.value)}
                              className="h-8 text-xs border-amber-200 focus-visible:ring-amber-400 bg-amber-50/50 dark:bg-amber-900/10"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* Selection summary */}
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
                {studentNotes.size > 0 && (
                  <span className="text-xs text-amber-600 font-medium">· {studentNotes.size} note{studentNotes.size > 1 ? "s" : ""}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedStudents(new Set()); setStudentNotes(new Map()); setExpandedNotes(new Set()); }}
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
