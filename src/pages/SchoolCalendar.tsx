import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
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
import { AdminStatCard } from "@/components/admin/AdminPageShell.tsx";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GraduationCap,
  Star,
  BookOpen,
  Coffee,
  Palmtree,
  Users,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = "holiday" | "pd_day" | "exam" | "event" | "break";

type Audience = "all" | "teachers" | "parents";

interface SchoolEvent {
  id: string;
  title: string;
  description?: string | null;
  event_type: EventType;
  start_date: string;
  end_date?: string | null;
  all_day: boolean;
  color?: string | null;
  audience: Audience;
  created_by?: string | null;
  created_at: string;
}

const AUDIENCE_OPTIONS: { value: Audience; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "all",      label: "Everyone",      icon: <Users className="h-3.5 w-3.5" />,       color: "#6366f1" },
  { value: "teachers", label: "Teachers Only", icon: <GraduationCap className="h-3.5 w-3.5" />, color: "#0ea5e9" },
  { value: "parents",  label: "Parents Only",  icon: <Heart className="h-3.5 w-3.5" />,        color: "#ec4899" },
];

const audienceConfig = (a: Audience) => AUDIENCE_OPTIONS.find((o) => o.value === a) ?? AUDIENCE_OPTIONS[0];

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "holiday",  label: "Holiday",   color: "#16a34a", icon: <Palmtree className="h-3.5 w-3.5" /> },
  { value: "break",    label: "Break",     color: "#0ea5e9", icon: <Coffee className="h-3.5 w-3.5" /> },
  { value: "pd_day",   label: "PD Day",    color: "#8b5cf6", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { value: "exam",     label: "Exam",      color: "#f59e0b", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "event",    label: "Event",     color: "#ec4899", icon: <Star className="h-3.5 w-3.5" /> },
];

const typeConfig = (t: EventType) =>
  EVENT_TYPES.find((e) => e.value === t) ?? EVENT_TYPES[4];

// ── EventDialog ───────────────────────────────────────────────────────────────

interface EventDialogProps {
  event?: SchoolEvent | null;
  open: boolean;
  onClose: () => void;
}

