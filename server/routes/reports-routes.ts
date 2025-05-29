import { Request, Response } from "express";
import { Express } from "express";
import { storage } from "../storage";

export function registerReportsRoutes(app: Express) {
  
  // Get lead summary data for dashboard
  app.get("/api/reports/summary", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get lead counts
      const leadCounts = await storage.getLeadCounts(subAccountId);
      
      // Calculate conversion rates
      const conversionRate = leadCounts.total > 0 
        ? Math.round((leadCounts.converted / leadCounts.total) * 100) 
        : 0;
      
      // Calculate engagement rate (interested + qualified / total)
      const engagementRate = leadCounts.total > 0
        ? Math.round(((leadCounts.interested + leadCounts.qualified) / leadCounts.total) * 100)
        : 0;
      
      // Get recent leads
      const leads = await storage.getLeadsBySubAccount(subAccountId);
      
      // Calculate daily stats over last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Calculate daily new leads
      const dailyLeads = leads.reduce((acc: any, lead: any) => {
        if (lead.createdAt && new Date(lead.createdAt) >= thirtyDaysAgo) {
          const date = new Date(lead.createdAt).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Format data for charts
      const dailyLeadsData = Object.keys(dailyLeads).map(date => ({
        date,
        count: dailyLeads[date]
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      // Return dashboard summary data
      res.json({
        leadCounts,
        conversionRate,
        engagementRate,
        dailyLeadsData,
        recentLeads: leads.slice(0, 5) // Only return the 5 most recent leads
      });
    } catch (error: any) {
      console.error("Error fetching dashboard summary:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get lead status distribution for analytics
  app.get("/api/reports/status", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get lead counts
      const leadCounts = await storage.getLeadCounts(subAccountId);
      
      // Format data for pie chart
      const statusData = [
        { name: "New", value: leadCounts.new },
        { name: "Contacted", value: leadCounts.contacted },
        { name: "Follow Up", value: leadCounts.follow_up },
        { name: "Interested", value: leadCounts.interested },
        { name: "Qualified", value: leadCounts.qualified },
        { name: "Converted", value: leadCounts.converted },
        { name: "Lost", value: leadCounts.lost }
      ];
      
      res.json(statusData);
    } catch (error: any) {
      console.error("Error fetching status distribution:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get lead source distribution for analytics
  app.get("/api/reports/sources", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get all leads
      const leads = await storage.getLeadsBySubAccount(subAccountId);
      
      // Count leads by source
      const sourceCounts = leads.reduce((acc: any, lead: any) => {
        const source = lead.source || "Unknown";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});
      
      // Format data for pie chart
      const sourceData = Object.keys(sourceCounts).map(source => ({
        name: source,
        value: sourceCounts[source]
      }));
      
      res.json(sourceData);
    } catch (error: any) {
      console.error("Error fetching source distribution:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get conversion rates by source
  app.get("/api/reports/conversions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get all leads
      const leads = await storage.getLeadsBySubAccount(subAccountId);
      
      // Count leads and conversions by source
      const sourceStats = leads.reduce((acc: any, lead: any) => {
        const source = lead.source || "Unknown";
        
        if (!acc[source]) {
          acc[source] = {
            total: 0,
            converted: 0
          };
        }
        
        acc[source].total += 1;
        
        if (lead.status === "converted") {
          acc[source].converted += 1;
        }
        
        return acc;
      }, {});
      
      // Calculate conversion rates
      const conversionData = Object.keys(sourceStats).map(source => {
        const stats = sourceStats[source];
        const rate = stats.total > 0 
          ? Math.round((stats.converted / stats.total) * 100) 
          : 0;
        
        return {
          name: source,
          rate,
          total: stats.total,
          converted: stats.converted
        };
      });
      
      res.json(conversionData);
    } catch (error: any) {
      console.error("Error fetching conversion rates:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get task distribution by team member
  app.get("/api/reports/tasks", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get all tasks for the subaccount
      const tasks = await storage.getTasks(subAccountId);
      
      // Count tasks by assignee
      const taskCounts = tasks.reduce((acc: any, task: any) => {
        const assigneeId = task.assignedToId || "Unassigned";
        
        if (!acc[assigneeId]) {
          acc[assigneeId] = {
            open: 0,
            completed: 0,
            total: 0
          };
        }
        
        acc[assigneeId].total += 1;
        
        if (task.status === "completed") {
          acc[assigneeId].completed += 1;
        } else {
          acc[assigneeId].open += 1;
        }
        
        return acc;
      }, {});
      
      // Get team members to associate names with IDs
      const teamMembers = await storage.getUsersBySubAccount(subAccountId);
      const teamMap = teamMembers.reduce((map: any, member: any) => {
        map[member.id] = member.name;
        return map;
      }, {});
      
      // Format data for chart
      const taskData = await Promise.all(Object.keys(taskCounts).map(async (id) => {
        const stats = taskCounts[id];
        const name = id === "Unassigned" ? "Unassigned" : (teamMap[id] || `User ${id}`);
        
        return {
          name,
          open: stats.open,
          completed: stats.completed,
          total: stats.total,
          completion: stats.total > 0 
            ? Math.round((stats.completed / stats.total) * 100) 
            : 0
        };
      }));
      
      res.json(taskData);
    } catch (error: any) {
      console.error("Error fetching task distribution:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get team performance metrics
  app.get("/api/reports/team", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get team members
      const teamMembers = await storage.getUsersBySubAccount(subAccountId);
      
      // Get leads and tasks for the subaccount
      const leads = await storage.getLeadsBySubAccount(subAccountId);
      const tasks = await storage.getTasks(subAccountId);
      
      // Calculate performance metrics for each team member
      const teamPerformance = teamMembers.map(member => {
        // Count leads assigned to this team member
        const memberLeads = leads.filter((lead: any) => lead.assignedToId === member.id);
        
        // Count conversions
        const conversions = memberLeads.filter((lead: any) => lead.status === "converted").length;
        
        // Calculate conversion rate
        const conversionRate = memberLeads.length > 0 
          ? Math.round((conversions / memberLeads.length) * 100) 
          : 0;
        
        // Count tasks
        const memberTasks = tasks.filter((task: any) => task.assignedToId === member.id);
        const completedTasks = memberTasks.filter((task: any) => task.status === "completed").length;
        
        // Calculate task completion rate
        const taskCompletionRate = memberTasks.length > 0 
          ? Math.round((completedTasks / memberTasks.length) * 100) 
          : 0;
        
        return {
          id: member.id,
          name: member.name,
          role: member.role,
          leadsCount: memberLeads.length,
          conversions,
          conversionRate,
          tasksCount: memberTasks.length,
          completedTasks,
          taskCompletionRate
        };
      });
      
      res.json(teamPerformance);
    } catch (error: any) {
      console.error("Error fetching team performance:", error);
      res.status(500).json({ message: error.message });
    }
  });
}