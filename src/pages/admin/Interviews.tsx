import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes, parseISO, isAfter } from "date-fns";
import {
  CalendarDays,
  Plus,
  Loader2,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { AdminPageShell } from "@/components/admin/AdminPageShell.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { cn } from "@/lib/utils.ts";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InterviewWindow {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  slot_duration_minutes: number;
  created_at: string;
}

interface InterviewSlot {
  id: string;
  window_id: string;
  teacher_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  teacher?: { name: string };
  window?: { title: string };
  booking?: { id: string; status: string; student?: { name: string }; parent?: { name: string } } | null;
}

interface Teacher {
  id: string;
  name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusChip(status: string) {
  if (status === "confirmed") return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5"><CheckCircle2 className="w-3 h-3" />Confirmed</span>;
  if (status === "cancelled") return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><XCircle className="w-3 h-3" />Cancelled</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><AlertCircle className="w-3 h-3" />No-show</span>;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const dt = new Date();
  dt.setHours(Number(h), Number(m), 0);
  return format(dt, "h:mm a");
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

type Tab = "windows" | "slots" | "bookings";

const TABS: { id: Tab; label: string }[] = [
  { id: "windows", label: "Interview Windows" },
  { id: "slots", label: "Manage Slots" },
  { id: "bookings", label: "Bookings" },
];

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Interviews() {
  const [tab, setTab] = useState<Tab>("windows");
  const [windowDialogOpen, setWindowDialogOpen] = useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: windows = [], isLoading: loadingWindows } = useQuery<InterviewWindow[]>({
    queryKey: ["interview-windows"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("interview_windows")
        .select("*")
        .order("start_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: slots = [], isLoading: loadingSlots } = useQuery<InterviewSlot[]>({
    queryKey: ["interview-slots"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("interview_slots")
        .select(`
          *,
          teacher:profiles!interview_slots_teacher_id_fkey(name),
          window:interview_windows!interview_slots_window_id_fkey(title),
          booking:interview_bookings(id, status, student:students(name), parent:profiles!interview_bookings_parent_id_fkey(name))
        `)
        .order("slot_date")
        .order("slot_time");
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        ...s,
        booking: s.booking?.[0] ?? null,
      }));
    },
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "teacher")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Delete slot ───────────────────────────────────────────────────────────────

  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await (supabase as any).from("interview_slots").delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interview-slots"] });
      toast({ title: "Slot deleted" });
    },
    onError: () => toast({ title: "Failed to delete slot", variant: "destructive" }),
  });

  // ── Delete window ─────────────────────────────────────────────────────────────

  const deleteWindow = useMutation({
    mutationFn: async (windowId: string) => {
      const { error } = await (supabase as any).from("interview_windows").delete().eq("id", windowId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interview-windows"] });
      qc.invalidateQueries({ queryKey: ["interview-slots"] });
      toast({ title: "Window deleted" });
    },
    onError: () => toast({ title: "Failed to delete window", variant: "destructive" }),
  });

  // ── Update booking status ─────────────────────────────────────────────────────

  const updateBooking = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("interview_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interview-slots"] });
      toast({ title: "Booking updated" });
    },
    onError: () => toast({ title: "Failed to update booking", variant: "destructive" }),
  });

  const bookedSlots = slots.filter((s) => s.booking && s.booking.status === "confirmed");

  return (
    <AdminPageShell
      title="Interviews"
      subtitle="Schedule and manage parent-teacher interviews"
      icon={<CalendarDays className="w-5 h-5 text-green-700" />}
      iconBg="bg-green-50"
    >
      {/* Pill tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {t.label}
            {t.id === "bookings" && bookedSlots.length > 0 && (
              <span className="ml-1.5 bg-white/30 text-inherit text-xs rounded-full px-1.5 py-0.5">
                {bookedSlots.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Windows tab ─────────────────────────────────────────────────────── */}
      {tab === "windows" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5 bg-green-700 hover:bg-green-800 text-white"
              onClick={() => setWindowDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" /> New Window
            </Button>
          </div>

          {loadingWindows ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : windows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No interview windows yet.</p>
              <p className="text-xs mt-1">Create a window to define when interviews take place.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {windows.map((w) => {
                const slotCount = slots.filter((s) => s.window_id === w.id).length;
                const isActive = !isAfter(new Date(), parseISO(w.end_date + "T23:59:59"));
                return (
                  <div key={w.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{w.title}</h3>
                          <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500")}>
                            {isActive ? "Active" : "Past"}
                          </span>
                        </div>
                        {w.description && <p className="text-sm text-gray-500 mb-2">{w.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(parseISO(w.start_date), "MMM d")} – {format(parseISO(w.end_date), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{w.slot_duration_minutes} min slots</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{slotCount} slot{slotCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteWindow.mutate(w.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete window"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Slots tab ───────────────────────────────────────────────────────── */}
      {tab === "slots" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5 bg-green-700 hover:bg-green-800 text-white"
              onClick={() => setSlotDialogOpen(true)}
              disabled={windows.length === 0}
            >
              <Plus className="w-3.5 h-3.5" /> Generate Slots
            </Button>
          </div>

          {windows.length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Create an interview window first before generating slots.
            </p>
          )}

          {loadingSlots ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : slots.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No slots generated yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Window</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Teacher</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-700 text-xs">{(s.window as any)?.title ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{(s.teacher as any)?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{format(parseISO(s.slot_date), "EEE, MMM d")}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtTime(s.slot_time)}</td>
                      <td className="px-4 py-3">
                        {s.booking
                          ? statusChip(s.booking.status)
                          : <span className="text-xs text-gray-400">Available</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!s.booking && (
                          <button
                            onClick={() => deleteSlot.mutate(s.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Bookings tab ────────────────────────────────────────────────────── */}
      {tab === "bookings" && (
        <div className="space-y-4">
          {bookedSlots.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No confirmed bookings yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date & Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Teacher</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Parent</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {slots.filter((s) => !!s.booking).map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">{format(parseISO(s.slot_date), "EEE, MMM d")}</div>
                        <div className="text-xs text-gray-400">{fmtTime(s.slot_time)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{(s.teacher as any)?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{(s.booking as any)?.student?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{(s.booking as any)?.parent?.name ?? "—"}</td>
                      <td className="px-4 py-3">{statusChip(s.booking!.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {s.booking!.status === "confirmed" && (
                            <button
                              onClick={() => updateBooking.mutate({ id: s.booking!.id, status: "cancelled" })}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                          {s.booking!.status === "confirmed" && (
                            <button
                              onClick={() => updateBooking.mutate({ id: s.booking!.id, status: "no_show" })}
                              className="text-xs text-amber-600 hover:underline ml-2"
                            >
                              No-show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Create Window dialog ─────────────────────────────────────────────── */}
      <CreateWindowDialog
        open={windowDialogOpen}
        onClose={() => setWindowDialogOpen(false)}
        userId={session?.user?.id ?? ""}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["interview-windows"] });
          setWindowDialogOpen(false);
          toast({ title: "Interview window created" });
        }}
      />

      {/* ── Generate Slots dialog ────────────────────────────────────────────── */}
      <GenerateSlotsDialog
        open={slotDialogOpen}
        onClose={() => setSlotDialogOpen(false)}
        windows={windows}
        teachers={teachers}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["interview-slots"] });
          setSlotDialogOpen(false);
          toast({ title: "Slots generated" });
        }}
      />
    </AdminPageShell>
  );
}

// ── Create Window Dialog ───────────────────────────────────────────────────────

function CreateWindowDialog({
  open,
  onClose,
  userId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("15");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setTitle(""); setDescription(""); setStartDate(""); setEndDate(""); setDuration("15");
  };

  const handleSubmit = async () => {
    if (!title || !startDate || !endDate) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("interview_windows").insert({
      title,
      description: description || null,
      start_date: startDate,
      end_date: endDate,
      slot_duration_minutes: Number(duration),
      created_by: userId || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to create window", description: error.message, variant: "destructive" });
    } else {
      reset();
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Interview Window</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Title *</Label>
            <Input className="mt-1" placeholder="e.g. Term 1 Parent-Teacher Interviews" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1" rows={2} placeholder="Optional notes for parents" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date *</Label>
              <Input className="mt-1" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input className="mt-1" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Slot Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["10", "15", "20", "30"].map((d) => (
                  <SelectItem key={d} value={d}>{d} minutes</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button size="sm" disabled={saving} className="bg-green-700 hover:bg-green-800 text-white" onClick={handleSubmit}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Create Window
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Generate Slots Dialog ──────────────────────────────────────────────────────

function GenerateSlotsDialog({
  open,
  onClose,
  windows,
  teachers,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  windows: InterviewWindow[];
  teachers: Teacher[];
  onCreated: () => void;
}) {
  const [windowId, setWindowId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const selectedWindow = windows.find((w) => w.id === windowId);
  const duration = selectedWindow?.slot_duration_minutes ?? 15;

  const reset = () => {
    setWindowId(""); setTeacherId(""); setSlotDate(""); setStartTime("09:00"); setEndTime("12:00");
  };

  const handleGenerate = async () => {
    if (!windowId || !teacherId || !slotDate || !startTime || !endTime) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }

    // Generate slots between startTime and endTime
    const base = new Date(`${slotDate}T${startTime}`);
    const end = new Date(`${slotDate}T${endTime}`);
    const slotsToInsert: { window_id: string; teacher_id: string; slot_date: string; slot_time: string; duration_minutes: number }[] = [];
    let cur = base;
    while (cur < end) {
      slotsToInsert.push({
        window_id: windowId,
        teacher_id: teacherId,
        slot_date: slotDate,
        slot_time: format(cur, "HH:mm:ss"),
        duration_minutes: duration,
      });
      cur = addMinutes(cur, duration);
    }

    if (slotsToInsert.length === 0) {
      toast({ title: "No slots to generate — check your times", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await (supabase as any).from("interview_slots").insert(slotsToInsert);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to generate slots", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${slotsToInsert.length} slots generated` });
      reset();
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Interview Slots</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Interview Window *</Label>
            <Select value={windowId} onValueChange={setWindowId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a window" />
              </SelectTrigger>
              <SelectContent>
                {windows.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Teacher *</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date *</Label>
            <Input
              className="mt-1"
              type="date"
              value={slotDate}
              min={selectedWindow?.start_date}
              max={selectedWindow?.end_date}
              onChange={(e) => setSlotDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time *</Label>
              <Input className="mt-1" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input className="mt-1" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {windowId && slotDate && startTime && endTime && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Will generate {Math.floor((new Date(`${slotDate}T${endTime}`).getTime() - new Date(`${slotDate}T${startTime}`).getTime()) / (duration * 60000))} × {duration}-min slots
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button size="sm" disabled={saving} className="bg-green-700 hover:bg-green-800 text-white" onClick={handleGenerate}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Generate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
