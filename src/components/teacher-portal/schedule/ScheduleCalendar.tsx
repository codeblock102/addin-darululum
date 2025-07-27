import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const isMobile = useIsMobile();
  const calendarRef = useRef<FullCalendar>(null);

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
        initialView="timeGridWeek"
        headerToolbar={isMobile ? {
          left: "",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        } : {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height="100%"
        slotMinTime="08:00:00"
        slotMaxTime="17:00:00"
        dayHeaderFormat={isMobile ? { weekday: 'short' } : { weekday: 'long' }}
        eventContent={(arg) => (
          <div className={`p-1 ${isMobile ? 'text-xs' : ''}`}>
            <b>{arg.timeText}</b>
            <i className="ml-2">{arg.event.title}</i>
          </div>
        )}
      />
    </div>
  );
}; 