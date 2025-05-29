import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
  SelectValue 
} from "@/components/ui/select";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date | undefined) => void;
  showTimePicker?: boolean;
}

export function DatePicker({ value, onChange, showTimePicker = false }: DatePickerProps) {
  const [selectedHour, setSelectedHour] = React.useState<string>(
    format(value || new Date(), "HH")
  );
  const [selectedMinute, setSelectedMinute] = React.useState<string>(
    format(value || new Date(), "mm")
  );

  // Handle time changes
  React.useEffect(() => {
    if (showTimePicker && value) {
      setSelectedHour(format(value, "HH"));
      setSelectedMinute(format(value, "mm"));
    }
  }, [value, showTimePicker]);

  // Handle time selection
  const handleTimeChange = (hour: string, minute: string) => {
    if (!value) return;
    
    const newDate = new Date(value);
    newDate.setHours(parseInt(hour, 10), parseInt(minute, 10));
    onChange(newDate);
  };

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
          {value ? (
            showTimePicker ? (
              format(value, "PPP p") // Date with time
            ) : (
              format(value, "PPP") // Just date
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (date) {
              // Keep the time from the existing date
              if (value) {
                const newDate = new Date(date);
                newDate.setHours(value.getHours(), value.getMinutes());
                onChange(newDate);
              } else {
                onChange(date);
              }
            } else {
              onChange(date);
            }
          }}
          initialFocus
        />
        
        {showTimePicker && (
          <div className="border-t p-3 flex gap-2 items-center">
            <span className="text-sm">Time:</span>
            <Select
              value={selectedHour}
              onValueChange={(hour) => {
                setSelectedHour(hour);
                handleTimeChange(hour, selectedMinute);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }).map((_, i) => {
                  const hour = i.toString().padStart(2, "0");
                  return (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select
              value={selectedMinute}
              onValueChange={(minute) => {
                setSelectedMinute(minute);
                handleTimeChange(selectedHour, minute);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => {
                  const minute = (i * 5).toString().padStart(2, "0");
                  return (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}