
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";

interface TimeSlotPickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export const TimeSlotPicker = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeSlotPickerProps) => {
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        times.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormItem>
        <FormLabel>Start Time</FormLabel>
        <Select value={startTime} onValueChange={onStartTimeChange}>
          <FormControl>
            <SelectTrigger>
              <SelectValue>{formatTimeDisplay(startTime)}</SelectValue>
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time}>
                {formatTimeDisplay(time)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItem>

      <FormItem>
        <FormLabel>End Time</FormLabel>
        <Select value={endTime} onValueChange={onEndTimeChange}>
          <FormControl>
            <SelectTrigger>
              <SelectValue>{formatTimeDisplay(endTime)}</SelectValue>
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {timeOptions
              .filter((time) => time > startTime)
              .map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTimeDisplay(time)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </FormItem>
    </div>
  );
};
