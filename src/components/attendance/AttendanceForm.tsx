import { useEffect, useState } from "react";
import { Form } from "@/components/ui/form.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { DateSelector } from "./form/DateSelector.tsx";
import { NotesField } from "./form/NotesField.tsx";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit.ts";
import { StudentGrid } from "./form/StudentGrid.tsx";
import { BulkActions } from "./form/BulkActions.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { LogOut } from "lucide-react";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";

// =================================================================================
// STEP 1: COMPONENT DEFINITION & STATE MANAGEMENT
// =================================================================================
export const AttendanceForm = () => {
  // --- React Hooks ---
  const { session } = useAuth(); // Authentication context to get the current user.
  const { toast } = useToast(); // Hook for displaying toast notifications.
  const { t } = useI18n();
  const { isAdmin, teacherId } = useRBAC();

  // --- Component State ---
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set()); // Tracks which students are selected via checkboxes.
  const [classId, setClassId] = useState<string>("all"); // Holds the ID of the class being filtered. 'all' means no filter.
  const [pendingStatus, setPendingStatus] = useState<string>(""); // Stores the status selected in "Bulk Actions" before it's applied.
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  
  // State related to the email sending process.
  const [isSending, setIsSending] = useState(false); // Used to show loading state on buttons during email sending.
  const [isSavingBeforePreview, setIsSavingBeforePreview] = useState(false); // Loading state for when attendance is saved before sending emails.
  
  // State for the confirmation dialog (formerly used for preview).
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewMap, setPreviewMap] = useState<Record<string, string[]>>({}); // Stores the student-to-parent-email mapping for the preview dialog.


  // =================================================================================
  // STEP 2: FORM INITIALIZATION
  // =================================================================================
  
  // Custom hook to manage the main form's state and submission logic.
  // This hook encapsulates react-hook-form setup.
  const { form, isProcessing } = useAttendanceSubmit({
    onError: (error) => {
      toast({
        title: t("common.error", "Error"),
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // =================================================================================
  // STEP 2a: ADMIN SECTION FILTER SETUP
  // =================================================================================

  // Load available sections for the current admin's madrassah
  useEffect(() => {
    const loadAdminSections = async () => {
      try {
        if (!isAdmin || !teacherId) return;

        const { data: prof } = await supabase
          .from("profiles")
          .select("madrassah_id")
          .eq("id", teacherId)
          .maybeSingle();

        const madrassahId = (prof && "madrassah_id" in prof
          ? (prof.madrassah_id as string | null | undefined)
          : null);
        if (!madrassahId) return;

        const { data: mad } = await supabase
          .from("madrassahs")
          .select("section")
          .eq("id", madrassahId)
          .maybeSingle();

        const rawSections =
          mad && "section" in mad ? (mad.section as unknown) : null;
        const sectionsArr = Array.isArray(rawSections) ? rawSections : [];

        const uniqueSections = Array.from(
          new Set(
            sectionsArr.filter(
              (s) => typeof s === "string" && s.trim().length > 0,
            ),
          ),
        );

        setAvailableSections(uniqueSections);
      } catch (_e) {
        // Non-fatal; leave sections empty on error
      }
    };

    void loadAdminSections();
  }, [isAdmin, teacherId]);

  // Clear any selected students when the filters change
  useEffect(() => {
    setSelectedStudents(new Set());
  }, [classId, sectionFilter]);

  // =================================================================================
  // STEP 3: EVENT HANDLERS
  // =================================================================================

  /**
   * Stages a status for bulk application.
   * This function is called by the `BulkActions` component. It doesn't save the status
   * to the database immediately; it just holds it in the `pendingStatus` state.
   * The `StudentGrid` component then visually indicates this staged status.
   * It also logs the queued students and their parent emails to the console for debugging.
   */
  const handleStageBulkStatus = async (student_ids: string[], status: string) => {
    if (!student_ids || student_ids.length === 0) return;
    setPendingStatus(status);

    // =================================================================================
    // STEP 3a: DEBUG LOGGING FOR STAGING
    // =================================================================================
    console.log(`%c[Attendance Queue] Staging status "${status}" for ${student_ids.length} students. Fetching details...`, 'color: blue; font-weight: bold;');

    try {
      // 1. Fetch student names for logging.
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .in('id', student_ids);

      if (studentsError) throw studentsError;
      const studentNameMap = new Map(students.map(s => [s.id, s.name]));

      // 2. Use the edge function's preview mode to get parent emails without sending.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      const date = form.getValues().date as Date;
      const ymd = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : new Date().toISOString().split('T')[0];
      const body = {
        source: "manual-teacher-debug",
        student_ids,
        date: ymd,
        class_id: classId !== "all" ? classId : undefined,
        preview: true
      };

      // Use direct fetch to avoid any client invoke quirks
      const previewResp = await fetch(`${SUPABASE_URL}/functions/v1/attendance-absence-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          // Provide student IDs also via header as a fallback for body parsing issues
          "x-student-ids": student_ids.join(','),
        },
        body: JSON.stringify(body),
      });
      const previewText = await previewResp.text();
      let previewJson: unknown = {};
      try { previewJson = JSON.parse(previewText || '{}'); } catch { previewJson = {}; }
      type PreviewResponse = { recipients?: Record<string, string[]> };
      const recipients = (previewJson as PreviewResponse).recipients || {};

      // 3. Log the combined information to the console.
      console.log("%c--- Student Queue Details ---", 'color: blue; font-weight: bold;');
      student_ids.forEach(id => {
        console.log({
          studentId: id,
          studentName: studentNameMap.get(id) || "Unknown Name",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          parentEmails: (recipients as Record<string, string[]>)[id] || [],
        });
      });
      console.log("%c--------------------------", 'color: blue; font-weight: bold;');

    } catch (e) {
      const message = formatErrorMessage(e);
      console.error("[Attendance Queue] Error fetching debug info:", message);
    }
  };

  /**
   * Handles the primary action of sending attendance emails.
   * This is a direct-send function without a preview step.
   */
  const handleSendAttendanceEmails = async () => {
    try {
      const studentIds = Array.from(selectedStudents);
      if (studentIds.length === 0) return;

      const date = form.getValues().date as Date;
      const formattedDate = date ? new Date(date) : new Date();
      const ymd = `${formattedDate.getFullYear()}-${String(formattedDate.getMonth() + 1).padStart(2, '0')}-${String(formattedDate.getDate()).padStart(2, '0')}`;

      // --- Persist Staged Status Before Sending ---
      // If a bulk status has been selected, save those attendance records first.
      // This ensures the emails reflect the most recent changes.
      setIsSavingBeforePreview(true);
      if (pendingStatus) {
        const formVals = form.getValues() as { time?: string; notes?: string; late_reason?: string };
        const records = studentIds.map((sid) => ({
          student_id: sid,
          date: ymd,
          time: formVals?.time,
          status: pendingStatus,
          notes: formVals?.notes,
          late_reason: pendingStatus === 'late' ? (formVals?.late_reason || null) : null,
          class_id: classId !== "all" ? classId : null,
        }));
        const { error: upsertErr } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' });
        if (upsertErr) throw upsertErr;
      }
      setIsSavingBeforePreview(false);

      // --- Invoke Supabase Edge Function ---
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      const body = { source: "manual-teacher", student_ids: studentIds, date: ymd, class_id: classId !== "all" ? classId : undefined, force: true };

      // Use direct fetch to ensure body reaches the Edge Function
      console.log("[Attendance UI] Sending via fetch with body:", body);
      let result: unknown = null;
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/attendance-absence-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          // Provide student IDs also via header as a fallback for body parsing issues
          "x-student-ids": studentIds.join(','),
        },
        body: JSON.stringify(body),
      });
      console.log("[Attendance UI] Fetch response status:", resp.status);
      try {
        const rawText = await resp.text();
        console.log("[Attendance UI] Fetch response text:", rawText);
        result = resp.ok ? JSON.parse(rawText) : null;
      } catch (e) {
        console.error("[Attendance UI] Fetch failed to parse JSON:", e);
        result = null;
      }
      console.log("[Attendance UI] Final result object being processed:", result);
      
      // --- Handle Function Response ---
      type EmailResult = { emails_sent?: number; email_sending_enabled?: boolean; email_config_message?: string };
      const emailResult = (result as EmailResult) || {};
      const sent = Number(emailResult.emails_sent || 0);
      const sendingEnabled = Boolean(emailResult.email_sending_enabled);
      const configMessage = emailResult.email_config_message || t("pages.attendance.email.notConfigured", "Email service is not configured. Please check secrets.");
      
      if (!sendingEnabled) {
        toast({ title: t("pages.attendance.email.disabled", "Email Service Disabled"), description: configMessage, variant: "destructive" });
        return;
      }
      
      if (sent > 0) {
        toast({ title: t("pages.attendance.email.sent", "Emails Sent"), description: t("pages.attendance.email.sentDesc", "{count} email(s) were successfully sent to parents.").replace("{count}", String(sent)) });
      } else {
        toast({ title: t("pages.attendance.email.none", "No Emails Sent"), description: t("pages.attendance.email.noneDesc", "No valid parent emails were found for the selected students."), variant: "destructive" });
      }

      // --- Cleanup ---
      // Clear the student selection ("lineup") and the staged status after sending.
      setSelectedStudents(new Set());
      setPendingStatus("");

    } catch (e) {
      const message = formatErrorMessage(e);
      toast({
        title: t("common.error", "Error"),
        description: message || t("pages.attendance.email.failed", "Failed to trigger emails"),
        variant: "destructive",
      });
    }
  };

  /**
   * LEGACY: Handles the confirmation step from the preview dialog.
   * This is currently not used in the direct-send flow but is kept for potential future use.
   */
  const handleConfirmSend = async () => {
    try {
      setIsSending(true);
      const studentIds = Object.keys(previewMap);
      if (studentIds.length === 0) { setConfirmOpen(false); return; }
      const date = form.getValues().date as Date;
      const formattedDate = date ? new Date(date) : new Date();
      const ymd = `${formattedDate.getFullYear()}-${String(formattedDate.getMonth() + 1).padStart(2, '0')}-${String(formattedDate.getDate()).padStart(2, '0')}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      const body = { source: "manual-teacher", student_ids: studentIds, date: ymd, class_id: classId !== "all" ? classId : undefined, force: true };

      await fetch(`${SUPABASE_URL}/functions/v1/attendance-absence-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          // Provide student IDs also via header as a fallback for body parsing issues
          "x-student-ids": studentIds.join(','),
        },
        body: JSON.stringify(body),
      });
      toast({ title: t("pages.attendance.email.queued", "Emails Queued"), description: t("pages.attendance.email.queuedDesc", "Attendance emails are being sent to parents.") });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: t("common.error", "Error"), description: message || t("pages.attendance.email.sendFailed", "Failed to send emails"), variant: "destructive" });
    } finally {
      setIsSending(false);
      setConfirmOpen(false);
      setPreviewMap({});
    }
  };

  /**
   * Toggles the selection state of a single student.
   */
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(studentId)) newSelected.delete(studentId);
      else newSelected.add(studentId);
      return newSelected;
    });
  };

  /**
   * Toggles the selection state for all visible students.
   */
  const handleSelectAll = (students: { id: string }[] = []) => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map((s) => s.id)));
  };

  // =================================================================================
  // STEP 4: DATA FETCHING
  // =================================================================================
  
  // Fetches the list of classes assigned to the current teacher.
  // This is used to populate the class filter dropdown.
  interface TeacherClassRow { id: string; name?: string; teacher_ids?: string[] }
  const { data: teacherClasses = [] } = useQuery<TeacherClassRow[]>({
    queryKey: ["teacher-classes", session?.user?.id],
    queryFn: async () => {
      const uid = session?.user?.id;
      if (!uid) return [] as TeacherClassRow[];
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, teacher_ids")
        .contains("teacher_ids", [uid]);
      if (error) throw error;
      return (data || []) as TeacherClassRow[];
    },
    enabled: !!session?.user?.id, // Only run the query if the user session is available.
  });

  // =================================================================================
  // STEP 5: COMPONENT RENDERING (JSX)
  // =================================================================================
  return (
    <>
    <Form {...form}>
      <div className="space-y-6">
        {/* --- Date and Time Selection Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.attendance.form.dateTime.title", "Date and Time")}</CardTitle>
            <CardDescription>
              {t("pages.attendance.form.dateTime.desc", "Select the date and time for the attendance records.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DateSelector form={form} />
          </CardContent>
        </Card>

        {/* --- Student Selection Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.attendance.form.students.title", "Select Students")}</CardTitle>
            <CardDescription>
              {t("pages.attendance.form.students.desc", "Choose the students to mark attendance for.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Class & Section Filters */}
            {(teacherClasses && teacherClasses.length > 0) || (isAdmin && availableSections.length > 0) ? (
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                {teacherClasses && teacherClasses.length > 0 && (
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger className="w-[260px] sm:w-[280px]">
                      <SelectValue placeholder={t("pages.attendance.form.students.filterPlaceholder", "Filter by class (optional)")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("pages.attendance.form.students.allClasses", "All my classes")}</SelectItem>
                      {teacherClasses.map((c: { id: string; name?: string }) => (
                        <SelectItem key={c.id} value={c.id}>{c.name || c.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {isAdmin && availableSections.length > 0 && (
                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger className="w-[260px] sm:w-[280px]">
                      <SelectValue placeholder={t("pages.attendance.form.students.sectionFilterPlaceholder", "Filter by section (optional)")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("pages.attendance.form.students.allSections", "All sections")}
                      </SelectItem>
                      {availableSections.map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : null}
            {/* Student Grid */}
            <StudentGrid
              user={session?.user ?? null}
              selectedStudents={selectedStudents}
              onStudentSelect={handleStudentSelect}
              onSelectAll={handleSelectAll}
              classId={classId !== "all" ? classId : undefined}
              stagedStatus={pendingStatus || undefined}
              sectionFilter={isAdmin && sectionFilter !== "all" ? sectionFilter : undefined}
              dateYmd={(function() {
                const d = form.getValues().date as Date | undefined;
                const dd = d ? new Date(d) : new Date();
                return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
              })()}
            />
          </CardContent>
        </Card>

        {/* --- Bulk Actions Card (only visible when students are selected) --- */}
        {selectedStudents.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.attendance.form.bulk.title", "Bulk Actions")}</CardTitle>
              <CardDescription>
                {t("pages.attendance.form.bulk.desc", "Apply the same attendance status to all selected students.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-indigo-200 bg-indigo-50/80 text-indigo-900">
                <LogOut className="h-4 w-4 text-indigo-600" />
                <AlertTitle>{t("pages.attendance.form.earlyDepartureTitle", "Early departures")}</AlertTitle>
                <AlertDescription>
                  {t(
                    "pages.attendance.form.earlyDepartureDesc",
                    "Use the Early Departure option when a student leaves before dismissal. Set the time selector above to the actual pick-up time so parents receive the correct information."
                  )}
                </AlertDescription>
              </Alert>
              <BulkActions
                form={form}
                selectedStudents={selectedStudents}
                onClear={() => setSelectedStudents(new Set())}
                isSubmitting={isProcessing}
                onSubmit={handleStageBulkStatus}
              />
              <div className="mt-4">
                {/* The main button to send emails */}
                <button
                  className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                  type="button"
                  onClick={handleSendAttendanceEmails}
                  disabled={selectedStudents.size === 0 || isProcessing || isSavingBeforePreview}
                >
                  {t("pages.attendance.form.bulk.sendEmails", "Send attendance emails")}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Additional Notes Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.attendance.form.notes.title", "Additional Notes")}</CardTitle>
            <CardDescription>
              {t("pages.attendance.form.notes.desc", "Add any relevant notes for this attendance record.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotesField form={form} />
          </CardContent>
        </Card>
      </div>
    </Form>

    {/* --- Confirmation Dialog (Legacy) --- */}
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("pages.attendance.dialog.title", "Confirm recipients")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("pages.attendance.dialog.desc", "The following parents will receive attendance emails:")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-64 overflow-auto text-sm text-black">
          {Object.entries(previewMap).length === 0 ? (
            <p>{t("pages.attendance.dialog.none", "No recipients found.")}</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {Object.entries(previewMap).map(([studentId, emails]) => (
                <li key={studentId}>
                  <span className="font-medium">{studentId}:</span> {emails.join(', ')}
                </li>
              ))}
            </ul>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>{t("common.cancel", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmSend} disabled={isSending}>
            {isSending ? t("pages.attendance.dialog.sending", "Sending...") : t("pages.attendance.dialog.sendNow", "Send now")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
