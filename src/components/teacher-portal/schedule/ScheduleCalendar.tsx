import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBreakpoint } from "@/hooks/use-mobile.tsx";
import { useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";
import frLocale from "@fullcalendar/core/locales/fr";

interface Class {
  id: string;
  name: string;
  time_slots: {
    days: string[];
    start_time: string;
    end_time: string;
  }[];
}

interface ScheduleCalendarProps {
  classes: Class[];
}

const dayNameToNumber = (dayName: string) => {
  const lowerCaseDay = dayName.toLowerCase();
  switch (lowerCaseDay) {
    case "sunday": return 0;
    case "monday": return 1;
    case "tuesday": return 2;
    case "wednesday": return 3;
    case "thursday": return 4;
    case "friday": return 5;
    case "saturday": return 6;
    default: return -1;
  }
};

export const ScheduleCalendar = ({ classes }: ScheduleCalendarProps) => {
  const { isMobile, isTablet } = useBreakpoint();
  const calendarRef = useRef<FullCalendar>(null);
  const { t, language } = useI18n();

  const toMinutes = (time: string | undefined): number | null => {
    if (!time) return null;
    const [h, m] = time.split(":").map((v) => parseInt(v, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const toHHMMSS = (minutes: number) => {
    const h = Math.max(0, Math.floor(minutes / 60));
    const m = Math.max(0, minutes % 60);
    return `${pad(h)}:${pad(m)}:00`;
  };

  const events = classes.flatMap((c) =>
    (c.time_slots || []).flatMap((slot) =>
      (slot.days || []).map((day) => ({
        title: c.name,
        startTime: slot.start_time,
        endTime: slot.end_time,
        daysOfWeek: [dayNameToNumber(day)],
        classNames: ["bg-primary", "text-white", "border-primary"],
      }))
    )
  );

  // Determine min and max times across all slots so late classes are visible
  const allStartMins = classes
    .flatMap((c) => (c.time_slots || []).map((s) => toMinutes(s.start_time)))
    .filter((v): v is number => v !== null);
  const allEndMins = classes
    .flatMap((c) => (c.time_slots || []).map((s) => toMinutes(s.end_time)))
    .filter((v): v is number => v !== null);

  const defaultMin = 8 * 60; // 08:00
  const defaultMax = 17 * 60; // 17:00
  const minMinutes = allStartMins.length > 0 ? Math.min(...allStartMins) : defaultMin;
  const maxMinutes = allEndMins.length > 0 ? Math.max(...allEndMins) : defaultMax;
  // Add a small buffer to the end of day
  const slotMinTime = toHHMMSS(Math.max(0, minMinutes - 30));
  const slotMaxTime = toHHMMSS(Math.min(24 * 60, maxMinutes + 30));

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
        slotDuration={isMobile ? "00:30:00" : "01:00:00"}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        dayHeaderFormat={isMobile ? { weekday: 'short' } : isTablet ? { weekday: 'short' } : { weekday: 'long' }}
        allDaySlot={false}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: language !== 'fr' }}
        eventContent={(arg) => (
          <div className={`p-1 ${isMobile ? 'text-xs' : isTablet ? 'text-sm' : ''}`}>
            <b>{arg.timeText}</b>
            <i className="ml-2">{arg.event.title}</i>
          </div>
        )}
      />
    </div>
  );
}; 