function EventDialog({ event, open, onClose }: EventDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!event;

  const [title, setTitle]           = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventType, setEventType]   = useState<EventType>(event?.event_type ?? "event");
  const [startDate, setStartDate]   = useState(event?.start_date ?? format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate]       = useState(event?.end_date ?? "");
  const [audience, setAudience]     = useState<Audience>(event?.audience ?? "all");

  // Reset when event changes
  const reset = () => {
    setTitle(event?.title ?? "");
    setDescription(event?.description ?? "");
    setEventType(event?.event_type ?? "event");
    setStartDate(event?.start_date ?? format(new Date(), "yyyy-MM-dd"));
    setEndDate(event?.end_date ?? "");
    setAudience(event?.audience ?? "all");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate || null,
        color: typeConfig(eventType).color,
        audience,
      };
      if (isEdit) {
        const { error } = await supabase.from("school_events").update(payload).eq("id", event!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("school_events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Event updated" : "Event created" });
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      onClose();
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleOpen = (o: boolean) => {
    if (!o) { reset(); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this calendar event." : "Add an event to the school calendar."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eid Holiday" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: t.color }}>{t.icon}</span>
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: o.color }}>{o.icon}</span>
                      {o.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!title.trim() || !startDate || saveMutation.isPending}
              style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)" }}
              className="text-white"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SchoolCalendar() {
  const { isAdmin } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useQuery<SchoolEvent[]>({
    queryKey: ["school-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_events")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SchoolEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Event deleted" });
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      setSelectedDay(null);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart); // 0 = Sun

  // Events in current month
  const monthEvents = events.filter((e) => {
    const s = parseISO(e.start_date);
    const end = e.end_date ? parseISO(e.end_date) : s;
    return isSameMonth(s, currentMonth) || isSameMonth(end, currentMonth) ||
      (s < monthStart && end >= monthStart);
  });

  // Events on selected day
  const dayEvents = selectedDay
    ? events.filter((e) => {
        const s = parseISO(e.start_date);
        const end = e.end_date ? parseISO(e.end_date) : s;
        return isSameDay(s, selectedDay) ||
          isWithinInterval(selectedDay, { start: s, end });
      })
    : [];

  // Upcoming events (next 60 days)
  const now = new Date();
  const upcoming = events.filter((e) => {
    const s = parseISO(e.start_date);
    const diff = (s.getTime() - now.getTime()) / 86400000;
    return diff >= -1 && diff <= 60;
  }).slice(0, 8);

  const holidayCount = events.filter((e) => e.event_type === "holiday" || e.event_type === "break").length;
  const pdCount      = events.filter((e) => e.event_type === "pd_day").length;
  const examCount    = events.filter((e) => e.event_type === "exam").length;

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Banner ─────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)" }}
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute right-8 -bottom-10 w-28 h-28 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="relative">
            <p className="text-sm font-medium" style={{ color: "#86efac" }}>{todayLabel}</p>
            <h1 className="text-2xl font-bold mt-1" style={{ color: "white" }}>School Calendar</h1>
            <p className="text-sm mt-1" style={{ color: "#bbf7d0" }}>Events, holidays, and PD days</p>
          </div>
          {isAdmin && (
            <div className="relative">
              <Button
                onClick={() => { setEditingEvent(null); setDialogOpen(true); }}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border-0 rounded-xl font-semibold"
                style={{ color: "white" }}
              >
                <Plus className="h-4 w-4" style={{ color: "white" }} />
                Add Event
              </Button>
            </div>
          )}
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <AdminStatCard
            label="Total Events"
            value={String(events.length)}
            meta="on the calendar"
            metaColor="text-gray-500"
            icon={<CalendarDays className="h-4 w-4 text-green-700" />}
            iconBg="bg-green-50"
          />
          <AdminStatCard
            label="Holidays & Breaks"
            value={String(holidayCount)}
            meta="days off"
            metaColor="text-green-700"
            icon={<Palmtree className="h-4 w-4 text-green-700" />}
            iconBg="bg-green-50"
          />
          <AdminStatCard
            label="PD Days"
            value={String(pdCount)}
            meta="professional dev"
            metaColor="text-purple-600"
            icon={<GraduationCap className="h-4 w-4 text-purple-600" />}
            iconBg="bg-purple-50"
          />
          <AdminStatCard
            label="Exams"
            value={String(examCount)}
            meta="scheduled"
            metaColor="text-amber-600"
            icon={<BookOpen className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-50"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── Calendar Grid ──────────────────────────────────────────────── */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <h2 className="text-base font-bold text-gray-900">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {/* Offset cells */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`off-${i}`} className="h-16 sm:h-20 border-r border-b border-gray-50" />
                ))}
                {days.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                  const dayEvs = events.filter((e) => {
                    const s = parseISO(e.start_date);
                    const end = e.end_date ? parseISO(e.end_date) : s;
                    return isSameDay(s, day) || isWithinInterval(day, { start: s, end });
                  });

                  return (
                    <button
                      key={dayStr}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={cn(
                        "h-16 sm:h-20 border-r border-b border-gray-50 p-1 text-left relative transition-colors",
                        isSelected ? "bg-green-50" : "hover:bg-gray-50",
                        getDay(day) === 0 || getDay(day) === 6 ? "bg-gray-50/50" : "",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                          isToday ? "bg-green-700 text-white font-bold" : "text-gray-700",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvs.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className="px-1 py-0.5 rounded text-[10px] font-medium truncate leading-tight"
                            style={{ background: `${e.color ?? "#e5e7eb"}22`, color: e.color ?? "#374151" }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvs.length > 2 && (
                          <div className="text-[10px] text-gray-400 pl-1">+{dayEvs.length - 2}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-gray-100">
              {EVENT_TYPES.map((t) => (
                <div key={t.value} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs text-gray-500">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Selected day events */}
            {selectedDay && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  {format(selectedDay, "MMMM d, yyyy")}
                </h3>
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-gray-400">No events on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((e) => {
                      const cfg = typeConfig(e.event_type);
                      return (
                        <div
                          key={e.id}
                          className="flex items-start justify-between gap-2 p-3 rounded-xl border"
                          style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}0d` }}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${cfg.color}22`, color: cfg.color }}
                            >
                              {cfg.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                              {e.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{e.description}</p>
                              )}
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <span
                                  className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded"
                                  style={{ background: `${cfg.color}22`, color: cfg.color }}
                                >
                                  {cfg.label}
                                </span>
                                {e.audience && e.audience !== "all" && (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
                                    style={{ background: `${audienceConfig(e.audience).color}22`, color: audienceConfig(e.audience).color }}
                                  >
                                    {audienceConfig(e.audience).icon}
                                    {audienceConfig(e.audience).label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => { setEditingEvent(e); setDialogOpen(true); }}
                                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(e.id)}
                                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming events */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Upcoming (60 days)</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                </div>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-gray-400">No upcoming events.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((e) => {
                    const cfg = typeConfig(e.event_type);
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cfg.color}22`, color: cfg.color }}
                        >
                          {cfg.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                          <p className="text-xs text-gray-400">
                            {format(parseISO(e.start_date), "MMM d")}
                            {e.end_date && e.end_date !== e.start_date && ` – ${format(parseISO(e.end_date), "MMM d")}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: `${cfg.color}22`, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {e.audience && e.audience !== "all" && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: `${audienceConfig(e.audience).color}22`, color: audienceConfig(e.audience).color }}
                            >
                              {audienceConfig(e.audience).icon}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventDialog
        event={editingEvent}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingEvent(null); }}
      />
    </div>
  );
}
