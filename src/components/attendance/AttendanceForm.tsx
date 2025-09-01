import { useState } from "react";
import { Form } from "@/components/ui/form.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { DateSelector } from "./form/DateSelector.tsx";
import { NotesField } from "./form/NotesField.tsx";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit.ts";
import { StudentGrid } from "./form/StudentGrid.tsx";
import { BulkActions } from "./form/BulkActions.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
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

// =================================================================================
// STEP 1: COMPONENT DEFINITION & STATE MANAGEMENT
// =================================================================================
export const AttendanceForm = () => {
  // --- React Hooks ---
  const { session } = useAuth(); // Authentication context to get the current user.
  const { toast } = useToast(); // Hook for displaying toast notifications.

  // --- Component State ---
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set()); // Tracks which students are selected via checkboxes.
  const [classId, setClassId] = useState<string>("all"); // Holds the ID of the class being filtered. 'all' means no filter.
  const [pendingStatus, setPendingStatus] = useState<string>(""); // Stores the status selected in "Bulk Actions" before it's applied.
  
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
    onError: (error: Error) =>
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      }),
  });

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
      let previewJson: any = {};
      try { previewJson = JSON.parse(previewText || '{}'); } catch { previewJson = {}; }
      const recipients = previewJson.recipients || {};

      // 3. Log the combined information to the console.
      console.log("%c--- Student Queue Details ---", 'color: blue; font-weight: bold;');
      student_ids.forEach(id => {
        console.log({
          studentId: id,
          studentName: studentNameMap.get(id) || "Unknown Name",
          parentEmails: recipients[id] || [], // Show the actual empty array if no emails are found
        });
      });
      console.log("%c--------------------------", 'color: blue; font-weight: bold;');

    } catch (e: any) {
      console.error("[Attendance Queue] Error fetching debug info:", e.message);
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
        const formVals: any = form.getValues();
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
      let result: any = null;
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
      const sent = Number(result?.emails_sent || 0);
      const sendingEnabled = Boolean(result?.email_sending_enabled);
      const configMessage = result?.email_config_message || "Email service is not configured. Please check secrets.";
      
      if (!sendingEnabled) {
        toast({ title: "Email Service Disabled", description: configMessage, variant: "destructive" });
        return;
      }
      
      if (sent > 0) {
        toast({ title: "Emails Sent", description: `${sent} email(s) were successfully sent to parents.` });
      } else {
        toast({ title: "No Emails Sent", description: "No valid parent emails were found for the selected students.", variant: "destructive" });
      }

      // --- Cleanup ---
      // Clear the student selection ("lineup") and the staged status after sending.
      setSelectedStudents(new Set());
      setPendingStatus("");

    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to trigger emails", variant: "destructive" });
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
      toast({ title: "Emails Queued", description: "Attendance emails are being sent to parents." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to send emails", variant: "destructive" });
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
  const { data: teacherClasses = [] } = useQuery<any[]>({
    queryKey: ["teacher-classes", session?.user?.id],
    queryFn: async () => {
      const uid = session?.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, teacher_ids")
        .contains("teacher_ids", [uid]);
      if (error) throw error;
      return data || [];
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
            <CardTitle>Date and Time</CardTitle>
            <CardDescription>
              Select the date and time for the attendance records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DateSelector form={form} />
          </CardContent>
        </Card>

        {/* --- Student Selection Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>Select Students</CardTitle>
            <CardDescription>
              Choose the students to mark attendance for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Class Filter Dropdown */}
            {teacherClasses && teacherClasses.length > 0 && (
              <div className="mb-4">
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Filter by class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All my classes</SelectItem>
                    {teacherClasses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name || c.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Student Grid */}
            <StudentGrid
              user={session?.user ?? null}
              selectedStudents={selectedStudents}
              onStudentSelect={handleStudentSelect}
              onSelectAll={handleSelectAll}
              classId={classId !== "all" ? classId : undefined}
              stagedStatus={pendingStatus || undefined}
            />
          </CardContent>
        </Card>

        {/* --- Bulk Actions Card (only visible when students are selected) --- */}
        {selectedStudents.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Apply the same attendance status to all selected students.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  Send attendance emails
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Additional Notes Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>
              Add any relevant notes for this attendance record.
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
          <AlertDialogTitle>Confirm recipients</AlertDialogTitle>
          <AlertDialogDescription>
            The following parents will receive attendance emails:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-64 overflow-auto text-sm text-black">
          {Object.entries(previewMap).length === 0 ? (
            <p>No recipients found.</p>
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
          <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmSend} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send now'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
