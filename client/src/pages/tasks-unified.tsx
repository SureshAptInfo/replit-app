import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { 
  format, parseISO, isSameDay, addMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, 
  addDays, subDays, addWeeks, subWeeks
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSubAccount } from "@/context/sub-account-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, Circle, Trash2, Filter, PlusCircle, Clock, 
  ArrowUpDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  List, LayoutGrid 
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";

// Components
import Header from "@/components/layout/header";
import MobileNavigation from "@/components/shared/mobile-navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  leadId: number | null;
  leadName?: string;
  createdAt: string;
}

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

export default function TasksUnified() {
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  
  // View states
  const [activeView, setActiveView] = useState<"tasks" | "calendar">("calendar");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week" | "day">("month");
  
  // Modal states
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  
  // Form states
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date(new Date().setHours(23, 59, 59, 999)),
    priority: "medium" as "low" | "medium" | "high",
    leadId: null as number | null
  });
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(new Date().setHours(new Date().getHours() + 1)),
    type: "meeting" as "meeting" | "task" | "reminder" | "other",
    location: "",
    leadId: null as number | null
  });

  // Fetch tasks
  const { 
    data: tasks = [], 
    isLoading: isTasksLoading, 
    refetch: refetchTasks 
  } = useQuery({
    queryKey: ["/api/tasks", currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount?.id) return [];
      const response = await apiRequest("GET", `/api/tasks?subAccountId=${currentSubAccount.id}`);
      return await response.json();
    },
    enabled: !!currentSubAccount?.id
  });

  // Fetch events
  const { 
    data: events = [], 
    isLoading: isEventsLoading, 
    refetch: refetchEvents 
  } = useQuery({
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

  // Filter and sort tasks
  const filteredTasks = (tasks as Task[])
    .filter(task => {
      if (filter === "all") return true;
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // Priority sorting (high -> medium -> low)
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const valueA = priorityValues[a.priority];
        const valueB = priorityValues[b.priority];
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      }
    });

  // Calendar generation functions
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
  
  // Generate days for week view
  const generateWeekDays = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };
  
  // Generate hours for day view
  const generateDayHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const date = new Date(selectedDate);
      date.setHours(i, 0, 0, 0);
      hours.push(date);
    }
    return hours;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event: Event) => 
      isSameDay(parseISO(event.startDate), date)
    );
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task: Task) => 
      isSameDay(parseISO(task.dueDate), date)
    );
  };

  // Navigation functions
  const goToPrevious = () => {
    if (calendarViewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else if (calendarViewMode === 'week') {
      setSelectedDate(prev => subWeeks(prev, 1));
    } else if (calendarViewMode === 'day') {
      setSelectedDate(prev => subDays(prev, 1));
    }
  };

  const goToNext = () => {
    if (calendarViewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (calendarViewMode === 'week') {
      setSelectedDate(prev => addWeeks(prev, 1));
    } else if (calendarViewMode === 'day') {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Create a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      toast({
        title: "Task title is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/tasks", {
        ...newTask,
        subAccountId: currentSubAccount?.id
      });
      
      toast({
        title: "Task created successfully"
      });
      
      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(new Date().setHours(23, 59, 59, 999)),
        priority: "medium",
        leadId: null
      });
      
      setIsCreateTaskOpen(false);
      refetchTasks();
    } catch (error) {
      toast({
        title: "Failed to create task",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Create a new event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title.trim()) {
      toast({
        title: "Event title is required",
        variant: "destructive"
      });
      return;
    }
    
    if (new Date(newEvent.startDate) > new Date(newEvent.endDate)) {
      toast({
        title: "End date must be after start date",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/events", {
        ...newEvent,
        subAccountId: currentSubAccount?.id
      });
      
      toast({
        title: "Event created successfully"
      });
      
      setNewEvent({
        title: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(new Date().setHours(new Date().getHours() + 1)),
        type: "meeting",
        location: "",
        leadId: null
      });
      
      setIsCreateEventOpen(false);
      refetchEvents();
    } catch (error) {
      toast({
        title: "Failed to create event",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
    try {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        completed: !completed
      });
      
      toast({
        title: `Task ${completed ? "reopened" : "completed"}`
      });
      
      refetchTasks();
    } catch (error) {
      toast({
        title: "Failed to update task",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Delete a task
  const deleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
      
      toast({
        title: "Task deleted"
      });
      
      refetchTasks();
    } catch (error) {
      toast({
        title: "Failed to delete task",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await apiRequest("DELETE", `/api/events/${eventId}`);
      
      toast({
        title: "Event deleted"
      });
      
      setSelectedEvent(null);
      setIsEventDetailsOpen(false);
      refetchEvents();
    } catch (error) {
      toast({
        title: "Failed to delete event",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy");
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy h:mm a");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 hover:bg-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "low": return "bg-green-100 text-green-800 hover:bg-green-200";
      default: return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-800";
      case "task": return "bg-green-100 text-green-800";
      case "reminder": return "bg-yellow-100 text-yellow-800";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  const toggleSort = (sortField: "dueDate" | "priority") => {
    if (sortBy === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(sortField);
      setSortOrder("asc");
    }
  };

  // Set calendar view as default
  useEffect(() => {
    setActiveView('calendar');
    setCalendarViewMode('month'); // Default to month view
  }, []);

  return (
    <>
      <Helmet>
        <title>Calendar & Tasks | {APP_NAME}</title>
        <meta name="description" content="Manage your calendar, schedule, appointments and tasks in one place" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Header title={activeView === "tasks" ? "Tasks" : "Calendar"} />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex flex-col space-y-6">
            {/* Header with actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Calendar & Tasks</h1>
                <p className="text-muted-foreground">
                  Manage your schedule, appointments, and to-do items in one place
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={activeView === "calendar" ? "default" : "outline"}
                  onClick={() => setActiveView("calendar")}
                  className="flex gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </Button>
                <Button 
                  variant={activeView === "tasks" ? "default" : "outline"} 
                  onClick={() => setActiveView("tasks")}
                  className="flex gap-2"
                >
                  <List className="h-4 w-4" />
                  Tasks
                </Button>
                
                {activeView === "tasks" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <Filter className="h-4 w-4" />
                        {filter === "all" ? "All Tasks" : filter === "active" ? "Active Tasks" : "Completed Tasks"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFilter("all")}>All Tasks</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("active")}>Active Tasks</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("completed")}>Completed Tasks</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {activeView === "calendar" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        {calendarViewMode === "month" 
                          ? "Month View" 
                          : calendarViewMode === "week" 
                            ? "Week View" 
                            : "Day View"
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCalendarViewMode("month")}>Month View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCalendarViewMode("week")}>Week View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCalendarViewMode("day")}>Day View</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <Button 
                  variant="default"
                  onClick={() => activeView === "tasks" ? setIsCreateTaskOpen(true) : setIsCreateEventOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {activeView === "tasks" ? "New Task" : "New Event"}
                </Button>
              </div>
            </div>
            
            {/* Main Content */}
            {activeView === "tasks" ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Your Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-muted-foreground">
                      {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} {filter !== "all" ? `(${filter})` : ''}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleSort("dueDate")}
                        className="text-xs"
                      >
                        Due Date
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy === "dueDate" ? "opacity-100" : "opacity-30"}`} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleSort("priority")}
                        className="text-xs"
                      >
                        Priority
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy === "priority" ? "opacity-100" : "opacity-30"}`} />
                      </Button>
                    </div>
                  </div>
                  
                  {isTasksLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full max-w-[200px]" />
                            <Skeleton className="h-3 w-full max-w-[300px]" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                        <CheckCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">No tasks found</h3>
                      <p className="text-muted-foreground mt-1">
                        {filter === "completed" 
                          ? "You haven't completed any tasks yet." 
                          : filter === "active" 
                            ? "You don't have any active tasks."
                            : "Create your first task to get started."}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsCreateTaskOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {filteredTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            task.completed ? 'bg-neutral-50' : 'bg-white'
                          }`}
                        >
                          <button
                            onClick={() => toggleTaskCompletion(task.id, task.completed)}
                            className="mt-1"
                          >
                            {task.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-neutral-300" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium ${task.completed ? 'line-through text-neutral-500' : ''}`}>
                              {task.title}
                            </h3>
                            
                            {task.description && (
                              <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <div className="flex items-center text-xs text-neutral-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(task.dueDate)}
                              </div>
                              
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              
                              {task.leadName && (
                                <Badge variant="outline" className="text-xs">
                                  {task.leadName}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-neutral-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {calendarViewMode === 'month' && format(currentDate, "MMMM yyyy")}
                      {calendarViewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), "MMM d, yyyy")}`}
                      {calendarViewMode === 'day' && format(selectedDate, "MMMM d, yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={goToPrevious}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                      <Button variant="outline" size="icon" onClick={goToNext}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isEventsLoading ? (
                    <div className="p-6">
                      <div className="grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {[...Array(35)].map((_, i) => (
                          <Skeleton key={i} className="aspect-square w-full" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Month View */}
                      {calendarViewMode === 'month' && (
                        <>
                          {/* Month View: Calendar header (days of week) */}
                          <div className="grid grid-cols-7 bg-muted/20">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                              <div key={day} className="p-2 text-center text-sm font-medium">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Month View: Calendar grid */}
                          <div className="grid grid-cols-7 divide-x divide-y border-t">
                            {generateMonthDays().flat().map((date, i) => {
                              const dayEvents = getEventsForDate(date);
                              const dayTasks = getTasksForDate(date);
                              const isCurrentMonth = isSameMonth(date, currentDate);
                              const isSelected = isSameDay(date, selectedDate);
                              const formattedDay = format(date, "d");
                              
                              return (
                                <div 
                                  key={i} 
                                  className={`min-h-[100px] p-1 ${
                                    isCurrentMonth ? "bg-white" : "bg-neutral-50 text-neutral-400"
                                  } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                                  onClick={() => setSelectedDate(date)}
                                >
                                  <div className={`text-right p-1 ${
                                    isToday(date) ? "bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center ml-auto" : ""
                                  }`}>
                                    {formattedDay}
                                  </div>
                                  
                                  <div className="mt-1">
                                    {/* Events */}
                                    {dayEvents.slice(0, 2).map((event, index) => (
                                      <div 
                                        key={index}
                                        className={`text-xs p-1 mb-1 rounded truncate ${getEventTypeColor(event.type)}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedEvent(event);
                                          setIsEventDetailsOpen(true);
                                        }}
                                      >
                                        {format(new Date(event.startDate), "h:mm a")} {event.title}
                                      </div>
                                    ))}
                                    
                                    {/* Tasks */}
                                    {dayTasks.slice(0, 1).map((task, index) => (
                                      <div 
                                        key={`task-${index}`}
                                        className="text-xs p-1 bg-neutral-100 rounded truncate flex items-center"
                                      >
                                        {task.completed ? (
                                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                        ) : (
                                          <Circle className="h-3 w-3 mr-1 text-neutral-400" />
                                        )}
                                        {task.title}
                                      </div>
                                    ))}
                                    
                                    {/* Show indicator for more events */}
                                    {(dayEvents.length > 2 || dayTasks.length > 1) && (
                                      <div className="text-xs text-neutral-500 mt-1">
                                        +{dayEvents.length + dayTasks.length - (dayEvents.length > 2 ? 2 : dayEvents.length) - (dayTasks.length > 1 ? 1 : dayTasks.length)} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      
                      {/* Week View */}
                      {calendarViewMode === 'week' && (
                        <>
                          {/* Week View: Calendar header (days of week with dates) */}
                          <div className="grid grid-cols-7 bg-muted/20">
                            {generateWeekDays().map((date, index) => (
                              <div key={index} className="p-2 text-center">
                                <div className="text-sm font-medium">
                                  {format(date, "EEE")}
                                </div>
                                <div className={`text-sm ${isToday(date) ? 'bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : ''}`}>
                                  {format(date, "d")}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Week View: Time slots */}
                          <div className="grid grid-cols-7 divide-x border-t min-h-[600px]">
                            {generateWeekDays().map((date, dayIndex) => (
                              <div key={dayIndex} className="relative min-h-[600px]">
                                {/* Time slots background */}
                                {[...Array(12)].map((_, hourIndex) => (
                                  <div 
                                    key={hourIndex} 
                                    className="border-b py-4 px-1 text-xs text-gray-400"
                                  >
                                    {hourIndex + 8}:00
                                  </div>
                                ))}
                                
                                {/* Events overlayed on time slots */}
                                {getEventsForDate(date).map((event, eventIndex) => {
                                  const startHour = new Date(event.startDate).getHours();
                                  const endHour = new Date(event.endDate).getHours();
                                  const duration = endHour - startHour || 1;
                                  
                                  // Calculate position for the event
                                  const top = (startHour - 8) * 41; // 41px per hour
                                  const height = duration * 41;
                                  
                                  return (
                                    <div
                                      key={eventIndex}
                                      className={`absolute left-1 right-1 ${getEventTypeColor(event.type)} rounded p-1 text-xs overflow-hidden`}
                                      style={{ 
                                        top: `${Math.max(0, top)}px`, 
                                        height: `${Math.max(20, height)}px`,
                                        zIndex: 10
                                      }}
                                      onClick={() => {
                                        setSelectedEvent(event);
                                        setIsEventDetailsOpen(true);
                                      }}
                                    >
                                      <div className="font-semibold truncate">{event.title}</div>
                                      <div className="truncate">{format(new Date(event.startDate), "h:mm a")}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Day View */}
                      {calendarViewMode === 'day' && (
                        <>
                          {/* Day View: Calendar header with selected date */}
                          <div className="p-4 bg-muted/20 text-center">
                            <h3 className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
                          </div>
                          
                          {/* Day View: Time slots */}
                          <div className="divide-y border-t">
                            {generateDayHours().filter(hour => hour.getHours() >= 7 && hour.getHours() <= 21).map((hour, hourIndex) => (
                              <div key={hourIndex} className="flex p-2 min-h-[80px] relative">
                                <div className="w-20 text-sm text-gray-500 py-1 text-center">
                                  {format(hour, "h:mm a")}
                                </div>
                                <div className="flex-1 ml-2">
                                  {/* Events that occur at this hour */}
                                  {events
                                    .filter((event) => {
                                      const eventDate = new Date(event.startDate);
                                      return isSameDay(eventDate, selectedDate) && 
                                             eventDate.getHours() === hour.getHours();
                                    })
                                    .map((event, eventIndex) => (
                                      <div 
                                        key={eventIndex}
                                        className={`mb-1 p-2 rounded ${getEventTypeColor(event.type)}`}
                                        onClick={() => {
                                          setSelectedEvent(event);
                                          setIsEventDetailsOpen(true);
                                        }}
                                      >
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-xs">
                                          {format(new Date(event.startDate), "h:mm a")} - 
                                          {format(new Date(event.endDate), "h:mm a")}
                                        </div>
                                        {event.location && (
                                          <div className="text-xs mt-1">{event.location}</div>
                                        )}
                                      </div>
                                    ))}
                                  
                                  {/* Tasks due at this hour */}
                                  {tasks
                                    .filter((task) => {
                                      const taskDate = new Date(task.dueDate);
                                      return isSameDay(taskDate, selectedDate) && 
                                             taskDate.getHours() === hour.getHours();
                                    })
                                    .map((task, taskIndex) => (
                                      <div 
                                        key={`task-${taskIndex}`}
                                        className="mb-1 p-2 rounded bg-neutral-100 flex items-start gap-2"
                                      >
                                        {task.completed ? (
                                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                                        ) : (
                                          <Circle className="h-4 w-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                                        )}
                                        <div>
                                          <div className="font-medium">{task.title}</div>
                                          <div className="text-xs text-neutral-500">
                                            Due {format(new Date(task.dueDate), "h:mm a")}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="p-4 justify-between items-center bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    {events.length} events this {calendarViewMode}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreateEventOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </main>
        
        <MobileNavigation />
      </div>
      
      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task details"
                  className="resize-none"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <DatePicker
                  value={new Date(newTask.dueDate)}
                  onChange={(date) => setNewTask({...newTask, dueDate: date || new Date()})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <RadioGroup 
                  defaultValue={newTask.priority}
                  onValueChange={(value) => setNewTask({...newTask, priority: value as "low" | "medium" | "high"})}
                  className="flex justify-start space-x-4 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="text-green-600">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-yellow-600">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="text-red-600">High</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead">Associated Lead (optional)</Label>
                <Select
                  value={newTask.leadId ? String(newTask.leadId) : ""}
                  onValueChange={(value) => setNewTask({
                    ...newTask, 
                    leadId: value ? Number(value) : null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={String(lead.id)}>{lead.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Add a new event to your calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter event details"
                  className="resize-none"
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker
                  value={new Date(newEvent.startDate)}
                  onChange={(date) => setNewEvent({...newEvent, startDate: date || new Date()})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker
                  value={new Date(newEvent.endDate)}
                  onChange={(date) => setNewEvent({...newEvent, endDate: date || new Date()})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => setNewEvent({
                    ...newEvent, 
                    type: value as "meeting" | "task" | "reminder" | "other"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={newEvent.location || ''}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead">Associated Lead (optional)</Label>
                <Select
                  value={newEvent.leadId ? String(newEvent.leadId) : ""}
                  onValueChange={(value) => setNewEvent({
                    ...newEvent, 
                    leadId: value ? Number(value) : null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={String(lead.id)}>{lead.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className={`px-3 py-1.5 mb-2 rounded ${getEventTypeColor(selectedEvent.type)}`}>
                  <DialogTitle className="text-lg">{selectedEvent.title}</DialogTitle>
                </div>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  {selectedEvent.description && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Description</h4>
                      <p className="text-sm">{selectedEvent.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Starts</h4>
                      <p className="text-sm">{formatDateTime(selectedEvent.startDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Ends</h4>
                      <p className="text-sm">{formatDateTime(selectedEvent.endDate)}</p>
                    </div>
                  </div>
                  
                  {selectedEvent.location && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Location</h4>
                      <p className="text-sm">{selectedEvent.location}</p>
                    </div>
                  )}
                  
                  {selectedEvent.leadName && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-1">Lead</h4>
                      <p className="text-sm">{selectedEvent.leadName}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Created</h4>
                    <p className="text-sm">{formatDate(selectedEvent.createdAt)}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => selectedEvent && deleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}