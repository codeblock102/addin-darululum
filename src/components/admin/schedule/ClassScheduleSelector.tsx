
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { PlusCircle, Trash2 } from "lucide-react";
import { TimeSlotPicker } from "./TimeSlotPicker";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface TimeSlot {
  days: string[];
  start_time: string;
  end_time: string;
}

interface ClassScheduleSelectorProps {
  value: TimeSlot[];
  onChange: (value: TimeSlot[]) => void;
}

export const ClassScheduleSelector = ({ value, onChange }: ClassScheduleSelectorProps) => {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  const addTimeSlot = () => {
    if (selectedDays.length === 0) return;
    
    onChange([
      ...value,
      {
        days: selectedDays,
        start_time: "09:00",
        end_time: "10:00",
      },
    ]);
    setSelectedDays([]);
  };

  const removeTimeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, updatedSlot: Partial<TimeSlot>) => {
    onChange(
      value.map((slot, i) => 
        i === index ? { ...slot, ...updatedSlot } : slot
      )
    );
  };

  return (
    <div className="space-y-6">
      <FormItem className="space-y-4">
        <FormLabel>Select Days</FormLabel>
        <ToggleGroup 
          type="multiple" 
          value={selectedDays}
          onValueChange={setSelectedDays}
          className="flex flex-wrap gap-2"
        >
          {DAYS_OF_WEEK.map((day) => (
            <ToggleGroupItem
              key={day}
              value={day}
              variant="outline"
              size="sm"
              className={cn(
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              )}
            >
              {day.slice(0, 3)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTimeSlot}
          disabled={selectedDays.length === 0}
          className="mt-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Time Slot
        </Button>
      </FormItem>

      <div className="space-y-4">
        {value.map((slot, index) => (
          <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                {slot.days.map((day) => (
                  <span key={day} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                    {day}
                  </span>
                ))}
              </div>
              
              <TimeSlotPicker
                startTime={slot.start_time}
                endTime={slot.end_time}
                onStartTimeChange={(time) => 
                  updateTimeSlot(index, { start_time: time })
                }
                onEndTimeChange={(time) => 
                  updateTimeSlot(index, { end_time: time })
                }
              />
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeTimeSlot(index)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
