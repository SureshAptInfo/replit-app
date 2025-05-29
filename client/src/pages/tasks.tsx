import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSubAccount } from "@/context/sub-account-context";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Circle, Trash2, Filter, PlusCircle, Clock, ArrowUpDown } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";

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

export default function Tasks() {
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date(new Date().setHours(23, 59, 59, 999)),
    priority: "medium" as "low" | "medium" | "high",
    leadId: null as number | null
  });

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/tasks", currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount?.id) return [];
      const response = await apiRequest("GET", `/api/tasks?subAccountId=${currentSubAccount.id}`);
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
    
    if (new Date(newTask.dueDate) < new Date()) {
      toast({
        title: "Due date must be in the future",
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
      
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to create task",
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
      
      refetch();
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
      
      refetch();
    } catch (error) {
      toast({
        title: "Failed to delete task",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 hover:bg-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "low": return "bg-green-100 text-green-800 hover:bg-green-200";
      default: return "bg-blue-100 text-blue-800 hover:bg-blue-200";
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

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Tasks | {APP_NAME}</title>
        <meta name="description" content="Manage your tasks and to-dos" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Tasks</h1>
            <p className="text-muted-foreground">
              Manage your team's tasks and to-dos
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
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
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task or to-do item to your list.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Enter task description"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <DatePicker
                        value={newTask.dueDate}
                        onChange={(date) => date && setNewTask({...newTask, dueDate: date})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <RadioGroup
                        value={newTask.priority}
                        onValueChange={(value: "low" | "medium" | "high") => 
                          setNewTask({...newTask, priority: value})
                        }
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low" />
                          <Label htmlFor="low" className="font-normal">Low</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium" className="font-normal">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <Label htmlFor="high" className="font-normal">High</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <Button type="submit">Create Task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
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
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleSort("dueDate")}
                  className="text-sm gap-1"
                >
                  Due Date <ArrowUpDown className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleSort("priority")}
                  className="text-sm gap-1"
                >
                  Priority <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg flex justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks found.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create your first task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task: Task) => (
                  <div key={task.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between gap-4 ${task.completed ? 'bg-slate-50 dark:bg-slate-900' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskCompletion(task.id, task.completed)}
                        className="mt-1 text-primary hover:text-primary/80"
                      >
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      
                      <div className="space-y-1">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        
                        {task.description && (
                          <p className={`text-sm ${task.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </Badge>
                          
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                          </Badge>
                          
                          {task.leadId && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-100">
                              Lead: {task.leadName || `#${task.leadId}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}