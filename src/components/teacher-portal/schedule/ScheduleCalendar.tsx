import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height="100%"
        slotMinTime="08:00:00"
        slotMaxTime="17:00:00"
        eventContent={(arg) => (
          <div className="p-1">
            <b>{arg.timeText}</b>
            <i className="ml-2">{arg.event.title}</i>
          </div>
        )}
      />
    </div>
  );
}; 