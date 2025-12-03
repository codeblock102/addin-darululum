import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";

type Recipient = { id: string; name: string; teacherId: string; classId: string };

type InboxRow = {
  id: string;
  message: string;
  subject?: string | null;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
};

export default function ParentMessages() {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const parentId = session?.user?.id || "";

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [filterTeacherId, setFilterTeacherId] = useState<string>("all");

  // Build teacher recipients for this parent's children
  const { data: teacherRecipients, isLoading: recipientsLoading } = useQuery<Recipient[]>({
    queryKey: ["parent-teacher-recipients", parentId],
    queryFn: async () => {
      if (!parentId) return [] as Recipient[];

      // 1) Get child IDs from consolidated parents table; fallback to parent_children
      let childIds: string[] = [];
      type ParentsRow = { student_ids?: string[] };
      const { data: parentRow } = await (supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: ParentsRow[] | null }> };
        };
      })
        .from("parents")
        .select("student_ids")
        .eq("id", parentId);
      childIds = Array.from(new Set(((parentRow || []) as ParentsRow[]).flatMap((r) => r.student_ids || [])));
      if (childIds.length === 0) {
        type ParentChildrenRow = { student_id: string };
        const { data: pcRows } = await (supabase as unknown as {
          from: (table: string) => {
            select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: ParentChildrenRow[] | null }> };
          };
        })
          .from("parent_children")
          .select("student_id")
          .eq("parent_id", parentId);
        childIds = Array.from(new Set(((pcRows || []) as ParentChildrenRow[]).map((r) => r.student_id)));
      }
      if (childIds.length === 0) return [] as Recipient[];

      // 2) Prefer classes where current_students contains any of the parent's children
      const { data: memberClasses, error: memberErr } = await supabase
        .from("classes")
        .select("id, name, teacher_ids, current_students")
        .overlaps("current_students", childIds);
      if (memberErr) throw memberErr;

      type MemberClassRow = { id: string; name?: string | null; teacher_ids?: string[] | null; current_students?: string[] | null };
      let classList: Array<{ id: string; name?: string | null; teacher_ids?: string[] | null }> = (memberClasses || []) as MemberClassRow[];

      // Fallback: if no classes found via membership, use students.class_ids
      if (!classList || classList.length === 0) {
        const { data: studentRows, error: studErr } = await supabase
          .from("students")
          .select("id, class_ids")
          .in("id", childIds);
        if (studErr) throw studErr;
        const classIds = Array.from(new Set(((studentRows || []) as { class_ids?: string[] }[]).flatMap((r) => r.class_ids || [])));
        if (classIds.length === 0) return [] as Recipient[];

        const { data: classRows, error: classErr } = await supabase
          .from("classes")
          .select("id, name, teacher_ids")
          .in("id", classIds);
        if (classErr) throw classErr;
        classList = (classRows || []) as Array<{ id: string; name?: string | null; teacher_ids?: string[] | null }>;
      }

      const teacherIds = Array.from(new Set(classList.flatMap((c) => (c.teacher_ids || []) as string[])));
      if (teacherIds.length === 0) return [] as Recipient[];

      // 4) Resolve teacher names and subjects
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, name, subject")
        .in("id", teacherIds);
      if (profErr) throw profErr;
      const teacherInfoById = new Map(
        ((profiles || []) as Array<{ id: string; name: string | null; subject: string | null }>).map((p) => [
          p.id,
          { name: p.name || "Teacher", subject: p.subject || "General" },
        ])
      );

      // Build recipients as "Teacher Name - Subject" with teacherId as id (deduplicated by teacher)
      const recipsMap = new Map<string, Recipient>();
      for (const tid of teacherIds) {
        const teacherInfo = teacherInfoById.get(tid);
        if (teacherInfo) {
          const tName = teacherInfo.name.trim();
          const tSubject = teacherInfo.subject.trim();
          const label = `${tName} - ${tSubject}`;
          // Use teacherId as the id (not composite), so each teacher appears only once
          if (!recipsMap.has(tid)) {
            recipsMap.set(tid, { id: tid, name: label, teacherId: tid, classId: "" });
          }
        }
      }
      return Array.from(recipsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!parentId,
    staleTime: 60_000,
  });

  // Fetch inbox and sent for this parent from communications
  const { data: inbox, isLoading: inboxLoading } = useQuery<InboxRow[]>({
    queryKey: ["parent-inbox", parentId],
    queryFn: async () => {
      if (!parentId) return [] as InboxRow[];
      const { data, error } = await supabase
        .from("communications")
        .select("id, message, subject, created_at, sender_id, recipient_id, read")
        .eq("recipient_id", parentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!parentId,
  });

  const { data: sent, isLoading: sentLoading } = useQuery<InboxRow[]>({
    queryKey: ["parent-sent", parentId],
    queryFn: async () => {
      if (!parentId) return [] as InboxRow[];
      const { data, error } = await supabase
        .from("communications")
        .select("id, message, subject, created_at, sender_id, recipient_id, read")
        .eq("sender_id", parentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!parentId,
  });

  // Thread modal for parent: load full conversation with selected teacher
  const [openThreadPeerId, setOpenThreadPeerId] = useState<string | null>(null);
  const { data: threadMessages } = useQuery<InboxRow[] | null>({
    queryKey: ["parent-thread", parentId, openThreadPeerId],
    queryFn: async () => {
      if (!parentId || !openThreadPeerId) return [] as InboxRow[];
      const { data, error } = await supabase
        .from("communications")
        .select("id, message, subject, created_at, sender_id, recipient_id, read")
        .in("sender_id", [parentId, openThreadPeerId])
        .in("recipient_id", [parentId, openThreadPeerId])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!parentId && !!openThreadPeerId,
  });

  // Resolve teacher names for inbox senders and sent recipients
  const inboxSenderIds = useMemo(() => Array.from(new Set(((inbox || []).map((m) => m.sender_id)).filter(Boolean))), [inbox]);
  const sentRecipientIds = useMemo(() => Array.from(new Set(((sent || []).map((m) => m.recipient_id)).filter(Boolean))), [sent]);

  const { data: inboxSenderProfiles } = useQuery({
    queryKey: ["parent-inbox-sender-profiles", inboxSenderIds],
    queryFn: async () => {
      if (!inboxSenderIds || inboxSenderIds.length === 0) return [] as Array<{ id: string; name: string | null }>;
      const { data, error } = await supabase.from("profiles").select("id, name").in("id", inboxSenderIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string | null }>;
    },
    enabled: (inboxSenderIds || []).length > 0,
    staleTime: 60_000,
  });

  const { data: sentRecipientProfiles } = useQuery({
    queryKey: ["parent-sent-recipient-profiles", sentRecipientIds],
    queryFn: async () => {
      if (!sentRecipientIds || sentRecipientIds.length === 0) return [] as Array<{ id: string; name: string | null }>;
      const { data, error } = await supabase.from("profiles").select("id, name").in("id", sentRecipientIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string | null }>;
    },
    enabled: (sentRecipientIds || []).length > 0,
    staleTime: 60_000,
  });

  const inboxSenderIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of (inboxSenderProfiles || [])) map.set(p.id, p.name || "Teacher");
    return map;
  }, [inboxSenderProfiles]);

  const sentRecipientIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of (sentRecipientProfiles || [])) map.set(p.id, p.name || "Teacher");
    return map;
  }, [sentRecipientProfiles]);

  // Build teacher filter options from recipients and present messages
  const teacherIdToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of (teacherRecipients || [])) m.set(r.teacherId, r.name.replace(/\s-\s.*$/, ""));
    for (const [id, name] of (inboxSenderIdToName || new Map<string, string>())) m.set(id, name);
    for (const [id, name] of (sentRecipientIdToName || new Map<string, string>())) m.set(id, name);
    return m;
  }, [teacherRecipients, inboxSenderIdToName, sentRecipientIdToName]);

  const teacherFilterOptions = useMemo(() => {
    const opts: Array<{ id: string; label: string }> = [{ id: "all", label: "All teachers" }];
    const pairs = Array.from(teacherIdToName.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    for (const [id, name] of pairs) opts.push({ id, label: name });
    return opts;
  }, [teacherIdToName]);

  const filteredInbox = useMemo(() => {
    if (filterTeacherId === "all") return inbox || [];
    return (inbox || []).filter((m) => m.sender_id === filterTeacherId);
  }, [inbox, filterTeacherId]);

  const filteredSent = useMemo(() => {
    if (filterTeacherId === "all") return sent || [];
    return (sent || []).filter((m) => m.recipient_id === filterTeacherId);
  }, [sent, filterTeacherId]);

  const isSendingDisabled = useMemo(() => {
    return !parentId || !messageText.trim() || !selectedRecipientId || recipientsLoading;
  }, [parentId, messageText, selectedRecipientId, recipientsLoading]);

  const [sending, setSending] = useState(false);
  const openThreadWithPeer = async (peerId: string) => {
    try {
      await supabase
        .from("communications")
        .update({ read: true })
        .eq("recipient_id", parentId)
        .eq("sender_id", peerId)
        .eq("read", false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["parent-inbox", parentId] }),
        queryClient.invalidateQueries({ queryKey: ["unread-count", parentId] }),
      ]);
    } catch {
      // ignore
    }
    setOpenThreadPeerId(peerId);
  };
  const handleSend = async () => {
    if (isSendingDisabled) return;
    try {
      setSending(true);
      // selectedRecipientId is now directly the teacherId (no composite ID)
      const teacherId = selectedRecipientId || "";

      // Pre-send email notify attached to button click
      try {
        const senderName = (session?.user?.user_metadata?.name as string) || "Parent";
        const notifySubject = `You have received a message from ${senderName}`;
        const notifyBody = `${senderName} wrote:\n\n${messageText.trim()}\n\nPlease sign in to view and reply.`;
        // Resolve teacher email
        type TeacherRow = { id: string; email: string | null };
        const emails: string[] = [];
        const { data: tRows } = await supabase.from("teachers").select("id, email").eq("id", teacherId).limit(1);
        const tEmail = ((tRows || []) as TeacherRow[])[0]?.email;
        if (tEmail && tEmail.includes("@")) emails.push(tEmail);
        if (emails.length === 0) {
          const { data: pRows } = await (supabase as unknown as {
            from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: Array<{ id: string; email?: string | null }> | null }> } };
          }).from("profiles").select("id, email").eq("id", teacherId);
          const pEmail = ((pRows || []) as Array<{ id: string; email?: string | null }>)[0]?.email;
          if (pEmail && pEmail.includes("@")) emails.push(pEmail);
        }
        if (emails.length > 0) {
          // Try supabase.invoke first
          const { error: invErr } = await supabase.functions.invoke("send-teacher-message", { body: { recipients: emails, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: parentId } });
          if (invErr) {
            // Fallback to direct fetch with headers
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token || "";
            await fetch(`${SUPABASE_URL}/functions/v1/send-teacher-message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_PUBLISHABLE_KEY,
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
              },
              body: JSON.stringify({ recipients: emails, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: parentId }),
            });
          }
        }
      } catch { /* ignore */ }
      const { error } = await supabase.from("communications").insert({
        sender_id: parentId,
        recipient_id: teacherId,
        message: messageText.trim(),
        subject: subject.trim() || null,
        parent_message_id: replyParentId,
        read: false,
        message_type: "direct",
        category: "general",
      });
      if (error) throw error;
      // Try to notify teacher via email function by resolving teacher's email
      try {
        type TeacherRow = { id: string; email: string | null };
        const emails: string[] = [];
        // Primary: teachers table
        const { data: tRows } = await supabase
          .from("teachers")
          .select("id, email")
          .eq("id", teacherId)
          .limit(1);
        const tEmail = ((tRows || []) as TeacherRow[])[0]?.email;
        if (tEmail && tEmail.includes("@")) emails.push(tEmail);
        // Fallback: profiles.email (if present in schema)
        if (emails.length === 0) {
          const { data: pRows } = await (supabase as unknown as {
            from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: Array<{ id: string; email?: string | null }> | null }> } };
          }).from("profiles").select("id, email").eq("id", teacherId);
          const pEmail = ((pRows || []) as Array<{ id: string; email?: string | null }>)[0]?.email;
          if (pEmail && pEmail.includes("@")) emails.push(pEmail);
        }
        if (emails.length > 0) {
          const senderName = (session?.user?.user_metadata?.name as string) || "Parent";
          const notifySubject = `You have received a message from ${senderName}`;
          const notifyBody = `${senderName} wrote:\n\n${messageText.trim()}\n\nPlease sign in to view and reply.`;
          await supabase.functions.invoke("send-teacher-message", { body: { recipients: emails, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: parentId } });
        }
      } catch { /* ignore */ }
      toast({ title: "Message sent", description: "Sent to teacher" });
      setMessageText("");
      setSelectedRecipientId("");
      setSubject("");
      setReplyParentId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["parent-sent", parentId] }),
        queryClient.invalidateQueries({ queryKey: ["parent-inbox", parentId] }),
      ]);
    } catch (e) {
      console.error("[ParentMessages] send error:", e);
      toast({ title: "Failed to send", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Message Teacher</CardTitle>
          <CardDescription>Send a message to your child's teacher.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId} disabled={recipientsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={recipientsLoading ? "Loading teachers..." : ((teacherRecipients || []).length > 0 ? "Select teacher" : "No teachers found")} />
                </SelectTrigger>
                <SelectContent>
                  {(teacherRecipients || []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                  {(!recipientsLoading && (!teacherRecipients || teacherRecipients.length === 0)) && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No teachers found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
              <Label>Message</Label>
              <Textarea ref={messageRef} rows={5} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." />
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

      <div className="flex items-center justify-end gap-3">
        <div className="w-64">
          <Label>Filter by Teacher</Label>
          <Select value={filterTeacherId} onValueChange={setFilterTeacherId}>
            <SelectTrigger>
              <SelectValue placeholder="All teachers" />
            </SelectTrigger>
            <SelectContent>
              {teacherFilterOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                {(filteredInbox || []).map((m) => {
                  const teacherName = inboxSenderIdToName.get(m.sender_id) || m.sender_id;
                  // Try to choose a recipient option for this teacher to support reply
                  const replyOption = (teacherRecipients || []).find((r) => r.teacherId === m.sender_id);
                  return (
                    <li key={m.id} className="p-3 border rounded-md text-sm hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => openThreadWithPeer(m.sender_id)}>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="text-xs font-medium underline underline-offset-2 hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (replyOption) setSelectedRecipientId(replyOption.id);
                            setSubject((prev) => {
                              const current = prev.trim();
                              if (current.toUpperCase().startsWith("RE:")) return current;
                              const base = current || "";
                              return base ? `RE: ${base}` : "RE:";
                            });
                            setReplyParentId(m.id);
                            setTimeout(() => messageRef.current?.focus(), 0);
                          }}
                        >
                          {teacherName}
                        </button>
                        <div className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                      {!m.read && (
                        <div className="mt-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600 align-middle" />
                          <span className="sr-only">Unread</span>
                        </div>
                      )}
                      <div className="mt-1 text-sm font-medium truncate max-w-[80%]">{m.subject ? `Subject: ${m.subject}` : ''}</div>
                      <div className="mt-1 truncate">{m.message}</div>
                    </li>
                  );
                })}
                {(filteredInbox || []).length === 0 && <div className="text-center text-muted-foreground py-6">No messages</div>}
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
                {(filteredSent || []).map((m) => {
                  const teacherName = sentRecipientIdToName.get(m.recipient_id) || m.recipient_id;
                  return (
                    <li
                      key={m.id}
                      className="p-3 border rounded-md text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setOpenThreadPeerId(m.recipient_id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">To: {teacherName}</span>
                        <div className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                      {m.subject && <div className="mt-1 text-sm font-medium truncate">Subject: {m.subject}</div>}
                      <div className="mt-1 truncate">{m.message}</div>
                    </li>
                  );
                })}
                {(filteredSent || []).length === 0 && <div className="text-center text-muted-foreground py-6">No messages</div>}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!openThreadPeerId} onOpenChange={(v) => !v && setOpenThreadPeerId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {(threadMessages || []).map((tm) => (
              <div key={tm.id} className="p-3 border rounded-md text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{tm.sender_id === parentId ? "You" : "Teacher"}</span>
                  <div className="text-muted-foreground text-xs">{new Date(tm.created_at).toLocaleString()}</div>
                </div>
                {tm.subject && <div className="mt-1 text-sm font-medium">Subject: {tm.subject}</div>}
                <div className="mt-1 whitespace-pre-wrap">{tm.message}</div>
              </div>
            ))}
            {(threadMessages || []).length === 0 && <div className="text-center text-muted-foreground py-6">No messages</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


