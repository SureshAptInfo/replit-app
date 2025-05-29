import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DownloadIcon } from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Define date range options
const dateRangeOptions = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
  { value: "custom", label: "Custom" }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch authentic data from API endpoints
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/reports/summary", dateRange],
    staleTime: 300000
  });

  const { data: conversionData, isLoading: conversionLoading } = useQuery({
    queryKey: ["/api/reports/conversions", dateRange],
    staleTime: 300000
  });

  const { data: sourceData, isLoading: sourceLoading } = useQuery({
    queryKey: ["/api/reports/sources", dateRange],
    staleTime: 300000
  });

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/reports/status", dateRange],
    staleTime: 300000
  });

  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ["/api/reports/tasks", dateRange],
    staleTime: 300000
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["/api/reports/team", dateRange],
    staleTime: 300000
  });

  const isLoading = summaryLoading || conversionLoading || sourceLoading || 
                   statusLoading || taskLoading || teamLoading;

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value === "custom") {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
      
      const end = new Date();
      let start;
      
      switch (value) {
        case "7":
          start = new Date();
          start.setDate(start.getDate() - 7);
          break;
        case "30":
          start = subMonths(end, 1);
          break;
        case "90":
          start = subMonths(end, 3);
          break;
        case "365":
          start = subMonths(end, 12);
          break;
        default:
          start = subMonths(end, 1);
      }
      
      setStartDate(start);
      setEndDate(end);
    }
  };

  const formatDate = (date?: Date) => {
    return date ? format(date, "MMM dd, yyyy") : "";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Analytics & Reports | LeadTrackPro</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Real insights from your actual lead data
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[200px]">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isCustomRange && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[130px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDate(startDate) : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[130px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatDate(endDate) : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Leads</CardDescription>
                <CardTitle className="text-3xl">{summaryData?.totalLeads || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  From your CRM data
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Conversion Rate</CardDescription>
                <CardTitle className="text-3xl">{summaryData?.conversionRate || 0}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Based on converted leads
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Leads</CardDescription>
                <CardTitle className="text-3xl">{summaryData?.activeLeads || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Currently in pipeline
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>Distribution of your actual lead sources</CardDescription>
              </CardHeader>
              <CardContent>
                {sourceData && sourceData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No lead source data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Status */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
                <CardDescription>Current status of your leads</CardDescription>
              </CardHeader>
              <CardContent>
                {statusData && statusData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No status data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Conversion Trends</CardTitle>
              <CardDescription>Monthly lead progression through your pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {conversionData && conversionData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={conversionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="new" stroke="#8884d8" name="New Leads" />
                      <Line type="monotone" dataKey="contacted" stroke="#82ca9d" name="Contacted" />
                      <Line type="monotone" dataKey="qualified" stroke="#ffc658" name="Qualified" />
                      <Line type="monotone" dataKey="converted" stroke="#ff7300" name="Converted" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No conversion data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trends</CardTitle>
              <CardDescription>Weekly task completion status</CardDescription>
            </CardHeader>
            <CardContent>
              {taskData && taskData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#00C49F" name="Completed" />
                      <Bar dataKey="pending" stackId="a" fill="#FFBB28" name="Pending" />
                      <Bar dataKey="overdue" stackId="a" fill="#FF8042" name="Overdue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No task data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Performance metrics based on actual lead assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {teamData && teamData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="leads" fill="#8884d8" name="Total Leads" />
                      <Bar yAxisId="left" dataKey="conversions" fill="#82ca9d" name="Conversions" />
                      <Bar yAxisId="right" dataKey="rate" fill="#ffc658" name="Conversion Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No team performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}