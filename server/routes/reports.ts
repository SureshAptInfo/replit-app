import { Request, Response } from "express";
import { storage } from "../storage";

export function registerReportRoutes(app: any, isAuthenticated: any) {
  // Lead sources report endpoint with real data
  app.get("/api/reports/sources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      const dateRange = req.query.dateRange as string || '30';
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      // Get leads for the period
      const allLeads = await storage.getLeadsBySubAccount(subAccountId);
      const leadsInRange = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= startDate && leadDate <= endDate;
      });
      
      // Group leads by source and calculate metrics
      const sourceStats = leadsInRange.reduce((acc, lead) => {
        const source = lead.source || "Unknown";
        if (!acc[source]) {
          acc[source] = { total: 0, converted: 0 };
        }
        acc[source].total++;
        if (lead.status === 'converted') {
          acc[source].converted++;
        }
        return acc;
      }, {} as Record<string, { total: number; converted: number }>);
      
      // Convert to array format with conversion rates
      const sources = Object.entries(sourceStats).map(([name, stats], index) => ({
        id: index + 1,
        name,
        count: stats.total,
        conversionRate: stats.total > 0 ? Number((stats.converted / stats.total * 100).toFixed(1)) : 0
      })).sort((a, b) => b.count - a.count); // Sort by count descending
      
      res.json(sources);
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      res.status(500).json({ message: "Error fetching lead sources" });
    }
  });

  // Lead conversions report endpoint with real data
  app.get("/api/reports/conversions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      
      // Get all leads
      const allLeads = await storage.getLeadsBySubAccount(subAccountId);
      
      // Group leads by month over the last 6 months
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthLeads = allLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          return leadDate >= monthDate && leadDate < nextMonthDate;
        });
        
        const statusCounts = monthLeads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        months.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          new: statusCounts.new || 0,
          contacted: statusCounts.contacted || 0,
          qualified: statusCounts.qualified || 0,
          converted: statusCounts.converted || 0
        });
      }
      
      res.json(months);
    } catch (error) {
      console.error("Error fetching conversion data:", error);
      res.status(500).json({ message: "Error fetching conversion data" });
    }
  });

  // Tasks completion report endpoint with real data
  app.get("/api/reports/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      
      // Get all tasks
      const allTasks = await storage.getTasks(subAccountId);
      
      // Generate weekly data for the last 5 weeks
      const weeklyData = [];
      const now = new Date();
      
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekTasks = allTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate >= weekStart && taskDate < weekEnd;
        });
        
        const currentTime = new Date();
        const completed = weekTasks.filter(task => task.completed).length;
        const overdue = weekTasks.filter(task => !task.completed && new Date(task.dueDate) < currentTime).length;
        const pending = weekTasks.filter(task => !task.completed && new Date(task.dueDate) >= currentTime).length;
        
        weeklyData.push({
          date: weekStart.toISOString().split('T')[0],
          completed,
          overdue,
          pending
        });
      }
      
      res.json(weeklyData);
    } catch (error) {
      console.error("Error fetching task data:", error);
      res.status(500).json({ message: "Error fetching task data" });
    }
  });

  // Team performance report endpoint
  app.get("/api/reports/team", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teamData = [
        { name: "John", leads: 45, conversions: 12, rate: 26.7, responseTime: 2.5 },
        { name: "Sarah", leads: 38, conversions: 15, rate: 39.5, responseTime: 1.2 },
        { name: "Michael", leads: 52, conversions: 20, rate: 38.5, responseTime: 1.8 },
        { name: "Emily", leads: 30, conversions: 8, rate: 26.7, responseTime: 3.2 },
        { name: "David", leads: 35, conversions: 12, rate: 34.3, responseTime: 4.1 },
      ];
      
      res.json(teamData);
    } catch (error) {
      console.error("Error fetching team data:", error);
      res.status(500).json({ message: "Error fetching team data" });
    }
  });

  // Lead status distribution report endpoint with real data
  app.get("/api/reports/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      const dateRange = req.query.dateRange as string || '30';
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      // Get leads for the period
      const allLeads = await storage.getLeadsBySubAccount(subAccountId);
      const leadsInRange = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= startDate && leadDate <= endDate;
      });
      
      // Count leads by status
      const statusCounts = leadsInRange.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusData = [
        { name: "New", value: statusCounts.new || 0, color: "#8884d8" },
        { name: "Contacted", value: statusCounts.contacted || 0, color: "#82ca9d" },
        { name: "RNR", value: statusCounts.rnr || 0, color: "#ffc658" },
        { name: "Follow Up", value: statusCounts.follow_up || 0, color: "#ff8042" },
        { name: "Interested", value: statusCounts.interested || 0, color: "#0088fe" },
        { name: "Qualified", value: statusCounts.qualified || 0, color: "#8844ff" },
        { name: "Converted", value: statusCounts.converted || 0, color: "#00C49F" },
        { name: "Lost", value: statusCounts.lost || 0, color: "#ff0000" },
      ].filter(item => item.value > 0); // Only show statuses that have leads
      
      res.json(statusData);
    } catch (error) {
      console.error("Error fetching status data:", error);
      res.status(500).json({ message: "Error fetching status data" });
    }
  });

  // Summary dashboard data endpoint with real calculations
  app.get("/api/reports/summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      const dateRange = req.query.dateRange as string || '30';
      
      // Calculate date ranges for comparison
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - parseInt(dateRange));
      
      // Get all leads and tasks
      const allLeads = await storage.getLeadsBySubAccount(subAccountId);
      const allTasks = await storage.getTasks(subAccountId);
      
      // Filter by current period
      const currentLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= startDate && leadDate <= endDate;
      });
      
      // Filter by previous period for comparison
      const prevLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= prevStartDate && leadDate < startDate;
      });
      
      // Calculate today's leads
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const newLeadsToday = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= today && leadDate < tomorrow;
      }).length;
      
      // Calculate metrics
      const totalLeads = currentLeads.length;
      const convertedLeads = currentLeads.filter(lead => lead.status === 'converted').length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0;
      
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(task => task.completed).length;
      
      // Calculate percentage changes
      const prevTotalLeads = prevLeads.length;
      const prevConvertedLeads = prevLeads.filter(lead => lead.status === 'converted').length;
      const prevConversionRate = prevTotalLeads > 0 ? (prevConvertedLeads / prevTotalLeads * 100) : 0;
      
      const leadsChange = prevTotalLeads > 0 ? 
        ((totalLeads - prevTotalLeads) / prevTotalLeads * 100) : 
        totalLeads > 0 ? 100 : 0;
      
      const conversionChange = prevConversionRate > 0 ? 
        ((conversionRate - prevConversionRate) / prevConversionRate * 100) : 
        conversionRate > 0 ? 100 : 0;

      const summary = {
        totalLeads,
        newLeadsToday,
        conversionRate: Number(conversionRate.toFixed(1)),
        averageResponseTime: 0, // Would need activity timestamps to calculate
        totalRevenue: 0, // Would need payment integration
        totalTasks,
        completedTasks,
        averageTimeToConversion: 0, // Would need detailed activity analysis
        leadsChange: Number(leadsChange.toFixed(1)),
        conversionChange: Number(conversionChange.toFixed(1)),
        dateRange
      };
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      res.status(500).json({ message: "Error fetching summary data" });
    }
  });
}