import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBreakpoint } from "@/hooks/use-mobile.tsx";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";
import frLocale from "@fullcalendar/core/locales/fr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";

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
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  const normalized = String(dayName || "").toLowerCase().trim();
  if (normalized in map) return map[normalized];
  const asNum = Number.parseInt(normalized, 10);
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 6) return asNum;
  return -1;
};

const CLASS_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0ea5e9",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#db2777",
];

const hashStringToIndex = (value: string, modulo: number) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
};

export const ScheduleCalendar = ({ classes, teacherId }: ScheduleCalendarProps) => {
  const { isMobile, isTablet } = useBreakpoint();
  const calendarRef = useRef<FullCalendar>(null);
  const { t, language } = useI18n();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<{ timeRange: string; items: { title: string; color: string }[] } | null>(null);

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
    startTime: string;
    endTime: string;
    title: string;
    color: string;
  };

  const baseItems: BaseItem[] = classes.flatMap((c) =>
    (Array.isArray(c.time_slots) ? c.time_slots : []).flatMap((slot) => {
      const assigned = Array.isArray((slot as any)?.teacher_ids) && (slot as any).teacher_ids.length > 0
        ? (slot as any).teacher_ids as string[]
        : Array.isArray((c as any)?.teacher_ids)
        ? ((c as any).teacher_ids as string[])
        : [];
      if (teacherId && assigned.length > 0 && !assigned.includes(teacherId)) {
        return [] as BaseItem[];
      }

      const days = Array.isArray((slot as any)?.days) ? (slot as any).days : [];
      const validDays = days
        .map((d: any) => (typeof d === "string" || typeof d === "number" ? String(d) : ""))
        .map((d: string) => dayNameToNumber(d))
        .filter((n) => n >= 0);
      if (validDays.length === 0) return [] as BaseItem[];

      const startRaw = (slot as any)?.start_time as string | undefined;
      const endRaw = (slot as any)?.end_time as string | undefined;
      const startMins = toMinutes(startRaw) ?? toMinutes("09:00");
      const endMins = toMinutes(endRaw) ?? toMinutes("10:30");
      const startTime = toHHMMSS(startMins ?? 9 * 60);
      const endTime = toHHMMSS(endMins ?? 10 * 60 + 30);

      const color = CLASS_COLORS[hashStringToIndex(c.name, CLASS_COLORS.length)];

      return validDays.map((dayNum) => ({
        dayNum,
        startTime,
        endTime,
        title: c.name,
        color,
      }));
    })
  );

  type Group = { dayNum: number; startTime: string; endTime: string; items: { title: string; color: string }[] };
  const groupsMap = new Map<string, Group>();
  for (const item of baseItems) {
    const key = `${item.dayNum}|${item.startTime}|${item.endTime}`;
    const existing = groupsMap.get(key);
    const entry = { title: item.title, color: item.color };
    if (existing) existing.items.push(entry);
    else groupsMap.set(key, { dayNum: item.dayNum, startTime: item.startTime, endTime: item.endTime, items: [entry] });
  }

  const events = Array.from(groupsMap.values()).map((g) => ({
    title: g.items.length > 1 ? `${g.items.length} classes` : g.items[0].title,
    startTime: g.startTime,
    endTime: g.endTime,
    daysOfWeek: [g.dayNum],
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    textColor: "#0f172a",
    extendedProps: { items: g.items, timeRange: `${g.startTime.slice(0,5)}–${g.endTime.slice(0,5)}` },
  }));

  const allStartMins = classes
    .flatMap((c) => (c.time_slots || []).map((s) => toMinutes((s as any).start_time)))
    .filter((v): v is number => v !== null);
  const allEndMins = classes
    .flatMap((c) => (c.time_slots || []).map((s) => toMinutes((s as any).end_time)))
    .filter((v): v is number => v !== null);

  const defaultMin = 8 * 60;
  const defaultMax = 17 * 60;
  const rawMin = allStartMins.length > 0 ? Math.min(...allStartMins) : defaultMin;
  const rawMax = allEndMins.length > 0 ? Math.max(...allEndMins) : defaultMax;
  const roundDownToHour = (m: number) => Math.floor(m / 60) * 60;
  const roundUpToHour = (m: number) => Math.ceil(m / 60) * 60;
  const slotMinTime = toHHMMSS(roundDownToHour(Math.max(0, rawMin)));
  const slotMaxTime = toHHMMSS(roundUpToHour(Math.min(24 * 60, rawMax)));

  const handlePrevClick = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  };

  const handleNextClick = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  };

  const initialView = isMobile ? "timeGridDay" : isTablet ? "timeGridWeek" : "timeGridWeek";
  const headerToolbar = isMobile
    ? {
        left: "",
        center: "title",
        right: "timeGridDay",
      }
    : isTablet
    ? {
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,timeGridDay",
      }
    : {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full relative">
      {isMobile && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 left-0 z-10 bg-white/80 hover:bg-white"
            onClick={handlePrevClick}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 right-0 z-10 bg-white/80 hover:bg-white"
            onClick={handleNextClick}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
      <FullCalendar
        key={isMobile ? "mobile-day" : isTablet ? "tablet-week" : "desktop-week"}
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locales={[frLocale]}
        locale={language === "fr" ? "fr" : "en"}
        buttonText={{
          today: t("pages.teacherPortal.schedule.today", "Today"),
          month: t("pages.teacherPortal.schedule.month", "Month"),
          week: t("pages.teacherPortal.schedule.week", "Week"),
          day: t("pages.teacherPortal.schedule.day", "Day"),
        }}
        initialView={initialView}
        headerToolbar={headerToolbar}
        events={events}
        height="100%"
        expandRows
        stickyHeaderDates
        nowIndicator
        slotDuration="01:00:00"
        slotEventOverlap={false}
        eventOrder={(a, b) => (a.title || "").localeCompare(b.title || "")}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        dayHeaderFormat={isMobile ? { weekday: 'short' } : isTablet ? { weekday: 'short' } : { weekday: 'long' }}
        allDaySlot={false}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: language !== 'fr' }}
        slotLabelInterval={isMobile ? "02:00:00" : "01:00:00"}
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
          const items: { title: string; color: string }[] = props.items || [];
          const count = items.length;
          if (isMobile) {
            return (
              <div className="p-1 text-[11px]">
                <div className="font-semibold tabular-nums">{arg.timeText}</div>
                <div className="truncate">{count > 1 ? `${count} classes` : (items[0]?.title || arg.event.title)}</div>
              </div>
            );
          }
          const preview = count > 2 ? items.slice(0, 2) : items;
          return (
            <div className={`p-1 ${isMobile ? 'text-[10px]' : isTablet ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center gap-1">
                <span className="font-semibold tabular-nums">{arg.timeText}</span>
                {count > 1 && (
                  <span className="ml-1 text-[10px] text-slate-600">· {count} classes</span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 truncate">
                {count === 1 ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: items[0].color }} />
                    <span className="truncate max-w-[220px]">{items[0].title}</span>
                  </>
                ) : (
                  <>
                    {preview.map((it, i) => (
                      <div key={i} className="flex items-center gap-1 min-w-0">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                        <span className="truncate max-w-[110px]">{it.title}</span>
                      </div>
                    ))}
                    {count > 2 && (
                      <span className="text-[10px] text-slate-600">+{count - 2} more</span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classes ({detailsData?.items.length || 0})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-slate-700">
            <div><span className="font-semibold">Time:</span> {detailsData?.timeRange}</div>
            <div className="divide-y border rounded">
              {(detailsData?.items || []).map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                  <span className="truncate">{it.title}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 