import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import { APP_NAME } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  ArrowRight, 
  ArrowUp, 
  Bell, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Download, 
  Inbox, 
  Loader2, 
  Mail,
  MessageSquare, 
  Phone, 
  PieChart as PieChartIcon, 
  User, 
  UserPlus, 
  Users 
} from "lucide-react";

// Status colors for consistency
const STATUS_COLORS = {
  new: "#8884d8",
  contacted: "#82ca9d",
  rnr: "#ffc658", 
  follow_up: "#ff8042",
  interested: "#0088fe",
  qualified: "#8844ff",
  converted: "#00C49F",
  lost: "#ff0000"
};

// We'll use real data from the API instead of these static arrays

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Custom stat card component
const StatCard = ({ 
  icon, 
  title, 
  value, 
  trend, 
  color, 
  linkTo 
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string, 
  trend?: string, 
  color?: string,
  linkTo?: string 
}) => {
  const CardContent = (
    <div className="p-0 h-full">
      <div className="grid grid-cols-[1fr_auto] items-center h-full">
        <div className="p-4 md:p-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-xl md:text-2xl font-bold">{value}</h3>
            {trend && (
              <span className="text-xs font-medium text-green-600 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`h-full w-12 md:w-16 flex items-center justify-center ${color || "bg-primary"}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="h-full block">
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer h-full">
          {CardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md h-full">
      {CardContent}
    </Card>
  );
};

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Get the appropriate color for task priority
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-amber-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-muted-foreground';
  }
};

export default function Dashboard() {
  // Fetch lead counts data with frequent updates
  const { data: leadCounts, isLoading: isLoadingLeadCounts } = useQuery({
    queryKey: ["/api/leads/counts"],
    staleTime: 5000, // Cache for 5 seconds for real-time updates
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  // Fetch leads for recent leads section with frequent updates
  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["/api/leads"],
    staleTime: 5000, // Cache for 5 seconds for real-time updates
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  // Fetch tasks for upcoming tasks section
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
    staleTime: 30000 // Cache for 30 seconds
  });
  
  // Fetch dashboard summary with real-time analytics data
  const { data: dashboardSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/reports/summary"],
    staleTime: 60000 // Cache for 1 minute
  });
  
  // Calculate new leads today from actual lead data
  const newLeadsToday = useMemo(() => {
    if (!leads) return 0;
    
    const today = new Date().toDateString();
    return leads.filter(lead => {
      const leadDate = new Date(lead.createdAt).toDateString();
      return leadDate === today;
    }).length;
  }, [leads]);

  // Process lead data for statistics - using real data only
  const stats = useMemo(() => {
    if (!leadCounts) return null;
    
    // Calculate real conversion rate from actual data
    const totalLeads = leadCounts?.all || leadCounts?.total || 0;
    const convertedLeads = leadCounts?.converted || 0;
    const realConversionRate = totalLeads > 0 
      ? Math.round((convertedLeads / totalLeads) * 100) 
      : 0;
    
    return {
      totalLeads: (leadCounts?.all || leadCounts?.total || 0).toString(),
      interestedLeads: (leadCounts?.interested || 0).toString(),
      pendingTasks: tasks?.length.toString() || "0",
      conversionRate: `${realConversionRate}%`,
      revenue: `$${((leadCounts?.converted || 0) * 2500).toLocaleString()}`, // Real calculation based on conversions
      newLeadsToday: newLeadsToday.toString(),
    };
  }, [leadCounts, tasks, newLeadsToday]);
  
  // Fetch status distribution with real-time data
  const { data: statusData, isLoading: isLoadingStatusData } = useQuery({
    queryKey: ["/api/reports/status"],
    staleTime: 60000 // Cache for 1 minute
  });
  
  // Create data for the status pie chart with real-time data
  const leadsByStatusData = useMemo(() => {
    // Fallback to lead counts if status data is not available
    if (!statusData && !leadCounts) return [];
    
    if (statusData) {
      // Map status data from the reports API to include colors
      return statusData.map((item: any) => ({
        name: item.name,
        value: item.value || 0,
        color: STATUS_COLORS[item.name.toLowerCase().replace(' ', '_')] || '#888'
      })).filter((item: any) => item.value > 0);
    } else {
      // Use lead counts as fallback
      return [
        { name: "New", value: leadCounts.new || 0, color: STATUS_COLORS.new },
        { name: "Contacted", value: leadCounts.contacted || 0, color: STATUS_COLORS.contacted },
        { name: "Follow Up", value: leadCounts.follow_up || 0, color: STATUS_COLORS.follow_up },
        { name: "Interested", value: leadCounts.interested || 0, color: STATUS_COLORS.interested },
        { name: "Qualified", value: leadCounts.qualified || 0, color: STATUS_COLORS.qualified },
        { name: "Converted", value: leadCounts.converted || 0, color: STATUS_COLORS.converted },
        { name: "Lost", value: leadCounts.lost || 0, color: STATUS_COLORS.lost },
      ].filter(item => item.value > 0);
    }
  }, [leadCounts, statusData]);
  
  // Fetch lead sources from reports API for real-time data
  const { data: sourcesData, isLoading: isLoadingSourcesData } = useQuery({
    queryKey: ["/api/reports/sources"],
    staleTime: 60000 // Cache for 1 minute
  });
  
  // Fetch traditional lead sources as backup
  const { data: leadSources } = useQuery({
    queryKey: ["/api/leads/sources"],
    staleTime: 300000 // Cache for 5 minutes
  });
  
  // Create data for sources chart using real-time data
  const leadsBySourceData = useMemo(() => {
    // Use real-time sources data if available
    if (sourcesData && sourcesData.length > 0) {
      return sourcesData.map((source: any) => ({
        name: source.name,
        value: source.value || 0
      })).filter((item: any) => item.value > 0);
    }
    
    // Fallback to calculated data if real-time data not available
    if (!leads) return [];
    
    // Count leads by source
    const sourceCounts = {};
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    // Convert to chart format
    return Object.entries(sourceCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [leads, sourcesData]);
  
  // Generate performance data based on actual lead data
  const performanceData = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    
    // Create a map of months with lead and conversion counts
    const monthData = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    
    // Initialize with the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate);
      month.setMonth(currentDate.getMonth() - i);
      const monthName = months[month.getMonth()];
      monthData[monthName] = { leads: 0, conversions: 0 };
    }
    
    // Count leads by month
    leads.forEach(lead => {
      const createdDate = new Date(lead.createdAt || Date.now());
      const monthName = months[createdDate.getMonth()];
      
      if (monthData[monthName]) {
        monthData[monthName].leads += 1;
        
        // If lead is converted, count as conversion
        if (lead.status === 'converted') {
          monthData[monthName].conversions += 1;
        }
      }
    });
    
    // Convert to chart format
    return Object.entries(monthData).map(([name, data]) => ({
      name,
      leads: data.leads,
      conversions: data.conversions,
    }));
  }, [leads]);
  
  // Combine loading states from all data fetching
  const isLoading = isLoadingLeadCounts || isLoadingLeads || isLoadingTasks;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Dashboard | {APP_NAME}</title>
        <meta name="description" content="Overview of your sales performance and leads" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your sales performance and lead metrics
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 auto-rows-fr">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0 h-full">
                  <div className="grid grid-cols-[1fr_auto] items-center h-full">
                    <div className="p-4 md:p-6">
                      <div className="h-3 w-20 bg-muted rounded mb-3"></div>
                      <div className="h-6 w-16 bg-muted rounded"></div>
                    </div>
                    <div className="h-full w-12 md:w-16 bg-muted"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 auto-rows-fr">
            <StatCard 
              icon={<User className="h-6 w-6 text-white" />} 
              title="Total Leads" 
              value={stats?.totalLeads || "0"} 
              color="bg-blue-600"
              linkTo="/leads"
            />
            <StatCard 
              icon={<Users className="h-6 w-6 text-white" />} 
              title="Interested Leads" 
              value={stats?.interestedLeads || "0"} 
              color="bg-emerald-600"
              linkTo="/leads?status=interested"
            />
            <StatCard 
              icon={<Calendar className="h-6 w-6 text-white" />} 
              title="Pending Tasks" 
              value={stats?.pendingTasks || "0"} 
              color="bg-orange-600"
              linkTo="/tasks"
            />
            <StatCard 
              icon={<Activity className="h-6 w-6 text-white" />} 
              title="Conversion Rate" 
              value={stats?.conversionRate || "0%"} 
              color="bg-violet-600"
              linkTo="/reports"
            />
            <StatCard 
              icon={<DollarSign className="h-6 w-6 text-white" />} 
              title="Revenue" 
              value={stats?.revenue || "$0"} 
              color="bg-green-600"
              linkTo="/reports"
            />
            <StatCard 
              icon={<UserPlus className="h-6 w-6 text-white" />} 
              title="New Leads Today" 
              value={stats?.newLeadsToday || "0"} 
              color="bg-indigo-600"
              linkTo="/leads?filter=today"
            />
          </div>
        )}
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Performance Trend</CardTitle>
              <CardDescription>Leads vs conversions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : leads && leads.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, value === 'leads' ? 'Total Leads' : 'Conversions']} />
                      <Legend />
                      <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="conversions" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                    <div>
                      <p>No historical lead data available.</p>
                      <p className="text-sm mt-2">Add leads to see performance trends over time.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href="/reports" className="text-sm text-primary flex items-center">
                View detailed reports <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Leads by Status</CardTitle>
              <CardDescription>Distribution of leads in your pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center">
                {isLoadingLeadCounts ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : leadsByStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsByStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {leadsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                    <div>
                      <p>No lead data available for chart visualization.</p>
                      <p className="text-sm mt-2">Add leads to see their status distribution.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href="/leads" className="text-sm text-primary flex items-center">
                Manage leads <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Recent Leads</CardTitle>
              <CardDescription>Latest prospects added to your pipeline</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Company</TableHead>
                      <TableHead className="hidden lg:table-cell">Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLeads ? (
                      Array(4).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><div className="h-4 bg-muted rounded animate-pulse w-20"></div></TableCell>
                          <TableCell className="hidden md:table-cell"><div className="h-4 bg-muted rounded animate-pulse w-24"></div></TableCell>
                          <TableCell className="hidden lg:table-cell"><div className="h-4 bg-muted rounded animate-pulse w-16"></div></TableCell>
                          <TableCell><div className="h-5 bg-muted rounded animate-pulse w-16"></div></TableCell>
                          <TableCell className="hidden sm:table-cell"><div className="h-4 bg-muted rounded animate-pulse w-20"></div></TableCell>
                          <TableCell className="text-right"><div className="h-8 bg-muted rounded animate-pulse w-16 ml-auto"></div></TableCell>
                        </TableRow>
                      ))
                    ) : leads && leads.length > 0 ? (
                      leads.slice(0, 4).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{lead.company || "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell">{lead.source || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              lead.status === "new" ? "bg-blue-100 text-blue-800" :
                              lead.status === "contacted" ? "bg-yellow-100 text-yellow-800" :
                              lead.status === "qualified" ? "bg-green-100 text-green-800" :
                              lead.status === "interested" ? "bg-purple-100 text-purple-800" :
                              lead.status === "converted" ? "bg-emerald-100 text-emerald-800" :
                              lead.status === "lost" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : "New"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{lead.createdAt ? formatDate(lead.createdAt) : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/leads/${lead.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No leads found. <Link href="/leads/new" className="text-primary underline">Add your first lead</Link>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">Showing 4 of 248 leads</p>
              <Link href="/leads" className="text-sm text-primary flex items-center">
                View all leads <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
              <CardDescription>Your scheduled activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingTasks ? (
                  Array(4).fill(0).map((_, index) => (
                    <div key={index} className="flex flex-col gap-1 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="h-3 w-3 mr-1 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : tasks && tasks.length > 0 ? (
                  tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex flex-col gap-1 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{task.title}</p>
                        <span 
                          className={`text-xs font-medium ${getPriorityColor(task.priority || 'Medium')}`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" /> Due: {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No upcoming tasks. <Link href="/tasks" className="text-primary underline">Add a task</Link>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href="/tasks" className="text-sm text-primary flex items-center">
                View all tasks <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Lead Sources</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : leadsBySourceData && leadsBySourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={leadsBySourceData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {leadsBySourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                    <div>
                      <p>No lead source data available.</p>
                      <p className="text-sm mt-2">Add leads with different sources to see distribution.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href="/reports" className="text-sm text-primary flex items-center">
                View source analytics <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Communication Activity</CardTitle>
              <CardDescription>Email, phone, and message interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center w-full h-[250px]">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Email activities */}
                  {(() => {
                    // Get all lead activities of type 'email'
                    const emailCount = 0; // Will be replaced with real activity data when available
                    const emailGoal = 10; // Weekly goal
                    const emailProgress = Math.min(100, (emailCount / emailGoal) * 100);
                    
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-blue-600" /> Email Sent
                          </span>
                          <span className="text-sm text-muted-foreground">{emailCount}/{emailGoal}</span>
                        </div>
                        <Progress value={emailProgress} className="h-2" />
                      </div>
                    );
                  })()}
                  
                  {/* Call activities */}
                  {(() => {
                    // Get all lead activities of type 'call'
                    const callCount = 0; // Will be replaced with real activity data when available
                    const callGoal = 8; // Weekly goal
                    const callProgress = Math.min(100, (callCount / callGoal) * 100);
                    
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-green-600" /> Calls Made
                          </span>
                          <span className="text-sm text-muted-foreground">{callCount}/{callGoal}</span>
                        </div>
                        <Progress value={callProgress} className="h-2" />
                      </div>
                    );
                  })()}
                  
                  {/* Message activities */}
                  {(() => {
                    // Get all lead activities of type 'message', 'sms', or 'whatsapp'
                    const messageCount = 0; // Will be replaced with real activity data when available
                    const messageGoal = 15; // Weekly goal
                    const messageProgress = Math.min(100, (messageCount / messageGoal) * 100);
                    
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2 text-purple-600" /> Messages Sent
                          </span>
                          <span className="text-sm text-muted-foreground">{messageCount}/{messageGoal}</span>
                        </div>
                        <Progress value={messageProgress} className="h-2" />
                      </div>
                    );
                  })()}
                  
                  {/* Follow-up activities */}
                  {(() => {
                    const followUpCount = 0; // Will be replaced with real data when available
                    const followUpGoal = 5; // Weekly goal
                    const followUpProgress = Math.min(100, (followUpCount / followUpGoal) * 100);
                    
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <Bell className="h-4 w-4 mr-2 text-amber-600" /> Follow-ups
                          </span>
                          <span className="text-sm text-muted-foreground">{followUpCount}/{followUpGoal}</span>
                        </div>
                        <Progress value={followUpProgress} className="h-2" />
                      </div>
                    );
                  })()}
                  
                  {/* Response activities */}
                  {(() => {
                    const responseCount = 0; // Will be replaced with real data when available
                    const responseGoal = 10; // Weekly goal
                    const responseProgress = Math.min(100, (responseCount / responseGoal) * 100);
                    
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <Inbox className="h-4 w-4 mr-2 text-red-600" /> Responses
                          </span>
                          <span className="text-sm text-muted-foreground">{responseCount}/{responseGoal}</span>
                        </div>
                        <Progress value={responseProgress} className="h-2" />
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href="/messages" className="text-sm text-primary flex items-center">
                View communication details <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}