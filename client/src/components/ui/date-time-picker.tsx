import * as React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export function DateTimePicker({ value, onChange, minDate }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date>(value || new Date());

  // Update the parent component when the date or time changes
  React.useEffect(() => {
    onChange(selectedDateTime);
  }, [selectedDateTime, onChange]);

  // Handle date change from the calendar
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(date.getFullYear());
      newDateTime.setMonth(date.getMonth());
      newDateTime.setDate(date.getDate());
      setSelectedDateTime(newDateTime);
    }
  };

  // Handle hour change
  const handleHourChange = (hour: string) => {
    const newDateTime = new Date(selectedDateTime);
    newDateTime.setHours(parseInt(hour, 10));
    setSelectedDateTime(newDateTime);
  };

  // Handle minute change
  const handleMinuteChange = (minute: string) => {
    const newDateTime = new Date(selectedDateTime);
    newDateTime.setMinutes(parseInt(minute, 10));
    setSelectedDateTime(newDateTime);
  };

  // Generate hours and minutes for the dropdown
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP p") : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={handleDateChange}
          initialFocus
          disabled={minDate ? (date) => date < minDate : undefined}
        />
        <div className="border-t p-3 flex gap-2 items-center">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={format(selectedDateTime, "HH")}
            onValueChange={handleHourChange}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select
            value={format(selectedDateTime, "mm")}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}