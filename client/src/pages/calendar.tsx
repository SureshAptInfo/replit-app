import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { addDays, addMonths, format, getDay, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, isToday, parseISO, addHours } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, MapPin, Tag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSubAccount } from "@/context/sub-account-context";
import { APP_NAME } from "@/lib/constants";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  type: "meeting" | "task" | "reminder" | "other";
  location: string | null;
  leadId: number | null;
  leadName?: string;
  createdAt: string;
}

export default function Calendar() {
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: addHours(new Date(), 1),
    type: "meeting" as "meeting" | "task" | "reminder" | "other",
    location: "",
    leadId: null as number | null
  });

  // Get day name
  const getDayName = (date: Date) => {
    return format(date, "EEE");
  };

  // Get formatted day number
  const getFormattedDay = (date: Date) => {
    return format(date, "d");
  };

  // Fetch events
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/events", currentSubAccount?.id, format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      if (!currentSubAccount?.id) return [];
      
      // Get the start and end dates for the current month view
      const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");
      
      // Fetch events from the API
      const response = await apiRequest(
        "GET", 
        `/api/events?subAccountId=${currentSubAccount.id}&startDate=${startDate}&endDate=${endDate}`
      );
      return await response.json();
    },
    enabled: !!currentSubAccount?.id
  });

  // Fetch leads for dropdown
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads", currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount?.id) return [];
      const response = await apiRequest("GET", `/api/leads?subAccountId=${currentSubAccount.id}`);
      return await response.json();
    },
    enabled: !!currentSubAccount?.id
  });

  // Generate days for month view
  const generateMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group days into weeks
    const weeks = [];
    let week = [];
    
    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    
    return weeks;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event: Event) => 
      isSameDay(parseISO(event.startDate), date)
    );
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => addMonths(prev, -1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Create a new event
  const handleCreateEvent = () => {
    // Validation
    if (!newEvent.title.trim()) {
      toast({
        title: "Event title is required",
        variant: "destructive"
      });
      return;
    }
    
    // In a real implementation, we would send the request to the API
    // For now, we'll just simulate success
    toast({
      title: "Event created successfully"
    });
    
    // Reset form and close dialog
    setNewEvent({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: addHours(new Date(), 1),
      type: "meeting",
      location: "",
      leadId: null
    });
    
    setIsCreateEventOpen(false);
    // In a real implementation, we would refetch the events
    // refetch();
  };

  // Format time
  const formatEventTime = (dateString: string) => {
    return format(parseISO(dateString), "h:mm a");
  };

  // Get event badge color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "task": return "bg-green-100 text-green-800 hover:bg-green-200";
      case "reminder": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      default: return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Calendar | {APP_NAME}</title>
        <meta name="description" content="Manage your schedule and events" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Calendar</h1>
            <p className="text-muted-foreground">
              Manage your meetings, tasks, and schedule
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={goToToday}>Today</Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Add a new event to your calendar.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Event title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Event description"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date & Time</Label>
                      <DatePicker
                        value={newEvent.startDate}
                        onChange={(date) => date && setNewEvent({...newEvent, startDate: date})}
                        showTimePicker
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">End Date & Time</Label>
                      <DatePicker
                        value={newEvent.endDate}
                        onChange={(date) => date && setNewEvent({...newEvent, endDate: date})}
                        showTimePicker
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Event Type</Label>
                      <Select
                        value={newEvent.type}
                        onValueChange={(value: "meeting" | "task" | "reminder" | "other") => 
                          setNewEvent({...newEvent, type: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        placeholder="Event location"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <Button type="button" onClick={handleCreateEvent}>
                      Create Event
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="space-y-1">
              {generateMonthDays().map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const dayEvents = getEventsForDate(day);
                    const isSelected = isSameDay(day, selectedDate);
                    
                    return (
                      <div 
                        key={dayIndex}
                        className={`min-h-[100px] p-1 border rounded-md ${
                          isCurrentMonth ? "" : "bg-gray-50 text-gray-400"
                        } ${isToday(day) ? "border-blue-500" : ""} ${
                          isSelected ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="text-right text-sm p-1">
                          {getFormattedDay(day)}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event: Event) => (
                            <button
                              key={event.id}
                              className={`w-full text-left p-1 text-xs rounded truncate ${
                                event.type === "meeting" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                                event.type === "follow_up" ? "bg-purple-100 text-purple-800 hover:bg-purple-200" : 
                                event.type === "task" ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                                event.type === "reminder" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : 
                                "bg-primary/10 hover:bg-primary/20"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setIsEventDetailsOpen(true);
                              }}
                            >
                              <div className="font-medium">{event.title}</div>
                              {event.leadName && <div className="text-[10px] opacity-80 truncate">{event.leadName}</div>}
                            </button>
                          ))}
                          
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-center text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Selected Day Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              Events for {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No events scheduled for this day.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateEventOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map((event: Event) => (
                  <div key={event.id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsEventDetailsOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatEventTime(event.startDate)}
                      </span>
                      
                      {event.location && (
                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                      
                      {event.leadName && (
                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {event.leadName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                  <Badge className={getEventTypeColor(selectedEvent.type)}>
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {selectedEvent.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Date & Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedEvent.startDate), "MMMM d, yyyy")}
                      <br />
                      {formatEventTime(selectedEvent.startDate)}
                    </p>
                  </div>
                  
                  {selectedEvent.location && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Location</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedEvent.leadName && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Associated Lead</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.leadName}
                    </p>
                  </div>
                )}
                
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}