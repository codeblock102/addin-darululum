import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client.ts";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { ChildSelector } from "@/components/parent/ChildSelector.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

// ---------- Types ----------
interface TimeSlot {
  days: string[];
  room?: string | null;
  subject: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  teacher_ids?: string[];
}

interface ClassRow {
  id: string;
  name: string;
  time_slots: TimeSlot[] | null;
  teacher_ids: string[] | null;
}

interface SchoolEvent {
  id: string;
  title: string;
  event_type: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean | null;
  color: string | null;
  audience: string | null;
}

interface AgendaEvent {
  key: string;
  classId: string;
  className: string;
  subject: string;
  room?: string | null;
  startMinutes: number; // since 08:00 = 0
  endMinutes: number;
  startLabel: string;
  endLabel: string;
  teacherNames: string[];
  dayIndex: number; // 0=Sunday … 6=Saturday
}

// ---------- Constants ----------
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_TO_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 17; // exclusive end (5pm)
const ROW_HEIGHT_PX = 60; // 1 hour = 60 px → 1 minute = 1 px

// ---------- Helpers ----------
function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return (h - GRID_START_HOUR) * 60 + (m || 0);
}

function fmt12(hm: string): string {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${(m || 0).toString().padStart(2, "0")} ${period}`;
}

// ---------- Component ----------
const ParentAgenda = () => {
  const { children: kids, isLoading: loadingKids } = useParentChildren();
  const isMobile = useIsMobile();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [mobileDayIdx, setMobileDayIdx] = useState<number>(() => new Date().getDay());

  useEffect(() => {
    if (!selectedChildId && kids && kids.length > 0) {
      setSelectedChildId(kids[0].id);
    }
  }, [kids, selectedChildId]);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 0 }), [weekStart]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Fetch the child row to get class_ids
  const { data: childRow } = useQuery<{ id: string; class_ids: string[] | null } | null>({
    queryKey: ["parent-agenda-child", selectedChildId],
    enabled: !!selectedChildId,
    queryFn: async () => {
      if (!selectedChildId) return null;
      const { data, error } = await (supabase as any)
        .from("students")
        .select("id, class_ids")
        .eq("id", selectedChildId)
        .maybeSingle();
      if (error) throw error;
      return (data as { id: string; class_ids: string[] | null } | null) ?? null;
    },
  });

  // Fetch classes for the child
  const { data: classes, isLoading: loadingClasses } = useQuery<ClassRow[]>({
    queryKey: ["parent-agenda-classes", childRow?.class_ids],
    enabled: !!childRow?.class_ids && childRow.class_ids.length > 0,
    queryFn: async () => {
      const ids = childRow?.class_ids ?? [];
      if (ids.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from("classes")
        .select("id, name, time_slots, teacher_ids")
        .in("id", ids);
      if (error) throw error;
      return ((data || []) as unknown) as ClassRow[];
    },
  });

  // Collect all teacher IDs (class-level + slot-level)
  const teacherIds = useMemo(() => {
    const set = new Set<string>();
    (classes || []).forEach((c) => {
      (c.teacher_ids || []).forEach((id) => id && set.add(id));
      (c.time_slots || []).forEach((slot) => {
        (slot.teacher_ids || []).forEach((id) => id && set.add(id));
      });
    });
    return Array.from(set);
  }, [classes]);

  const { data: teacherMap } = useQuery<Record<string, string>>({
    queryKey: ["parent-agenda-teachers", teacherIds],
    enabled: teacherIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, name")
        .in("id", teacherIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      ((data || []) as Array<{ id: string; name: string | null }>).forEach((t) => {
        if (t.id) map[t.id] = t.name || "Teacher";
      });
      return map;
    },
  });

  // School events for the week
  const { data: events } = useQuery<SchoolEvent[]>({
    queryKey: ["parent-agenda-events", format(weekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("school_events")
        .select("id, title, event_type, start_date, end_date, all_day, color, audience")
        .lte("start_date", format(weekEnd, "yyyy-MM-dd"))
        .gte("end_date", format(weekStart, "yyyy-MM-dd"));
      if (error) throw error;
      return ((data || []) as unknown) as SchoolEvent[];
    },
  });

  // Build agenda events keyed by day index
  const agendaByDay = useMemo<Record<number, AgendaEvent[]>>(() => {
    const out: Record<number, AgendaEvent[]> = {};
    for (let i = 0; i < 7; i++) out[i] = [];

    (classes || []).forEach((cls) => {
      (cls.time_slots || []).forEach((slot, slotIdx) => {
        const startMin = parseHM(slot.start_time);
        const endMin = parseHM(slot.end_time);
        // Clip to grid window
        const visStart = Math.max(0, startMin);
        const visEnd = Math.min((GRID_END_HOUR - GRID_START_HOUR) * 60, endMin);
        if (visEnd <= visStart) return;

        const slotTeacherIds = (slot.teacher_ids && slot.teacher_ids.length > 0)
          ? slot.teacher_ids
          : (cls.teacher_ids || []);
        const teacherNames = slotTeacherIds
          .map((id) => teacherMap?.[id])
          .filter(Boolean) as string[];

        (slot.days || []).forEach((dayKey) => {
          const idx = DAY_TO_INDEX[(dayKey || "").toLowerCase()];
          if (idx === undefined) return;
          out[idx].push({
            key: `${cls.id}-${slotIdx}-${idx}`,
            classId: cls.id,
            className: cls.name,
            subject: slot.subject,
            room: slot.room,
            startMinutes: visStart,
            endMinutes: visEnd,
            startLabel: fmt12(slot.start_time),
            endLabel: fmt12(slot.end_time),
            teacherNames,
            dayIndex: idx,
          });
        });
      });
    });

    // Sort each day by start time
    Object.values(out).forEach((arr) => arr.sort((a, b) => a.startMinutes - b.startMinutes));
    return out;
  }, [classes, teacherMap]);

  // Events that touch each day in the week
  const eventsByDay = useMemo<Record<number, SchoolEvent[]>>(() => {
    const out: Record<number, SchoolEvent[]> = {};
    for (let i = 0; i < 7; i++) out[i] = [];
    (events || []).forEach((ev) => {
      const start = parseISO(ev.start_date);
      const end = parseISO(ev.end_date);
      weekDays.forEach((d, idx) => {
        if (isWithinInterval(d, { start, end })) {
          out[idx].push(ev);
        }
      });
    });
    return out;
  }, [events, weekDays]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const childName = kids?.find((c) => c.id === selectedChildId)?.name ?? "";

  // ---------- Render ----------
  const headerRange = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  const noScheduleHint = !loadingKids && !loadingClasses && (
    !childRow?.class_ids ||
    childRow.class_ids.length === 0 ||
    (classes && classes.every((c) => !c.time_slots || c.time_slots.length === 0))
  );

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
              <CardTitle className="text-lg sm:text-xl truncate">
                {childName ? `${childName} — Week of ${headerRange}` : `Week of ${headerRange}`}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeekStart((d) => subWeeks(d, 1))}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeekStart((d) => addWeeks(d, 1))}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {kids && kids.length > 1 && (
            <ChildSelector
              children={kids}
              selectedId={selectedChildId}
              onSelect={setSelectedChildId}
              isLoading={loadingKids}
            />
          )}
        </CardHeader>

        <CardContent>
          {loadingKids || loadingClasses ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading schedule…</div>
          ) : !selectedChildId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No children linked to your account</p>
              <p className="text-xs text-gray-400">Please contact the school admin.</p>
            </div>
          ) : noScheduleHint ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-gray-700">No schedule available yet.</p>
              <p className="text-xs text-gray-500 mt-1">Ask the school office.</p>
            </div>
          ) : isMobile ? (
            <MobileDayView
              dayIdx={mobileDayIdx}
              setDayIdx={setMobileDayIdx}
              weekDays={weekDays}
              agendaByDay={agendaByDay}
              eventsByDay={eventsByDay}
            />
          ) : (
            <DesktopGrid
              hours={hours}
              weekDays={weekDays}
              agendaByDay={agendaByDay}
              eventsByDay={eventsByDay}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- Desktop grid ----------
const DesktopGrid = ({
  hours,
  weekDays,
  agendaByDay,
  eventsByDay,
}: {
  hours: number[];
  weekDays: Date[];
  agendaByDay: Record<number, AgendaEvent[]>;
  eventsByDay: Record<number, SchoolEvent[]>;
}) => {
  const totalMinutes = hours.length * 60;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Header row */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b">
          <div className="" />
          {weekDays.map((d, idx) => (
            <div key={idx} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground border-l">
              <div>{DAY_NAMES_SHORT[idx]}</div>
              <div className="text-sm font-semibold text-foreground">{format(d, "MMM d")}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          {/* Hour gutter */}
          <div className="relative" style={{ height: totalMinutes }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-xs text-muted-foreground text-right pr-1"
                style={{ top: i * ROW_HEIGHT_PX - 6 }}
              >
                {((h + 11) % 12) + 1} {h >= 12 ? "PM" : "AM"}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((_, dayIdx) => (
            <div
              key={dayIdx}
              className="relative border-l"
              style={{ height: totalMinutes }}
            >
              {/* Hour grid lines */}
              {hours.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: i * ROW_HEIGHT_PX }}
                />
              ))}

              {/* Event strip overlay */}
              {(eventsByDay[dayIdx] || []).map((ev, i) => (
                <div
                  key={ev.id}
                  className="absolute left-0 right-0 px-1 py-0.5 text-[10px] font-medium truncate z-10"
                  style={{
                    top: 2 + i * 16,
                    background: ev.color || (ev.event_type === "holiday" ? "#fef3c7" : "#e5e7eb"),
                    color: "#374151",
                  }}
                  title={ev.title}
                >
                  {ev.title}
                </div>
              ))}

              {/* Class blocks */}
              {(agendaByDay[dayIdx] || []).map((evt) => {
                const top = evt.startMinutes;
                const height = Math.max(20, evt.endMinutes - evt.startMinutes);
                return (
                  <div
                    key={evt.key}
                    className="absolute left-1 right-1 rounded-md bg-primary/10 border border-primary/30 px-1.5 py-1 text-[11px] overflow-hidden hover:bg-primary/20 transition-colors"
                    style={{ top, height }}
                    title={`${evt.subject} — ${evt.className}\n${evt.startLabel} – ${evt.endLabel}${evt.teacherNames.length ? `\n${evt.teacherNames.join(", ")}` : ""}`}
                  >
                    <div className="font-semibold text-primary truncate">{evt.subject}</div>
                    {height >= 32 && (
                      <div className="text-foreground/80 truncate">{evt.className}</div>
                    )}
                    {height >= 48 && evt.teacherNames.length > 0 && (
                      <div className="text-muted-foreground truncate">{evt.teacherNames.join(", ")}</div>
                    )}
                    {height >= 60 && (
                      <div className="text-muted-foreground">{evt.startLabel}–{evt.endLabel}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- Mobile day view ----------
const MobileDayView = ({
  dayIdx,
  setDayIdx,
  weekDays,
  agendaByDay,
  eventsByDay,
}: {
  dayIdx: number;
  setDayIdx: (idx: number) => void;
  weekDays: Date[];
  agendaByDay: Record<number, AgendaEvent[]>;
  eventsByDay: Record<number, SchoolEvent[]>;
}) => {
  const safeIdx = Math.min(6, Math.max(0, dayIdx));
  const dayDate = weekDays[safeIdx];
  const dayEvents = agendaByDay[safeIdx] || [];
  const daySchoolEvents = eventsByDay[safeIdx] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDayIdx(Math.max(0, safeIdx - 1))}
          disabled={safeIdx === 0}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">{DAY_NAMES[safeIdx]}</div>
          <div className="text-base font-semibold">{format(dayDate, "MMM d")}</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDayIdx(Math.min(6, safeIdx + 1))}
          disabled={safeIdx === 6}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {DAY_NAMES_SHORT.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => setDayIdx(i)}
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
              i === safeIdx
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {daySchoolEvents.length > 0 && (
        <div className="space-y-1">
          {daySchoolEvents.map((ev) => (
            <div
              key={ev.id}
              className="rounded-md px-2 py-1.5 text-xs font-medium"
              style={{
                background: ev.color || (ev.event_type === "holiday" ? "#fef3c7" : "#e5e7eb"),
                color: "#374151",
              }}
            >
              {ev.title}
              {ev.event_type && (
                <Badge variant="outline" className="ml-2 text-[10px] uppercase">{ev.event_type}</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {dayEvents.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No classes scheduled.</div>
      ) : (
        <ul className="space-y-2">
          {dayEvents.map((evt) => (
            <li
              key={evt.key}
              className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm truncate">{evt.subject}</div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {evt.startLabel} – {evt.endLabel}
                </div>
              </div>
              <div className="text-xs text-foreground/70 truncate">{evt.className}{evt.room ? ` · Room ${evt.room}` : ""}</div>
              {evt.teacherNames.length > 0 && (
                <div className="text-xs text-muted-foreground truncate">{evt.teacherNames.join(", ")}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ParentAgenda;
