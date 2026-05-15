import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isAfter } from "date-fns";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
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
}

interface SlotWithTeacher {
  id: string;
  window_id: string;
  teacher_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  teacher: { name: string } | null;
  booked: boolean;
  myBookingId?: string;
  myBookingStatus?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const dt = new Date();
  dt.setHours(Number(h), Number(m), 0);
  return format(dt, "h:mm a");
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ParentInterviews() {
  const { session } = useAuth();
  const parentId = session?.user?.id;
  const { children } = useParentChildren();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [bookingSlot, setBookingSlot] = useState<SlotWithTeacher | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedWindows, setExpandedWindows] = useState<Set<string>>(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: windows = [], isLoading: loadingWindows } = useQuery<InterviewWindow[]>({
    queryKey: ["parent-interview-windows"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from("interview_windows")
        .select("*")
        .gte("end_date", today)
        .order("start_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: slots = [], isLoading: loadingSlots } = useQuery<SlotWithTeacher[]>({
    queryKey: ["parent-interview-slots", parentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("interview_slots")
        .select(`
          *,
          teacher:profiles!interview_slots_teacher_id_fkey(name),
          bookings:interview_bookings(id, parent_id, status)
        `)
        .order("slot_date")
        .order("slot_time");
      if (error) throw error;
      return (data ?? []).map((s: any) => {
        const myBooking = (s.bookings ?? []).find((b: any) => b.parent_id === parentId && b.status === "confirmed");
        const anyConfirmed = (s.bookings ?? []).some((b: any) => b.status === "confirmed");
        return {
          id: s.id,
          window_id: s.window_id,
          teacher_id: s.teacher_id,
          slot_date: s.slot_date,
          slot_time: s.slot_time,
          duration_minutes: s.duration_minutes,
          teacher: s.teacher,
          booked: anyConfirmed,
          myBookingId: myBooking?.id,
          myBookingStatus: myBooking?.status,
        };
      });
    },
    enabled: !!parentId,
  });

  // ── Book slot ─────────────────────────────────────────────────────────────────

  const bookSlot = useMutation({
    mutationFn: async ({ slotId, studentId, noteText }: { slotId: string; studentId: string; noteText: string }) => {
      const { error } = await (supabase as any).from("interview_bookings").insert({
        slot_id: slotId,
        student_id: studentId,
        parent_id: parentId,
        notes: noteText || null,
        status: "confirmed",
      });
      if (error) throw error;

      // Fire confirmation email (best-effort)
      try {
        await supabase.functions.invoke("send-interview-confirmation", {
          body: { slot_id: slotId, student_id: studentId, parent_id: parentId },
        });
      } catch (_) { /* non-critical */ }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-interview-slots"] });
      setBookingSlot(null);
      setSelectedChildId("");
      setNotes("");
      toast({ title: "Interview booked!", description: "You'll receive a confirmation email." });
    },
    onError: (err: any) => {
      toast({ title: "Booking failed", description: err?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  // ── Cancel booking ────────────────────────────────────────────────────────────

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await (supabase as any)
        .from("interview_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-interview-slots"] });
      toast({ title: "Booking cancelled" });
    },
    onError: () => toast({ title: "Failed to cancel", variant: "destructive" }),
  });

  // ── My booked slots ───────────────────────────────────────────────────────────

  const myBookings = slots.filter((s) => !!s.myBookingId);

  // ── Grouped slots per window ──────────────────────────────────────────────────

  const toggleWindow = (id: string) => {
    setExpandedWindows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loadingWindows || loadingSlots) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Parent-Teacher Interviews</h1>
          <p className="text-sm text-gray-500">Book a time to meet your child's teacher</p>
        </div>
      </div>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Your Booked Interviews
          </p>
          {myBookings.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.teacher?.name}</p>
                <p className="text-xs text-gray-500">{format(parseISO(s.slot_date), "EEEE, MMMM d")} · {fmtTime(s.slot_time)}</p>
              </div>
              <button
                onClick={() => cancelBooking.mutate(s.myBookingId!)}
                className="text-xs text-red-500 hover:underline"
                disabled={cancelBooking.isPending}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available windows */}
      {windows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium">No interview sessions open right now.</p>
          <p className="text-xs mt-1">Check back when the school opens a booking window.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {windows.map((w) => {
            const windowSlots = slots.filter((s) => s.window_id === w.id);
            const isExpanded = expandedWindows.has(w.id);

            // Group by teacher
            const byTeacher: Record<string, SlotWithTeacher[]> = {};
            for (const s of windowSlots) {
              const tName = s.teacher?.name ?? s.teacher_id;
              if (!byTeacher[tName]) byTeacher[tName] = [];
              byTeacher[tName].push(s);
            }

            const availableCount = windowSlots.filter((s) => !s.booked).length;

            return (
              <div key={w.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Window header */}
                <button
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleWindow(w.id)}
                >
                  <div>
                    <h2 className="font-semibold text-gray-900">{w.title}</h2>
                    {w.description && <p className="text-sm text-gray-500 mt-0.5">{w.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(parseISO(w.start_date), "MMM d")} – {format(parseISO(w.end_date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {w.slot_duration_minutes} min
                      </span>
                      <span className={cn("font-medium", availableCount > 0 ? "text-green-600" : "text-gray-400")}>
                        {availableCount} slot{availableCount !== 1 ? "s" : ""} available
                      </span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 mt-1 shrink-0" />}
                </button>

                {/* Slots grouped by teacher */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {Object.keys(byTeacher).length === 0 ? (
                      <p className="text-sm text-gray-400 px-5 py-4">No slots available for this window yet.</p>
                    ) : (
                      Object.entries(byTeacher).map(([teacherName, tSlots]) => {
                        // Group by date
                        const byDate: Record<string, SlotWithTeacher[]> = {};
                        for (const s of tSlots) {
                          if (!byDate[s.slot_date]) byDate[s.slot_date] = [];
                          byDate[s.slot_date].push(s);
                        }
                        return (
                          <div key={teacherName} className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {teacherName}
                            </p>
                            {Object.entries(byDate).sort().map(([date, dateSlots]) => (
                              <div key={date} className="mb-3 last:mb-0">
                                <p className="text-xs text-gray-400 mb-2">{format(parseISO(date), "EEEE, MMMM d")}</p>
                                <div className="flex flex-wrap gap-2">
                                  {dateSlots.map((s) => {
                                    const isMyBooking = !!s.myBookingId;
                                    return (
                                      <button
                                        key={s.id}
                                        disabled={s.booked && !isMyBooking}
                                        onClick={() => {
                                          if (!isMyBooking && !s.booked) {
                                            setBookingSlot(s);
                                            if (children.length === 1) setSelectedChildId(children[0].id);
                                          }
                                        }}
                                        className={cn(
                                          "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                                          isMyBooking
                                            ? "bg-green-100 border-green-300 text-green-700 cursor-default"
                                            : s.booked
                                              ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                                              : "bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700 hover:bg-green-50",
                                        )}
                                      >
                                        {isMyBooking && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                        {s.booked && !isMyBooking && <XCircle className="w-3 h-3 inline mr-1" />}
                                        {fmtTime(s.slot_time)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Booking dialog */}
      <Dialog open={!!bookingSlot} onOpenChange={(o) => { if (!o) { setBookingSlot(null); setSelectedChildId(""); setNotes(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Interview</DialogTitle>
            <DialogDescription>
              {bookingSlot && (
                <>
                  <span className="font-medium">{bookingSlot.teacher?.name}</span>
                  {" · "}
                  {format(parseISO(bookingSlot.slot_date), "EEEE, MMMM d")}
                  {" at "}
                  {fmtTime(bookingSlot.slot_time)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {children.length > 1 && (
              <div>
                <Label>Which child is this interview for? *</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Notes for the teacher (optional)</Label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder="Any topics you'd like to discuss…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setBookingSlot(null); setSelectedChildId(""); setNotes(""); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white"
                disabled={!selectedChildId || bookSlot.isPending}
                onClick={() => bookSlot.mutate({ slotId: bookingSlot!.id, studentId: selectedChildId, noteText: notes })}
              >
                {bookSlot.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Book Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
