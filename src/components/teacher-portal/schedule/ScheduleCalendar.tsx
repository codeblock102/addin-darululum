import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBreakpoint } from "@/hooks/use-mobile.tsx";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";
import frLocale from "@fullcalendar/core/locales/fr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { cn } from "@/lib/utils.ts";

interface Class {
  id: string;
  name: string;
  teacher_ids?: string[];
  time_slots: {
    days: string[];
    start_time: string;
    end_time: string;
    teacher_ids?: string[];
  }[];
}

interface ScheduleCalendarProps {
  classes: Class[];
  teacherId?: string;
}

const dayNameToNumber = (dayName: string) => {
  const map: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };
  const normalized = String(dayName || "").toLowerCase().trim();
  if (normalized in map) return map[normalized];
  const asNum = Number.parseInt(normalized, 10);
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 6) return asNum;
  return -1;
};

const CLASS_COLORS = [
  { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
  { bg: "#dbeafe", border: "#2563eb", text: "#1e3a8a" },
  { bg: "#fef9c3", border: "#ca8a04", text: "#713f12" },
  { bg: "#ede9fe", border: "#7c3aed", text: "#3b0764" },
  { bg: "#fee2e2", border: "#dc2626", text: "#7f1d1d" },
  { bg: "#e0f2fe", border: "#0284c7", text: "#0c4a6e" },
  { bg: "#d1fae5", border: "#059669", text: "#064e3b" },
  { bg: "#ffedd5", border: "#ea580c", text: "#7c2d12" },
  { bg: "#fae8ff", border: "#9333ea", text: "#4a044e" },
  { bg: "#fce7f3", border: "#db2777", text: "#831843" },
];

const hashStringToIndex = (value: string, modulo: number) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
};

