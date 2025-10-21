import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { Message, MessageRecipient } from "@/types/progress.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

type InboxRow = Pick<Message, "id" | "message" | "created_at" | "sender_id" | "recipient_id" | "read">;

export default function TeacherMessages() {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const teacherId = session?.user?.id || "";

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [messageText, setMessageText] = useState("");

  // Fetch teacher's students via classes → students (uses classes.teacher_id, classes.teacher_ids[], classes.current_students)
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["messages-teacher-students", teacherId],
    queryFn: async () => {
      if (!teacherId) return [] as { id: string; name: string }[];
      console.log("[TeacherMessages] teacherId:", teacherId);
      // 1) Get classes where this teacher is assigned (consider both single and array fields)
      const { data: classesByOwner, error: errOwner } = await supabase
        .from("classes")
        .select("id, current_students")
        .eq("teacher_id", teacherId);
      if (errOwner) throw errOwner;
      const { data: classesByArray, error: errArray } = await supabase
        .from("classes")
        .select("id, current_students")
        .contains("teacher_ids", [teacherId]);
      if (errArray) throw errArray;
      const allClasses = [...(classesByOwner || []), ...(classesByArray || [])] as Array<{ id: string; current_students: string[] | null }>;
      const classIds = Array.from(new Set(allClasses.map((c) => c.id)));
      console.log("[TeacherMessages] classIds for teacher:", classIds);
      if (classIds.length === 0) return [] as { id: string; name: string }[];

      // 2) Prefer student IDs from classes.current_students (if populated)
      const currentStudentIds = Array.from(new Set((allClasses || [])
        .flatMap((c) => Array.isArray(c.current_students) ? c.current_students : [])
        .filter(Boolean))) as string[];
      console.log("[TeacherMessages] current_students IDs:", currentStudentIds);

      if (currentStudentIds.length > 0) {
        const { data: studentRows, error: stErr } = await supabase
          .from("students")
          .select("id, name")
          .in("id", currentStudentIds);
        if (stErr) throw stErr;
        const resolved = (studentRows || []) as { id: string; name: string }[];
        console.log("[TeacherMessages] resolved students from current_students:", resolved);
        return resolved;
      }

      // 3) Fallback: students whose class_ids overlaps those classes
      const { data: classStudents, error: csErr } = await supabase
        .from("students")
        .select("id, name")
        .overlaps("class_ids", classIds);
      if (csErr) throw csErr;
      const classResolved = (classStudents || []) as { id: string; name: string }[];
      console.log("[TeacherMessages] class-based resolved students (fallback class_ids):", classResolved);
      return classResolved;
    },
    enabled: !!teacherId,
    staleTime: 60_000,
  });

  // Build parent recipients directly from students' guardian emails (fallback when no consolidated parents table)
  const { data: parentRecipients, isLoading: parentsLoading } = useQuery<MessageRecipient[]>({
    queryKey: ["messages-parent-recipients", students?.map((s) => s.id)],
    queryFn: async () => {
      const studentIds = (students || []).map((s) => s.id);
      if (studentIds.length === 0) return [] as MessageRecipient[];
      const { data: studentRows, error } = await supabase
        .from("students")
        .select("id, name, guardian_name, guardian_email, secondary_guardian_email")
        .in("id", studentIds);
      if (error) throw error;
      const emailToLabel = new Map<string, string>();
      for (const s of (studentRows || []) as Array<{ id: string; name: string; guardian_name?: string | null; guardian_email?: string | null; secondary_guardian_email?: string | null }>) {
        const emailsRaw = [s.guardian_email, s.secondary_guardian_email].filter(Boolean).join(",");
        const emails = emailsRaw
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
        for (const e of emails) {
          if (!emailToLabel.has(e)) {
            const label = `${s.name}'s parent`;
            emailToLabel.set(e, label);
          }
        }
      }
      const recips: MessageRecipient[] = Array.from(emailToLabel.entries()).map(([email, label]) => ({ id: email, name: label, type: "parent" }));
      console.log("[TeacherMessages] derived parent emails count:", recips.length);
      if (recips.length > 0) recips.unshift({ id: "__all_parents__", name: "All Parents", type: "parent", isSpecial: true });
      return recips;
    },
    enabled: (students || []).length > 0,
    staleTime: 60_000,
  });

  // Debug: log recipients when they load/update
  useEffect(() => {
    if (parentRecipients) {
      console.log("[TeacherMessages] Parent recipients:", parentRecipients);
    }
  }, [parentRecipients]);

  // Fetch inbox and sent for teacher from communications
  const { data: inbox, isLoading: inboxLoading } = useQuery<InboxRow[]>({
    queryKey: ["teacher-inbox", teacherId],
    queryFn: async () => {
      if (!teacherId) return [] as InboxRow[];
      const { data, error } = await supabase
        .from("communications")
        .select("id, message, created_at, sender_id, recipient_id, read")
        .eq("recipient_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!teacherId,
  });

  const { data: sent, isLoading: sentLoading } = useQuery<InboxRow[]>({
    queryKey: ["teacher-sent", teacherId],
    queryFn: async () => {
      if (!teacherId) return [] as InboxRow[];
      const { data, error } = await supabase
        .from("communications")
        .select("id, message, created_at, sender_id, recipient_id, read")
        .eq("sender_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!teacherId,
  });

  const isSendingDisabled = useMemo(() => {
    return !teacherId || !messageText.trim() || !selectedRecipientId || (parentsLoading || studentsLoading);
  }, [teacherId, messageText, selectedRecipientId, parentsLoading, studentsLoading]);

  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (isSendingDisabled) return;
    try {
      setSending(true);
      const recipients: string[] = selectedRecipientId === "__all_parents__"
        ? (parentRecipients || []).filter((r) => r.id !== "__all_parents__").map((r) => r.id)
        : [selectedRecipientId];
      if (recipients.length === 0) return;

      // Debug: log selected recipient and resolved recipient IDs
      console.log("[TeacherMessages] Selected recipientId:", selectedRecipientId);
      console.log("[TeacherMessages] Sending to recipient IDs:", recipients);

      // If recipient identifiers are emails, send via edge function; else use communications table
      const emailRecipients = recipients.filter((id) => id.includes("@"));
      if (emailRecipients.length > 0) {
        // Try standard invoke first
        const { data: _data, error } = await supabase.functions.invoke("send-teacher-message", {
          body: {
            recipients: emailRecipients,
            subject: "Message from your child's teacher",
            body: messageText.trim(),
            fromName: "Teacher",
          },
        });
        const err: unknown = error as unknown;
        let ok = !err;

        // Fallback: direct fetch to edge function with auth headers (handles some client/env issues)
        if (!ok) {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token || "";
          const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-teacher-message`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
            body: JSON.stringify({
              recipients: emailRecipients,
              subject: "Message from your child's teacher",
              body: messageText.trim(),
              fromName: "Teacher",
            }),
          });
          ok = resp.ok;
          if (!ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(text || "Edge function call failed");
          }
        }
        toast({ title: "Message sent", description: selectedRecipientId === "__all_parents__" ? `Sent to ${emailRecipients.length} parents` : "Sent successfully" });
      } else {
        // In-app messaging (recipient ids expected to be user UUIDs)
        const rows = recipients.map((rid) => ({ sender_id: teacherId, recipient_id: rid, message: messageText.trim(), read: false, message_type: "direct", category: "general" }));
        const { error } = await supabase.from("communications").insert(rows);
        if (error) throw error;
        toast({ title: "Message sent", description: selectedRecipientId === "__all_parents__" ? `Sent to ${recipients.length} recipients` : "Sent successfully" });
      }
      setMessageText("");
      setSelectedRecipientId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-sent", teacherId] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-inbox", teacherId] }),
      ]);
    } catch (e) {
      console.error("[TeacherMessages] send error:", e);
      toast({ title: "Failed to send", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Message Parents</CardTitle>
          <CardDescription>Send a message to a specific parent or to all parents of your students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId} disabled={parentsLoading || studentsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={parentsLoading ? "Loading recipients..." : (parentRecipients && parentRecipients.length > 0 ? "Select recipient" : "No recipients found")} />
                </SelectTrigger>
                <SelectContent>
                  {(parentRecipients || []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                  {(!parentsLoading && (!parentRecipients || parentRecipients.length === 0)) && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No recipients found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Message</Label>
              <Textarea rows={5} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={isSendingDisabled || sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {sending ? "Sending" : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Messages sent to you</CardDescription>
          </CardHeader>
          <CardContent>
            {inboxLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
            ) : (
              <ul className="space-y-3">
                {(inbox || []).map((m) => (
                  <li key={m.id} className="p-3 border rounded-md text-sm">
                    <div className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleString()}</div>
                    <div className="mt-1">{m.message}</div>
                  </li>
                ))}
                {(inbox || []).length === 0 && <div className="text-center text-muted-foreground py-6">No messages</div>}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sent</CardTitle>
            <CardDescription>Messages you sent</CardDescription>
          </CardHeader>
          <CardContent>
            {sentLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
            ) : (
              <ul className="space-y-3">
                {(sent || []).map((m) => (
                  <li key={m.id} className="p-3 border rounded-md text-sm">
                    <div className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleString()}</div>
                    <div className="mt-1">{m.message}</div>
                  </li>
                ))}
                {(sent || []).length === 0 && <div className="text-center text-muted-foreground py-6">No messages</div>}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


