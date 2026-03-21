import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface AttendanceDatePickerProps {
  date: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  disabled: boolean;
}

export const AttendanceDatePicker = ({
  date,
  onDateSelect,
  disabled,
}: AttendanceDatePickerProps) => {
  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
        <CardDescription>
          Choose a date to view or record attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {date && (
          <div className="mb-4">
            <p className="text-sm font-medium">Selected Date</p>
            <div className="flex items-center mt-1 gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(date, "PPPP")}</span>
            </div>
          </div>
        )}
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateSelect}
          className="rounded-md border"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
};
