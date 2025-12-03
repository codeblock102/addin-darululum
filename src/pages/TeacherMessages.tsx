import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { Message as _Message, MessageRecipient } from "@/types/progress.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";

type InboxRow = { id: string; message: string; subject?: string | null; created_at: string; sender_id: string; recipient_id: string; read: boolean };

export default function TeacherMessages() {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const teacherId = session?.user?.id || "";

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [openThreadPeerId, setOpenThreadPeerId] = useState<string | null>(null);
  const [filterParentId, setFilterParentId] = useState<string>("all");
  // Removed student filter per request

  // Fetch recipients' student set based on role:
  // - Teacher: students in classes taught by the teacher
  // - Parent: classmates of the parent's children
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["messages-teacher-students", teacherId],
    queryFn: async () => {
      if (!teacherId) return [] as { id: string; name: string }[];
      console.log("[TeacherMessages] teacherId:", teacherId);
      // Get classes where this teacher is assigned via teacher_ids array
      const { data: classesByArray, error: errArray } = await supabase
        .from("classes")
        .select("id, current_students")
        .contains("teacher_ids", [teacherId]);
      if (errArray) throw errArray;
      const allClasses = (classesByArray || []) as Array<{ id: string; current_students: string[] | null }>;
      const classIds = Array.from(new Set(allClasses.map((c) => c.id)));
      console.log("[TeacherMessages] classIds for teacher:", classIds);
      if (classIds.length === 0) {
        // Parent flow: find classes via user's children → classmates
        console.log("[TeacherMessages] No classes as teacher. Trying parent flow.");
        // 1) from consolidated parents table
        let childIds: string[] = [];
        const { data: parentRow } = await (supabase as unknown as {
          from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: Array<{ student_ids?: string[] }> | null }> } };
        })
          .from("parents")
          .select("student_ids")
          .eq("id", teacherId);
        childIds = Array.from(new Set(((parentRow || []) as { student_ids?: string[] }[]).flatMap((r) => r.student_ids || [])));
        if (childIds.length === 0) {
          // 2) fallback parent_children rows
          const { data: pcRows } = await (supabase as unknown as {
            from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: Array<{ student_id: string }> | null }> } };
          })
            .from("parent_children")
            .select("student_id")
            .eq("parent_id", teacherId);
          childIds = Array.from(new Set(((pcRows || []) as { student_id: string }[]).map((r) => r.student_id)));
        }
        console.log("[TeacherMessages] parent childIds:", childIds);
      
        if (childIds.length === 0) return [] as { id: string; name: string }[];
      
        // Get children's classes
        const { data: childRows, error: childErr } = await supabase
          .from("students")
          .select("id, name, class_ids")
          .in("id", childIds);
        if (childErr) throw childErr;
        const parentClassIds = Array.from(new Set(((childRows || []) as { class_ids?: string[] }[]).flatMap((r) => r.class_ids || [])));
        console.log("[TeacherMessages] parent classIds from children:", parentClassIds);
        if (parentClassIds.length === 0) return [] as { id: string; name: string }[];

        // Prefer classes.current_students to resolve classmates
        const { data: classesRows } = await supabase
          .from("classes")
          .select("id, current_students")
          .in("id", parentClassIds);
        const classmatesByClass = Array.from(new Set(((classesRows || []) as { current_students?: string[] }[]).flatMap((r) => r.current_students || [])));
        let targetStudentIds = classmatesByClass.length > 0 ? classmatesByClass : [];
        if (targetStudentIds.length === 0) {
          // Fallback to students.class_ids overlap
          const { data: classmates } = await supabase
            .from("students")
            .select("id")
            .overlaps("class_ids", parentClassIds);
          targetStudentIds = Array.from(new Set(((classmates || []) as { id: string }[]).map((s) => s.id)));
        }
        // Exclude duplicates and fetch names
        const { data: studentRows2, error: studsErr2 } = await supabase
          .from("students")
          .select("id, name")
          .in("id", targetStudentIds);
        if (studsErr2) throw studsErr2;
        const resolvedClassmates = ((studentRows2 || []) as { id: string; name: string }[]);
        console.log("[TeacherMessages] resolved classmates for parent:", resolvedClassmates);
        return resolvedClassmates;
      }

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
        .select("id, message, subject, created_at, sender_id, recipient_id, read")
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
        .select("id, message, subject, created_at, sender_id, recipient_id, read")
        .eq("sender_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!teacherId,
  });

  // Resolve sender labels for inbox rows
  const senderIds = useMemo(() => Array.from(new Set(((inbox || []).map((m) => m.sender_id)).filter(Boolean))), [inbox]);
  const _inboxMessageIdToSenderId = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of (inbox || [])) map.set(m.id, m.sender_id);
    return map;
  }, [inbox]);
  const { data: parentSenderRows } = useQuery({
    queryKey: ["inbox-parent-senders", senderIds],
    queryFn: async () => {
      if (!senderIds || senderIds.length === 0) return [] as Array<{ id: string; student_ids?: string[] | null }>;
      type ParentsRow = { id: string; student_ids?: string[] | null };
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => { select: (s: string) => { in: (c: string, vals: string[]) => Promise<{ data: ParentsRow[] | null; error: unknown }> } };
      }).from("parents").select("id, student_ids").in("id", senderIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; student_ids?: string[] | null }>;
    },
    enabled: (senderIds || []).length > 0,
    staleTime: 60_000,
  });
  const { data: profileSenderRows } = useQuery({
    queryKey: ["inbox-profile-senders", senderIds],
    queryFn: async () => {
      if (!senderIds || senderIds.length === 0) return [] as Array<{ id: string; name: string | null }>;
      const { data, error } = await supabase.from("profiles").select("id, name").in("id", senderIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string | null }>;
    },
    enabled: (senderIds || []).length > 0,
    staleTime: 60_000,
  });

  const studentIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of (students || []) as Array<{ id: string; name: string }>) map.set(s.id, s.name);
    return map;
  }, [students]);

  const senderIdToLabel = useMemo(() => {
    const parentMap = new Map<string, string>();
    for (const p of (parentSenderRows || [])) parentMap.set(p.id, "parent");
    const profMap = new Map<string, string>();
    for (const pr of (profileSenderRows || [])) profMap.set(pr.id, (pr.name || "User"));
    return { parentMap, profMap };
  }, [parentSenderRows, profileSenderRows, studentIdToName]);

  // Build recipient options merged with recent senders (by id)
  const mergedRecipientOptions = useMemo(() => {
    const options: MessageRecipient[] = [...(parentRecipients || [])];
    const existingIds = new Set(options.map((o) => o.id));
    for (const sid of senderIds) {
      if (!sid) continue;
      if (existingIds.has(sid)) continue;
      const label = senderIdToLabel.parentMap.get(sid) || senderIdToLabel.profMap.get(sid) || sid;
      options.push({ id: sid, name: label, type: "parent" });
    }
    return options;
  }, [parentRecipients, senderIds, senderIdToLabel]);

  // Build parent filter rows based on teacher's students (show all linked parents via parents.student_ids overlap)
  const teacherStudentIds = useMemo(() => ((students || []) as Array<{ id: string }>).map((s) => s.id), [students]);
  const { data: parentFilterRows } = useQuery<Array<{ id: string; student_ids?: string[] | null }> | null>({
    queryKey: ["parent-filter-rows", teacherStudentIds],
    queryFn: async () => {
      if (!teacherStudentIds || teacherStudentIds.length === 0) return [] as Array<{ id: string; student_ids?: string[] | null }>;
      const { data, error } = await supabase
        .from("parents")
        .select("id, student_ids")
        .overlaps("student_ids", teacherStudentIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; student_ids?: string[] | null }>;
    },
    enabled: !!teacherStudentIds,
    staleTime: 60_000,
  });

  // Build a map of studentId -> name, including extra linked kids not in teacher's class
  const classStudentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of ((students || []) as Array<{ id: string; name: string }>)) m.set(s.id, s.name);
    return m;
  }, [students]);

  const linkedKidIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of (parentFilterRows || []) as Array<{ id: string; student_ids?: string[] | null }>) {
      for (const sid of (p.student_ids || [])) if (sid) set.add(sid);
    }
    return Array.from(set);
  }, [parentFilterRows]);

  const missingKidIds = useMemo(() => linkedKidIds.filter((id) => !classStudentNameById.has(id)), [linkedKidIds, classStudentNameById]);

  // Fallback: legacy parent_children links for parents with empty student_ids
  const parentsMissingKids = useMemo(() => {
    return ((parentFilterRows || []) as Array<{ id: string; student_ids?: string[] | null }>).
      filter((p) => !p.student_ids || p.student_ids.length === 0).
      map((p) => p.id);
  }, [parentFilterRows]);

  const { data: legacyParentChildren } = useQuery<Array<{ parent_id: string; student_id: string }> | null>({
    queryKey: ["legacy-parent-children", parentsMissingKids],
    queryFn: async () => {
      if (!parentsMissingKids || parentsMissingKids.length === 0) return [] as Array<{ parent_id: string; student_id: string }>;
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => { select: (s: string) => { in: (c: string, vals: string[]) => Promise<{ data: Array<{ parent_id: string; student_id: string }> | null; error: unknown }> } };
      }).from("parents").select("parent_id, student_id").in("parent_id", parentsMissingKids);
      if (error) return [] as Array<{ parent_id: string; student_id: string }>;
      return (data || []) as Array<{ parent_id: string; student_id: string }>;
    },
    enabled: (parentsMissingKids || []).length > 0,
    staleTime: 60_000,
  });

  const legacyKidIds = useMemo(() => Array.from(new Set(((legacyParentChildren || []) as Array<{ parent_id: string; student_id: string }>).map((r) => r.student_id))), [legacyParentChildren]);

  const { data: legacyKidRows } = useQuery<Array<{ id: string; name: string }> | null>({
    queryKey: ["legacy-kid-rows", legacyKidIds],
    queryFn: async () => {
      if (!legacyKidIds || legacyKidIds.length === 0) return [] as Array<{ id: string; name: string }>;
      const { data, error } = await supabase.from("students").select("id, name").in("id", legacyKidIds);
      if (error) return [] as Array<{ id: string; name: string }>;
      return (data || []) as Array<{ id: string; name: string }>;
    },
    enabled: (legacyKidIds || []).length > 0,
    staleTime: 60_000,
  });

  const { data: extraKidRows } = useQuery<Array<{ id: string; name: string }> | null>({
    queryKey: ["filter-extra-kids", missingKidIds],
    queryFn: async () => {
      if (!missingKidIds || missingKidIds.length === 0) return [] as Array<{ id: string; name: string }>;
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .in("id", missingKidIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string }>;
    },
    enabled: (missingKidIds || []).length > 0,
    staleTime: 60_000,
  });

  const kidNameById = useMemo(() => {
    const m = new Map<string, string>(classStudentNameById);
    for (const r of (legacyKidRows || []) as Array<{ id: string; name: string }>) m.set(r.id, r.name);
    for (const r of (extraKidRows || []) as Array<{ id: string; name: string }>) m.set(r.id, r.name);
    return m;
  }, [classStudentNameById, extraKidRows]);

  // Build filter options: parents (from recipients/senders) and children (students list)
  const parentFilterOptions = useMemo(() => {
    const opts: Array<{ id: string; label: string }> = [{ id: "all", label: "All parents" }];
    const ids = new Set<string>(((parentFilterRows || []) as Array<{ id: string }>).map((r) => r.id));
    // Label parents strictly as "<Student Name>'s parent 1/2" (never show parent full name)
    const idToLabel = new Map<string, string>();
    // Build map of parent -> first matching child name in teacher's class
    const classStudentIds = new Set<string>(((students || []) as Array<{ id: string; name: string }>).map((s) => s.id));
    const rows = (parentFilterRows || []) as Array<{ id: string; student_ids?: string[] | null }>;
    // Track counts per kid for numbering
    const kidNameToCount = new Map<string, number>();
    for (const p of rows) {
      const kids = (p.student_ids || []).filter(Boolean) as string[];
      const bestKidId = kids.find((k) => classStudentIds.has(k)) || kids[0];
      const kidName = bestKidId ? kidNameById.get(bestKidId) : undefined;
      if (kidName) {
        const current = kidNameToCount.get(kidName) || 0;
        const next = current + 1;
        kidNameToCount.set(kidName, next);
        idToLabel.set(p.id, `${kidName}'s parent ${next}`);
      }
    }
    // Fallback: if no kid name found, attempt to use legacy mapping for label numbering
    for (const id of ids) {
      if (!idToLabel.has(id)) {
        // Try to find any legacy child row to derive a kid name
        const legChild = ((legacyParentChildren || []) as Array<{ parent_id: string; student_id: string }>).find((r) => r.parent_id === id);
        const kidName = legChild ? kidNameById.get(legChild.student_id) : undefined;
        if (kidName) {
          const current = kidNameToCount.get(kidName) || 0;
          const next = current + 1;
          kidNameToCount.set(kidName, next);
          idToLabel.set(id, `${kidName}'s parent ${next}`);
        } else {
          idToLabel.set(id, "Parent");
        }
      }
    }
    const pairs: Array<[string, string]> = Array.from(ids).map((id) => [id, idToLabel.get(id) || "Parent"]);
    pairs.sort((a, b) => a[1].localeCompare(b[1]));
    for (const [id, label] of pairs) opts.push({ id, label });
    return opts;
  }, [parentFilterRows, students, kidNameById]);

  // Student filter removed

  const filteredInbox = useMemo(() => {
    const list = inbox || [];
    if (filterParentId === "all") return list;
    return list.filter((m) => m.sender_id === filterParentId);
  }, [inbox, filterParentId]);

  // Resolve recipient labels for sent rows
  const recipientIds = useMemo(() => Array.from(new Set(((sent || []).map((m) => m.recipient_id)).filter(Boolean))), [sent]);
  const { data: parentRecipientRows } = useQuery({
    queryKey: ["sent-parent-recipients", recipientIds],
    queryFn: async () => {
      if (!recipientIds || recipientIds.length === 0) return [] as Array<{ id: string; student_ids?: string[] | null }>;
      type ParentsRow = { id: string; student_ids?: string[] | null };
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => { select: (s: string) => { in: (c: string, vals: string[]) => Promise<{ data: ParentsRow[] | null; error: unknown }> } };
      }).from("parents").select("id, student_ids").in("id", recipientIds);
      if (error) throw error;
      return (data || []) as ParentsRow[];
    },
    enabled: (recipientIds || []).length > 0,
    staleTime: 60_000,
  });
  const { data: profileRecipientRows } = useQuery({
    queryKey: ["sent-profile-recipients", recipientIds],
    queryFn: async () => {
      if (!recipientIds || recipientIds.length === 0) return [] as Array<{ id: string; name: string | null }>;
      const { data, error } = await supabase.from("profiles").select("id, name").in("id", recipientIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string | null }>;
    },
    enabled: (recipientIds || []).length > 0,
    staleTime: 60_000,
  });
  const recipientIdToLabel = useMemo(() => {
    const parentMap = new Map<string, string>();
    for (const p of (parentRecipientRows || [])) parentMap.set(p.id, "parent");
    const profMap = new Map<string, string>();
    for (const pr of (profileRecipientRows || [])) profMap.set(pr.id, (pr.name || "User"));
    return { parentMap, profMap };
  }, [parentRecipientRows, profileRecipientRows]);

  const filteredSent = useMemo(() => {
    const list = sent || [];
    if (filterParentId === "all") return list;
    return list.filter((m) => m.recipient_id === filterParentId);
  }, [sent, filterParentId]);


  // Fetch full conversation with a selected peer (parent) or recipient
  const { data: threadMessages } = useQuery<InboxRow[] | null>({
    queryKey: ["messages-thread", teacherId, openThreadPeerId],
    queryFn: async () => {
      if (!teacherId || !openThreadPeerId) return [] as InboxRow[];
      const { data, error } = await supabase
        .from("communications")
        .select("id, message, subject, created_at, sender_id, recipient_id, read")
        .in("sender_id", [teacherId, openThreadPeerId])
        .in("recipient_id", [teacherId, openThreadPeerId])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as InboxRow[];
    },
    enabled: !!teacherId && !!openThreadPeerId,
  });

  const isSendingDisabled = useMemo(() => {
    return !teacherId || !messageText.trim() || !selectedRecipientId || (parentsLoading || studentsLoading);
  }, [teacherId, messageText, selectedRecipientId, parentsLoading, studentsLoading]);

  const [sending, setSending] = useState(false);

  const openThreadWithPeer = async (peerId: string, markReadForInbox: boolean) => {
    try {
      if (markReadForInbox) {
        await supabase
          .from("communications")
          .update({ read: true })
          .eq("recipient_id", teacherId)
          .eq("sender_id", peerId)
          .eq("read", false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["teacher-inbox", teacherId] }),
          queryClient.invalidateQueries({ queryKey: ["unread-count", teacherId] }),
        ]);
      }
    } catch {
      // ignore
    } finally {
      setOpenThreadPeerId(peerId);
    }
  };
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

      // Pre-send email notify attached to button click for non-email recipients too
      try {
        let senderName = (session?.user?.user_metadata?.name as string) || "Teacher";
        try {
          if (!session?.user?.user_metadata?.name) {
            const { data: prof } = await supabase.from("profiles").select("name").eq("id", teacherId).maybeSingle();
            const profName = (prof as { name?: string } | null)?.name;
            if (profName) senderName = profName;
          }
        } catch { /* ignore */ }
        const notifySubject = `You have received a message from ${senderName}`;
        const notifyBody = `${senderName} wrote:\n\n${messageText.trim()}\n\nPlease sign in to view and reply.`;

        let emailTargets: string[] = [];
        if (selectedRecipientId === "__all_parents__") {
          emailTargets = Array.from(new Set(((parentRecipients || [])
            .filter((r) => r.id !== "__all_parents__" && r.id.includes("@"))
            .map((r) => r.id))));
        } else if (selectedRecipientId.includes("@")) {
          // will be handled below in the email branch; skip here to avoid duplicate
        } else {
          // UUID → lookup parent email (parents.email, fallback profiles.email)
          type ParentRow = { id: string; email: string | null };
          const { data: parentRow } = await (supabase as unknown as {
            from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: ParentRow[] | null }> } };
          }).from("parents").select("id, email").eq("id", selectedRecipientId);
          emailTargets = Array.from(new Set(((parentRow || []) as ParentRow[])
            .map((p) => p.email)
            .filter((e): e is string => !!e && e.includes("@"))));
          if (emailTargets.length === 0) {
            const { data: profRows } = await (supabase as unknown as {
              from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: Array<{ id: string; email?: string | null }> | null }> } };
            }).from("profiles").select("id, email").eq("id", selectedRecipientId);
            const pEmail = ((profRows || []) as Array<{ id: string; email?: string | null }>)[0]?.email;
            if (pEmail && pEmail.includes("@")) emailTargets = [pEmail];
          }
        }
        if (emailTargets.length > 0) {
          await supabase.functions.invoke("send-teacher-message", {
            body: { recipients: emailTargets, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: teacherId },
          });
        }
      } catch { /* ignore */ }

      // If recipient identifiers are emails, send via edge function; else use communications table
      const emailRecipients = recipients.filter((id) => id.includes("@"));
      if (emailRecipients.length > 0) {
        // Build sender display name and templated subject/body
        let senderName = (session?.user?.user_metadata?.name as string) || "Teacher";
        try {
          if (!session?.user?.user_metadata?.name) {
            const { data: prof } = await supabase.from("profiles").select("name").eq("id", teacherId).maybeSingle();
            const profName = (prof as { name?: string } | null)?.name;
            if (profName) senderName = profName;
          }
        } catch { /* ignore */ }
        const notifySubject = `You have received a message from ${senderName}`;
        const notifyBody = `${senderName} wrote:\n\n${messageText.trim()}\n\nPlease sign in to view and reply.`;

        // Look up parent UUIDs from email addresses to save messages to database
        // Try multiple sources: parents table, profiles table, and via students
        const resolvedParentIds = new Set<string>();
        const emailToParentId = new Map<string, string>();
        
        try {
          type ParentRow = { id: string; email: string | null };
          
          // Strategy 1: Check parents table by email
          const { data: parentRows } = await (supabase as unknown as {
            from: (t: string) => { select: (s: string) => { in: (c: string, vals: string[]) => Promise<{ data: ParentRow[] | null }> } };
          }).from("parents").select("id, email").in("email", emailRecipients);
          
          if (parentRows) {
            for (const p of parentRows) {
              if (p.id && p.email) {
                resolvedParentIds.add(p.id);
                emailToParentId.set(p.email.toLowerCase(), p.id);
              }
            }
          }
          
          // Strategy 2: Check profiles table by email where role='parent'
          const unresolvedEmails = emailRecipients.filter((email) => !emailToParentId.has(email.toLowerCase()));
          if (unresolvedEmails.length > 0) {
            try {
              const { data: profileRows } = await supabase
                .from("profiles")
                .select("id, email")
                .in("email", unresolvedEmails)
                .eq("role", "parent");
              
              if (profileRows) {
                for (const prof of profileRows as Array<{ id: string; email?: string | null }>) {
                  if (prof.id && prof.email) {
                    resolvedParentIds.add(prof.id);
                    emailToParentId.set(prof.email.toLowerCase(), prof.id);
                  }
                }
              }
            } catch (profileErr) {
              console.warn("[TeacherMessages] Error checking profiles table:", profileErr);
            }
          }
          
          // Strategy 3: Find via students - find students with matching guardian_email, then find parents linked to those students
          const stillUnresolvedEmails = emailRecipients.filter((email) => !emailToParentId.has(email.toLowerCase()));
          if (stillUnresolvedEmails.length > 0 && (students || []).length > 0) {
            try {
              // Get student IDs that have these emails as guardian emails
              const studentIds = ((students || []) as Array<{ id: string }>).map((s) => s.id);
              if (studentIds.length > 0) {
                const { data: studentRows } = await supabase
                  .from("students")
                  .select("id, guardian_email, secondary_guardian_email")
                  .in("id", studentIds);
                
                if (studentRows) {
                  const emailToStudentIds = new Map<string, string[]>();
                  for (const student of studentRows as Array<{ id: string; guardian_email?: string | null; secondary_guardian_email?: string | null }>) {
                    const emails = [student.guardian_email, student.secondary_guardian_email]
                      .filter(Boolean)
                      .map((e) => e?.toLowerCase().trim())
                      .filter((e): e is string => !!e && e.includes("@"));
                    
                    for (const email of emails) {
                      if (stillUnresolvedEmails.some((ue) => ue.toLowerCase() === email)) {
                        if (!emailToStudentIds.has(email)) {
                          emailToStudentIds.set(email, []);
                        }
                        emailToStudentIds.get(email)!.push(student.id);
                      }
                    }
                  }
                  
                  // Now find parents linked to these students
                  const studentIdsToCheck = Array.from(new Set(Array.from(emailToStudentIds.values()).flat()));
                  if (studentIdsToCheck.length > 0) {
                    // Check parents table for parents with these students in student_ids
                    const { data: parentsByStudents } = await (supabase as unknown as {
                      from: (t: string) => { 
                        select: (s: string) => { 
                          overlaps: (c: string, vals: string[]) => Promise<{ data: Array<{ id: string; email?: string | null; student_ids?: string[] | null }> | null }> 
                        } 
                      };
                    }).from("parents").select("id, email, student_ids").overlaps("student_ids", studentIdsToCheck);
                    
                    if (parentsByStudents) {
                      for (const parent of parentsByStudents as Array<{ id: string; email?: string | null; student_ids?: string[] | null }>) {
                        if (parent.id && parent.email) {
                          const parentEmailLower = parent.email.toLowerCase();
                          // Check if this parent's email matches any unresolved email
                          if (stillUnresolvedEmails.some((ue) => ue.toLowerCase() === parentEmailLower)) {
                            resolvedParentIds.add(parent.id);
                            emailToParentId.set(parentEmailLower, parent.id);
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (studentErr) {
              console.warn("[TeacherMessages] Error checking via students:", studentErr);
            }
          }
          
          // Save messages to communications table for resolved parent UUIDs
          const resolvedIdsArray = Array.from(resolvedParentIds);
          if (resolvedIdsArray.length > 0) {
            const subj = subject.trim();
            const rows = resolvedIdsArray.map((rid) => ({ 
              sender_id: teacherId, 
              recipient_id: rid, 
              message: messageText.trim(), 
              subject: subj, 
              parent_message_id: replyParentId, 
              read: false, 
              message_type: "direct", 
              category: "general" 
            }));
            const { error: dbError } = await supabase.from("communications").insert(rows);
            if (dbError) {
              console.error("[TeacherMessages] Failed to save messages to database:", dbError);
              toast({ 
                title: "Warning", 
                description: "Message sent via email but failed to save to database. Some messages may not appear in the app.", 
                variant: "destructive" 
              });
            } else {
              console.log(`[TeacherMessages] Successfully saved ${resolvedIdsArray.length} message(s) to database`);
            }
          }
          
          // Log warning for emails without corresponding parent records
          const resolvedEmails = Array.from(emailToParentId.keys());
          const finalUnresolvedEmails = emailRecipients.filter((email) => !emailToParentId.has(email.toLowerCase()));
          if (finalUnresolvedEmails.length > 0) {
            console.warn("[TeacherMessages] Some email addresses don't have corresponding parent records in database:", finalUnresolvedEmails);
            // Still send email, but warn user that message won't appear in app
            if (resolvedIdsArray.length === 0) {
              toast({ 
                title: "Warning", 
                description: "Message sent via email, but parent records not found in database. Message may not appear in the app.", 
                variant: "destructive" 
              });
            }
          }
        } catch (e) {
          console.error("[TeacherMessages] Error looking up parent UUIDs:", e);
          toast({ 
            title: "Warning", 
            description: "Message sent via email, but failed to save to database. Message may not appear in the app.", 
            variant: "destructive" 
          });
        }

        // Send email notifications
        const { data: _data, error } = await supabase.functions.invoke("send-teacher-message", {
          body: {
            recipients: emailRecipients,
            subject: notifySubject,
            body: notifyBody,
            fromName: senderName,
            senderId: teacherId,
          },
        });
        const err: unknown = (error as { message?: string } | null);
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
            body: JSON.stringify({ recipients: emailRecipients, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: teacherId }),
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
        const subj = subject.trim();
        const rows = recipients.map((rid) => ({ sender_id: teacherId, recipient_id: rid, message: messageText.trim(), subject: subj, parent_message_id: replyParentId, read: false, message_type: "direct", category: "general" }));
        const { error } = await supabase.from("communications").insert(rows);
        if (error) throw error;
        // Try to email-notify the parent recipients using parents.email
        try {
          let senderName = (session?.user?.user_metadata?.name as string) || "Teacher";
          try {
            if (!session?.user?.user_metadata?.name) {
              const { data: prof } = await supabase.from("profiles").select("name").eq("id", teacherId).maybeSingle();
              const profName = (prof as { name?: string } | null)?.name;
              if (profName) senderName = profName;
            }
          } catch { /* ignore */ }
          const notifySubject = `You have received a message from ${senderName}`;
          const notifyBody = `${senderName} wrote:\n\n${messageText.trim()}\n\nPlease sign in to view and reply.`;
          type ParentRow = { id: string; email: string | null };
          const { data: parentRows } = await (supabase as unknown as {
            from: (t: string) => { select: (s: string) => { in: (c: string, vals: string[]) => Promise<{ data: ParentRow[] | null }> } };
          }).from("parents").select("id, email").in("id", recipients);
          const emailTargets = Array.from(new Set(((parentRows || []) as ParentRow[])
            .map((p) => p.email)
            .filter((e): e is string => !!e && e.includes("@"))));
        if (emailTargets.length > 0) {
          const { error: invErr2 } = await supabase.functions.invoke("send-teacher-message", { body: { recipients: emailTargets, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: teacherId } });
          if (invErr2) {
            const { data: sessionData2 } = await supabase.auth.getSession();
            const accessToken2 = sessionData2.session?.access_token || "";
            await fetch(`${SUPABASE_URL}/functions/v1/send-teacher-message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_PUBLISHABLE_KEY,
                Authorization: accessToken2 ? `Bearer ${accessToken2}` : "",
              },
              body: JSON.stringify({ recipients: emailTargets, subject: notifySubject, body: notifyBody, fromName: senderName, senderId: teacherId }),
            });
          }
        }
        } catch { /* ignore */ }
        toast({ title: "Message sent", description: selectedRecipientId === "__all_parents__" ? `Sent to ${recipients.length} recipients` : "Sent successfully" });
      }
      setMessageText("");
      setSelectedRecipientId("");
      setSubject("");
      setReplyParentId(null);
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
                  <SelectValue placeholder={parentsLoading ? "Loading recipients..." : ((mergedRecipientOptions || []).length > 0 ? "Select recipient" : "No recipients found")} />
                </SelectTrigger>
                <SelectContent>
                  {(mergedRecipientOptions || []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                  {(!parentsLoading && (!mergedRecipientOptions || mergedRecipientOptions.length === 0)) && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No recipients found</div>
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
          <Label>Parent</Label>
          <Select value={filterParentId} onValueChange={setFilterParentId}>
            <SelectTrigger>
              <SelectValue placeholder="All parents" />
            </SelectTrigger>
            <SelectContent>
              {parentFilterOptions.map((opt) => (
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
                  const isParent = senderIdToLabel.parentMap.has(m.sender_id);
                  let senderLabel = senderIdToLabel.profMap.get(m.sender_id) || m.sender_id;
                  if (isParent) {
                    // Try to resolve a child linked to this parent that is also in one of the teacher's classes
                    const parent = (parentSenderRows || []).find((p) => p.id === m.sender_id);
                    const classStudentIds = new Set<string>((students || []).map((s) => s.id));
                    const kids = Array.from(new Set((parent?.student_ids || []).filter(Boolean))) as string[];
                    const bestKidId = kids.find((kid) => classStudentIds.has(kid)) || kids[0];
                    const kidName = bestKidId ? studentIdToName.get(bestKidId) : undefined;
                    if (kidName) senderLabel = `${kidName}'s parent`;
                  }
                  return (
                    <li
                      key={m.id}
                      className="p-3 border rounded-md text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => openThreadWithPeer(m.sender_id, true)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="text-xs font-medium underline underline-offset-2 hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecipientId(m.sender_id);
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
                          {senderLabel}
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
                  const isParent = recipientIdToLabel.parentMap.has(m.recipient_id);
                  let recipientLabel = recipientIdToLabel.profMap.get(m.recipient_id) || m.recipient_id;
                  if (isParent) {
                    const parent = (parentRecipientRows || []).find((p) => p.id === m.recipient_id);
                    const classStudentIds = new Set<string>((students || []).map((s) => s.id));
                    const kids = Array.from(new Set((parent?.student_ids || []).filter(Boolean))) as string[];
                    const bestKidId = kids.find((kid) => classStudentIds.has(kid)) || kids[0];
                    const kidName = bestKidId ? studentIdToName.get(bestKidId) : undefined;
                    if (kidName) recipientLabel = `${kidName}'s parent`;
                  }
                  return (
                    <li
                      key={m.id}
                      className="p-3 border rounded-md text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setOpenThreadPeerId(m.recipient_id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">To: {recipientLabel}</span>
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
                  <span className="text-xs font-medium">{tm.sender_id === teacherId ? "You" : "Parent"}</span>
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