export const ScheduleCalendar = ({ classes, teacherId }: ScheduleCalendarProps) => {
  const { isMobile } = useBreakpoint();
  const calendarRef = useRef<FullCalendar>(null);
  const { t, language } = useI18n();
  const [view, setView] = useState<"timeGridWeek" | "timeGridDay" | "dayGridMonth">(
    isMobile ? "timeGridDay" : "timeGridWeek"
  );
  const [title, setTitle] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<{ timeRange: string; items: { title: string; colorIdx: number }[] } | null>(null);

  const toMinutes = (time: string | undefined): number | null => {
    if (!time) return null;
    const parts = time.split(":");
    if (parts.length < 2) return null;
    const h = Number.parseInt(parts[0], 10);
    const m = Number.parseInt(parts[1], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const toHHMMSS = (minutes: number) => {
    const h = Math.max(0, Math.floor(minutes / 60));
    const m = Math.max(0, minutes % 60);
    return `${pad(h)}:${pad(m)}:00`;
  };

  type BaseItem = {
    dayNum: number;
    startMin: number;
    endMin: number;
    title: string;
    colorIdx: number;
  };

  const baseItems: BaseItem[] = classes.flatMap((c) =>
    (Array.isArray(c.time_slots) ? c.time_slots : []).flatMap((slot) => {
      const assigned = Array.isArray((slot as any)?.teacher_ids) && (slot as any).teacher_ids.length > 0
        ? (slot as any).teacher_ids as string[]
        : Array.isArray((c as any)?.teacher_ids) ? ((c as any).teacher_ids as string[]) : [];
      if (teacherId && assigned.length > 0 && !assigned.includes(teacherId)) return [] as BaseItem[];

      const days = Array.isArray((slot as any)?.days) ? (slot as any).days : [];
      const validDays = days
        .map((d: any) => (typeof d === "string" || typeof d === "number" ? String(d) : ""))
        .map((d: string) => dayNameToNumber(d))
        .filter((n) => n >= 0);
      if (validDays.length === 0) return [] as BaseItem[];

      const startMin = toMinutes((slot as any)?.start_time) ?? 9 * 60;
      const endMin = toMinutes((slot as any)?.end_time) ?? 10 * 60 + 30;
      const colorIdx = hashStringToIndex(c.name, CLASS_COLORS.length);

      return validDays.map((dayNum) => ({ dayNum, startMin, endMin, title: c.name, colorIdx }));
    })
  );

  const TOLERANCE = 15;
  type Group = { dayNum: number; startMin: number; endMin: number; items: { title: string; colorIdx: number }[] };
  const groupsMap = new Map<string, Group>();
  for (const item of baseItems) {
    const startBucket = Math.round(item.startMin / TOLERANCE) * TOLERANCE;
    const endBucket = Math.round(item.endMin / TOLERANCE) * TOLERANCE;
    const key = `${item.dayNum}|${startBucket}|${endBucket}`;
    const existing = groupsMap.get(key);
    const entry = { title: item.title, colorIdx: item.colorIdx };
    if (existing) {
      existing.items.push(entry);
      existing.startMin = Math.min(existing.startMin, item.startMin);
      existing.endMin = Math.max(existing.endMin, item.endMin);
    } else {
      groupsMap.set(key, { dayNum: item.dayNum, startMin: item.startMin, endMin: item.endMin, items: [entry] });
    }
  }

  const events = Array.from(groupsMap.values()).map((g) => {
    const primaryColor = CLASS_COLORS[g.items[0].colorIdx];
    return {
      title: g.items.length > 1 ? `${g.items.length} classes` : g.items[0].title,
      startTime: toHHMMSS(g.startMin),
      endTime: toHHMMSS(g.endMin),
      daysOfWeek: [g.dayNum],
      backgroundColor: primaryColor.bg,
      borderColor: primaryColor.border,
      textColor: primaryColor.text,
      extendedProps: {
        items: g.items,
        timeRange: `${pad(Math.floor(g.startMin / 60))}:${pad(g.startMin % 60)}–${pad(Math.floor(g.endMin / 60))}:${pad(g.endMin % 60)}`,
      },
    };
  });

  const allStartMins = classes.flatMap((c) => (c.time_slots || []).map((s) => toMinutes((s as any).start_time))).filter((v): v is number => v !== null);
  const allEndMins = classes.flatMap((c) => (c.time_slots || []).map((s) => toMinutes((s as any).end_time))).filter((v): v is number => v !== null);

  const rawMin = allStartMins.length > 0 ? Math.min(...allStartMins) : 8 * 60;
  const rawMax = allEndMins.length > 0 ? Math.max(...allEndMins) : 17 * 60;
  const slotMinTime = toHHMMSS(Math.floor(rawMin / 60) * 60);
  const slotMaxTime = toHHMMSS(Math.ceil(rawMax / 60) * 60);

  const nav = (dir: "prev" | "next" | "today") => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (dir === "prev") api.prev();
    else if (dir === "next") api.next();
    else api.today();
    setTitle(api.view.title);
  };

  const switchView = (v: typeof view) => {
    setView(v);
    calendarRef.current?.getApi()?.changeView(v);
  };

  const VIEW_BTNS: { value: typeof view; label: string }[] = isMobile
    ? [{ value: "timeGridDay", label: "Day" }]
    : [
        { value: "timeGridWeek", label: "Week" },
        { value: "timeGridDay", label: "Day" },
        { value: "dayGridMonth", label: "Month" },
      ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* ── Custom toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: nav + title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => nav("prev")}
              className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => nav("today")}
              className="px-3 h-7 rounded-lg text-xs font-semibold text-green-700 hover:bg-white hover:shadow-sm transition-all"
            >
              Today
            </button>
            <button
              onClick={() => nav("next")}
              className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          {title && (
            <span className="text-base font-bold text-gray-900 hidden sm:block">{title}</span>
          )}
        </div>

        {/* Right: view switcher + Google Calendar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 bg-gray-50">
            {VIEW_BTNS.map((btn) => (
              <button
                key={btn.value}
                onClick={() => switchView(btn.value)}
                className={cn(
                  "px-3 h-7 rounded-lg text-xs font-semibold transition-all",
                  view === btn.value
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm",
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Google Calendar</span>
          </a>
        </div>
      </div>

      {/* Mobile title */}
      {isMobile && title && (
        <p className="text-sm font-bold text-gray-900">{title}</p>
      )}

      {/* ── Calendar ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-gray-100 overflow-hidden shadow-sm schedule-calendar-wrap">
        <style>{`
          .schedule-calendar-wrap .fc {
            font-family: inherit;
            height: 100%;
          }
          .schedule-calendar-wrap .fc-theme-standard td,
          .schedule-calendar-wrap .fc-theme-standard th,
          .schedule-calendar-wrap .fc-theme-standard .fc-scrollgrid {
            border-color: #f3f4f6;
          }
          .schedule-calendar-wrap .fc-col-header-cell {
            background: #f9fafb;
            padding: 8px 0;
          }
          .schedule-calendar-wrap .fc-col-header-cell-cushion {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: .04em;
            text-decoration: none;
          }
          .schedule-calendar-wrap .fc-timegrid-slot-label-cushion {
            font-size: 11px;
            color: #9ca3af;
            font-weight: 500;
          }
          .schedule-calendar-wrap .fc-timegrid-slot {
            height: 3rem;
          }
          .schedule-calendar-wrap .fc-timegrid-now-indicator-line {
            border-color: #16a34a;
            border-width: 2px;
          }
          .schedule-calendar-wrap .fc-timegrid-now-indicator-arrow {
            border-top-color: #16a34a;
            border-bottom-color: #16a34a;
          }
          .schedule-calendar-wrap .fc-day-today {
            background: #f0fdf4 !important;
          }
          .schedule-calendar-wrap .fc-day-today .fc-col-header-cell-cushion {
            color: #16a34a;
          }
          .schedule-calendar-wrap .fc-event {
            border-radius: 8px;
            border-width: 1.5px;
            cursor: pointer;
          }
          .schedule-calendar-wrap .fc-event:hover {
            filter: brightness(0.95);
          }
          .schedule-calendar-wrap .fc-daygrid-event {
            border-radius: 6px;
          }
          .schedule-calendar-wrap .fc-scrollgrid-section-header th {
            border-bottom: 1px solid #e5e7eb;
          }
          .schedule-calendar-wrap .fc-toolbar {
            display: none !important;
          }
          .schedule-calendar-wrap .fc-view-harness {
            background: white;
          }
          .schedule-calendar-wrap .fc-timegrid-axis {
            background: #f9fafb;
          }
        `}</style>

        <FullCalendar
          key={view}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locales={[frLocale]}
          locale={language === "fr" ? "fr" : "en"}
          initialView={view}
          headerToolbar={false}
          events={events}
          height="100%"
          expandRows
          stickyHeaderDates
          nowIndicator
          slotDuration="01:00:00"
          slotEventOverlap={false}
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          hiddenDays={[0, 6]}
          dayHeaderFormat={view === "timeGridDay" ? { weekday: "long", month: "long", day: "numeric" } : { weekday: "short" }}
          allDaySlot={false}
          slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: language !== "fr" }}
          datesSet={(info) => setTitle(info.view.title)}
          eventClick={(info) => {
            const props: any = info.event.extendedProps || {};
            setDetailsData({
              timeRange: props.timeRange || info.timeText || "",
              items: Array.isArray(props.items) ? props.items : [],
            });
            setDetailsOpen(true);
          }}
          eventContent={(arg) => {
            const props: any = arg.event.extendedProps || {};
            const items: { title: string; colorIdx: number }[] = props.items || [];
            const count = items.length;
            const preview = count > 2 ? items.slice(0, 2) : items;
            return (
              <div className="px-2 py-1.5 h-full overflow-hidden">
                <div className="text-[11px] font-semibold opacity-70 tabular-nums leading-none mb-1">
                  {arg.timeText}
                </div>
                {count === 1 ? (
                  <div className="text-[12px] font-semibold leading-tight truncate">
                    {items[0]?.title || arg.event.title}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {preview.map((it, i) => (
                      <div key={i} className="flex items-center gap-1 min-w-0">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CLASS_COLORS[it.colorIdx]?.border }}
                        />
                        <span className="text-[11px] font-medium truncate">{it.title}</span>
                      </div>
                    ))}
                    {count > 2 && (
                      <div className="text-[10px] opacity-60">+{count - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* ── Event detail dialog ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {detailsData?.items.length === 1 ? detailsData.items[0].title : `${detailsData?.items.length ?? 0} Classes`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4" />
              <span>{detailsData?.timeRange}</span>
            </div>
            <div className="space-y-2">
              {(detailsData?.items || []).map((it, idx) => {
                const c = CLASS_COLORS[it.colorIdx];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium"
                    style={{ background: c?.bg, color: c?.text, border: `1px solid ${c?.border}40` }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c?.border }} />
                    {it.title}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
