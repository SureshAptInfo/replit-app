import { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import fs from "fs";
import path from "path";
import multer from "multer";
import { parse } from "csv-parse";
import passport from "passport";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { generateLeadScore, generateMessageSuggestions, generateFollowUpRecommendation } from "./utils/openai";
import integrationRouter from "./routes/integration-routes";
import notificationRouter from "./routes/notification-routes";
import { registerSettingsRoutes } from "./routes/settings-routes";
import { registerTeamRoutes } from "./routes/team-routes";
import { permissionsService } from './permissions-service';
import { registerReportsRoutes } from "./routes/reports-routes";
import { router as whatsappRouter } from "./routes/whatsapp-routes";
import { registerLeadSourcesRoutes } from "./routes/lead-sources-routes";
import { registerImportRoutes } from "./routes/import-routes";
import { registerFixedImportRoutes } from "./routes/import-fixed";
import { registerSimpleImportRoutes } from "./routes/simple-import";

// Initialize multer with memory storage for CSV imports
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    // Accept only csv files
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Common validation schemas and utility functions
function handleZodError(error: any, res: Response) {
  if (error.errors) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: error.errors
    });
  }
  return res.status(500).json({ message: error.message });
}

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Admin role middleware (super_admin, agency_owner, agency_admin)
function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as User;
  if (user.role === "super_admin" || user.role === "agency_owner" || user.role === "agency_admin") {
    return next();
  }
  
  return res.status(403).json({ message: "Forbidden: Admin access required" });
}

// Super admin role middleware (super_admin only)
function isSuperAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as User;
  if (user.role === "super_admin") {
    return next();
  }
  
  return res.status(403).json({ message: "Forbidden: Super admin access required" });
}

// Agency owner middleware
function isAgencyOwner(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as User;
  if (user.role === "super_admin" || user.role === "agency_owner") {
    return next();
  }
  
  return res.status(403).json({ message: "Forbidden: Agency owner access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload setup
  const upload = multer({ dest: 'uploads/' });
  
  // IMPORTANT: Define non-ID routes first
  
  // Lead sources API - placed here to avoid conflict with ID-based routes
  app.get("/api/leads/sources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Fetching lead sources");
      const sources = [
        { id: "Website", name: "Website" },
        { id: "Referral", name: "Referral" },
        { id: "Social Media", name: "Social Media" },
        { id: "Email Campaign", name: "Email Campaign" },
        { id: "LinkedIn", name: "LinkedIn" },
        { id: "Event", name: "Event" },
        { id: "Cold Call", name: "Cold Call" },
        { id: "Other", name: "Other" }
      ];
      
      console.log("Returning lead sources");
      res.json(sources);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      res.status(500).json({ message: "Error fetching lead sources" });
    }
  });
  
  // Create lead API - must be defined before ID routes
  app.post("/api/leads", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Get request body
      const {
        name,
        email,
        phone,
        source,
        status = 'new',
        assignedTo,
        subAccountId,
        notes
      } = req.body;
      
      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }
      
      // Use the current user's subaccount if not specified
      const actualSubAccountId = subAccountId || user.subAccountId || 1;
      
      // Create lead data object
      const leadData = {
        name,
        phone,
        email: email || null,
        source: source || 'Manual Entry',
        status,
        assignedTo: assignedTo || user.id,
        subAccountId: actualSubAccountId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        // Initialize other required fields with default values
        value: 0,
        customFields: {},
      };
      
      console.log("Creating new lead:", leadData);
      
      // Create the lead
      const newLead = await storage.createLead(leadData);
      
      // Create initial activity if notes were provided
      if (notes) {
        await storage.createLeadActivity({
          leadId: newLead.id,
          userId: user.id,
          type: 'note',
          content: notes
        });
      }
      
      // Notify the assignee if it's different from the creator
      if (assignedTo && assignedTo !== user.id) {
        await storage.createNotification({
          userId: assignedTo,
          type: 'lead_assigned',
          title: 'New Lead Assigned',
          content: `A new lead (${name}) has been assigned to you`,
          entityId: newLead.id,
          entityType: 'lead',
          read: false
        });
      }
      
      // Return the created lead
      res.status(200).json(newLead);
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ message: "Error creating lead" });
    }
  });
  
  // Lead counts API - also needed before ID routes
  app.get("/api/leads/counts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      
      // Get the base lead counts for the subaccount
      const counts = await storage.getLeadCounts(subAccountId);
      
      // For non-admin users, we need to filter counts to only show their assigned leads
      if (user.role !== "super_admin" && user.role !== "agency_owner" && 
          user.role !== "agency_admin" && user.role !== "client_admin") {
        
        console.log(`Regular user ${user.username} (${user.role}) retrieving lead counts, filtering for ID: ${user.id}`);
        
        // Get all leads for the subaccount
        const allLeads = await storage.getLeadsBySubAccount(subAccountId);
        
        // Filter to only those assigned to this user
        const userLeads = allLeads.filter(lead => lead.assignedTo === user.id);
        
        // Count leads by status
        const userCounts = {
          total: userLeads.length,
          new: userLeads.filter(lead => lead.status === 'new').length,
          contacted: userLeads.filter(lead => lead.status === 'contacted').length,
          rnr: userLeads.filter(lead => lead.status === 'rnr').length,
          follow_up: userLeads.filter(lead => lead.status === 'follow_up').length,
          interested: userLeads.filter(lead => lead.status === 'interested').length,
          // Removed 'qualified' status as it's not in the valid schema
          converted: userLeads.filter(lead => lead.status === 'converted').length,
          lost: userLeads.filter(lead => lead.status === 'lost').length
        };
        
        // Add timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        console.log(`Returning user-specific lead counts for ${user.username} with timestamp=${timestamp}:`, userCounts);
        
        return res.json({ 
          ...userCounts,
          timestamp
        });
      }
      
      // For admin users, return the full counts
      const timestamp = new Date().getTime();
      console.log(`Returning admin lead counts with timestamp=${timestamp}:`, counts);
      
      res.json({ 
        ...counts,
        timestamp
      });
    } catch (error) {
      console.error('Error fetching lead counts:', error);
      res.status(500).json({ message: "Error fetching lead counts" });
    }
  });
  
  // Lead import route is now handled by import-routes.ts

  // Authentication routes
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error, user: any, info: any) => {
      if (err) { 
        return next(err); 
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err) => {
        if (err) { 
          return next(err); 
        }
        return res.json({ 
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        });
      });
    })(req, res, next);
  });
  
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.json({ success: true });
    });
  });
  
  // Lead routes - Lead counts is already defined at the top of the file
  
  app.get("/api/leads", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      const statusFilter = req.query.status as string | undefined;
      const sourceFilter = req.query.source as string | undefined;
      
      // Add timestamp parameter to prevent caching
      const timestamp = req.query.timestamp || new Date().getTime();
      console.log(`GET /api/leads with filters: subAccountId=${subAccountId}, status=${statusFilter || 'none'}, source=${sourceFilter || 'none'}, timestamp=${timestamp}`);

      // Filter access based on user role
      let leads;
      
      console.log(`User ${user.username} (role: ${user.role}) requesting leads`);
      
      // Admin roles can see all leads
      if (user.role === "super_admin" || user.role === "agency_owner" || 
          user.role === "agency_admin" || user.role === "client_admin") {
        
        console.log(`Admin user ${user.username} (${user.role}) has full access to leads`);
        
        // Get all leads from storage based on filters
        leads = await storage.getLeadsBySubAccount(subAccountId, { 
          status: statusFilter, 
          source: sourceFilter 
        });
      } else {
        // Regular team members can only see leads assigned to them
        console.log(`Regular user ${user.username} (${user.role}) can only view leads assigned to them (ID: ${user.id})`);
        
        // Get all leads for the subaccount first with the filters applied
        const allLeads = await storage.getLeadsBySubAccount(subAccountId, {
          status: statusFilter,
          source: sourceFilter
        });
        
        // Then filter to only those assigned to this user
        leads = allLeads.filter(lead => lead.assignedTo === user.id);
        
        // Count the total number of leads in the system for logging
        const totalLeadCount = allLeads.length;
        console.log(`User ${user.username} has ${leads.length} leads assigned out of ${totalLeadCount} total leads`);
      }
      
      console.log(`Returning ${leads.length} leads matching the filters`);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: "Error fetching leads" });
    }
  });
  
  // Get lead by ID
  app.get("/api/leads/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead
      if (user.role === "client_user" && lead.assignedTo !== user.id) {
        return res.status(403).json({ message: "You don't have permission to view this lead" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: "Error fetching lead" });
    }
  });
  
  // Lead reassignment endpoint
  app.post("/api/leads/:id/reassign", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const leadId = parseInt(req.params.id);
      const newAssigneeId = parseInt(req.body.assigneeId);
      
      if (isNaN(leadId) || isNaN(newAssigneeId)) {
        return res.status(400).json({ message: "Invalid lead ID or assignee ID" });
      }
      
      // Get the lead first
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to reassign this lead
      // Admin roles can reassign any lead, regular users can only reassign their own leads
      if (user.role === "client_user" && lead.assignedTo !== user.id) {
        return res.status(403).json({ message: "You don't have permission to reassign this lead" });
      }
      
      // Verify the new assignee exists and is active
      const newAssignee = await storage.getUser(newAssigneeId);
      if (!newAssignee || !newAssignee.active) {
        return res.status(400).json({ message: "Invalid assignee: User does not exist or is inactive" });
      }
      
      // Use the reassignLead function from storage
      const updatedLead = await storage.reassignLead(leadId, newAssigneeId, user.id);
      if (!updatedLead) {
        return res.status(500).json({ message: "Failed to reassign lead" });
      }
      
      // Return the updated lead
      res.json(updatedLead);
    } catch (error) {
      console.error('Error reassigning lead:', error);
      res.status(500).json({ message: "Error reassigning lead" });
    }
  });

  // Update lead (and track status changes)
  app.patch("/api/leads/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to update this lead
      // If it's a reassignment request, we have a separate endpoint for that
      if (user.role === "client_user" && lead.assignedTo !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this lead" });
      }
      
      // Store the original status for return value
      const oldStatus = lead.status;
      
      // Update the lead first to ensure it succeeds
      const updatedLead = await storage.updateLead(leadId, req.body);
      if (!updatedLead) {
        return res.status(500).json({ message: "Failed to update lead" });
      }
      
      // If we're updating status, log it as an activity after successful update
      if (req.body.status && req.body.status !== oldStatus) {
        const newStatus = req.body.status;
        
        console.log(`Status change for lead ${leadId}: ${oldStatus} -> ${newStatus}`);
        
        try {
          // Log the status change as an activity
          await storage.createLeadActivity({
            leadId,
            userId: user.id,
            type: "status_change",
            content: `Status changed from ${oldStatus} to ${newStatus}`,
            metadata: {
              oldStatus,
              newStatus,
              timestamp: new Date().toISOString()
            }
          });
        } catch (activityError) {
          console.error('Error creating status change activity:', activityError);
          // Continue anyway since the lead was already updated
        }

        // Check for and execute workflows triggered by status change
        console.log(`WORKFLOW DEBUG: Starting workflow check for status change to "${newStatus}"`);
        try {
          const workflows = await storage.getWorkflows(updatedLead.subAccountId || 1);
          console.log(`WORKFLOW DEBUG: Found ${workflows.length} workflows, checking for status change triggers for "${newStatus}"`);
          
          const statusChangeWorkflows = workflows.filter((workflow: any) => {
            try {
              const trigger = typeof workflow.trigger === 'string' ? JSON.parse(workflow.trigger) : workflow.trigger;
              const isStatusWorkflow = workflow.active && 
                trigger.type === 'lead_status_changed' &&
                trigger.config && 
                trigger.config.status === newStatus;
              
              if (isStatusWorkflow) {
                console.log(`Found matching workflow: "${workflow.name}" for status "${newStatus}"`);
              }
              
              return isStatusWorkflow;
            } catch (parseError) {
              console.error(`Error parsing workflow trigger for workflow ${workflow.id}:`, parseError);
              return false;
            }
          });

          for (const workflow of statusChangeWorkflows) {
            console.log(`Executing workflow "${workflow.name}" for status change to "${newStatus}"`);
            
            try {
              const actions = typeof workflow.actions === 'string' ? JSON.parse(workflow.actions) : workflow.actions;
              
              // Execute each action in the workflow
              for (const action of actions) {
                if (action.type === 'send_whatsapp' || action.type === 'send_whatsapp_template') {
                  try {
                    // Get template name from action config
                    const templateName = action.config.templateName || action.config.templateId || 'enquiry_thanks';
                    console.log(`Sending WhatsApp template "${templateName}" via workflow`);
                    
                    // Send WhatsApp template using internal API request
                    const templateResponse = await fetch(`http://localhost:5000/api/whatsapp/send-template`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        leadId: updatedLead.id,
                        templateName: templateName,
                        subAccountId: updatedLead.subAccountId || 1,
                        userId: user.id
                      })
                    });
                    
                    const result = await templateResponse.json();
                    
                    console.log(`WhatsApp template "${templateName}" sent successfully via workflow:`, result);
                    
                    // Log the workflow execution
                    await storage.createLeadActivity({
                      leadId: updatedLead.id,
                      userId: user.id,
                      type: "whatsapp",
                      content: `Workflow "${workflow.name}" executed: WhatsApp template "${templateName}" sent automatically`,
                      metadata: {
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        actionType: action.type,
                        templateName: templateName,
                        trigger: `status_changed_to_${newStatus}`,
                        automated: true
                      }
                    });
                  } catch (whatsappError: any) {
                    console.error(`Error sending WhatsApp template in workflow:`, whatsappError);
                    
                    // Log the error
                    await storage.createLeadActivity({
                      leadId: updatedLead.id,
                      userId: user.id,
                      type: "other",
                      content: `Workflow "${workflow.name}" failed: Error sending WhatsApp template - ${whatsappError.message || 'Unknown error'}`,
                      metadata: {
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        error: whatsappError.message || 'Unknown error',
                        trigger: `status_changed_to_${newStatus}`
                      }
                    });
                  }
                }
              }
            } catch (actionParseError) {
              console.error(`Error parsing workflow actions for workflow ${workflow.id}:`, actionParseError);
            }
          }
        } catch (workflowError) {
          console.error('Error executing workflows:', workflowError);
          // Continue anyway - don't fail the status update due to workflow errors
        }
      }
      
      // Format response to match client expectations
      res.json({ 
        updatedLead: updatedLead,  // Client expects 'updatedLead' property with status
        oldStatus: oldStatus,      // Client expects 'oldStatus' property
        statusChanged: req.body.status && req.body.status !== oldStatus
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: "Error updating lead" });
    }
  });
  
  // Reassign a lead to another team member
  app.post("/api/leads/:id/reassign", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const leadId = parseInt(req.params.id);
      const { assigneeId } = req.body;
      
      if (isNaN(leadId) || !assigneeId) {
        return res.status(400).json({ message: "Invalid lead ID or assignee ID" });
      }
      
      // Get the lead first
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to reassign this lead
      // Admin roles can reassign any lead, regular users can only reassign their own leads
      const isAdmin = user.role === 'super_admin' || user.role === 'agency_admin' || user.role === 'agency_owner' || user.role === 'client_admin';
      if (!isAdmin && lead.assignedTo !== user.id) {
        return res.status(403).json({ message: "You don't have permission to reassign this lead" });
      }
      
      // Use the reassignLead function from storage
      const updatedLead = await storage.reassignLead(leadId, parseInt(assigneeId.toString()), user.id);
      if (!updatedLead) {
        return res.status(500).json({ message: "Failed to reassign lead" });
      }
      
      // Return the updated lead
      res.json(updatedLead);
    } catch (error) {
      console.error('Error reassigning lead:', error);
      res.status(500).json({ message: "Error reassigning lead" });
    }
  });
  
  // Get lead activities
  app.get("/api/leads/:id/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const activities = await storage.getLeadActivities(leadId);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching lead activities:', error);
      res.status(500).json({ message: "Error fetching lead activities" });
    }
  });
  
  // Add lead activity
  app.post("/api/leads/:id/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const { type, content, metadata } = req.body;
      
      // Create the activity
      const activity = await storage.createLeadActivity({
          leadId,
          userId: user.id,
          type,
          content,
          metadata
      });
      
      // Update the last activity timestamp 
      // Make sure the lastActivity field exists in the schema and can be updated
      try {
        await storage.updateLead(leadId, { 
          updatedAt: new Date() // Use updatedAt as a fallback
        });
      } catch (e) {
        console.log("Could not update lead timestamp:", e);
      }
      
      res.json(activity);
    } catch (error) {
      console.error('Error creating lead activity:', error);
      res.status(500).json({ message: "Error creating lead activity" });
    }
  });
  
  // Get lead sources (for filtering) - moved before the ID-based routes
  app.get("/api/leads/sources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Fixed endpoint - don't parse any ID parameters
      const sources = [
        { id: "Website", name: "Website" },
        { id: "Referral", name: "Referral" },
        { id: "Social Media", name: "Social Media" },
        { id: "Email Campaign", name: "Email Campaign" },
        { id: "LinkedIn", name: "LinkedIn" },
        { id: "Event", name: "Event" },
        { id: "Cold Call", name: "Cold Call" },
        { id: "Other", name: "Other" }
      ];
      
      console.log("Returning lead sources");
      res.json(sources);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      res.status(500).json({ message: "Error fetching lead sources" });
    }
  });
  
  // SubAccount routes
  app.get("/api/subaccounts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // For demo, just return a default subaccount
      const subaccounts = [{
        id: 1,
        name: "Default Account",
        logo: null,
        domain: null,
        colorPrimary: "#4f46e5",
        colorSecondary: "#9333ea"
      }];
      
      res.json(subaccounts);
    } catch (error) {
      console.error('Error fetching subaccounts:', error);
      res.status(500).json({ message: "Error fetching subaccounts" });
    }
  });
  
  // User routes
  app.get("/api/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      
      // Get users from storage based on permissions
      const users = await storage.getUsersBySubAccount(subAccountId);
      
      // Filter users based on role
      let filteredUsers: any[] = [];
      switch(user.role) {
        case "super_admin":
        case "agency_owner":
          // Can see all users
          filteredUsers = users;
          break;
        case "agency_admin":
          // Can see all client admins and users, but not agency owners or super admins
          filteredUsers = users.filter((u: any) => 
            u.role === "client_admin" || u.role === "client_user" || u.id === user.id
          );
          break;
        case "client_admin":
          // Can see client users in their sub-account and themselves
          filteredUsers = users.filter((u: any) => 
            (u.role === "client_user" && u.subAccountId === user.subAccountId) || u.id === user.id
          );
          break;
        case "client_user":
          // Can only see themselves and other client users for chat assignment
          filteredUsers = users.filter((u: any) => 
            (u.role === "client_user" && u.subAccountId === user.subAccountId)
          );
          break;
        default:
          filteredUsers = [];
      }
      
      res.json(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // Tasks Management API endpoints
  app.get("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const subAccountId = parseInt(req.query.subAccountId as string) || (user.subAccountId || 0);
      
      // Optional userId filter
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Optional lead filter
      const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;

      // Optional date range filter using startDate and endDate parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      // Get tasks from storage
      const tasks = await storage.getTasks(subAccountId, userId, leadId, startDate, endDate);
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });
  
  // Get events for the calendar (combines tasks and other calendar events)
  app.get("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const subAccountId = parseInt(req.query.subAccountId as string) || (user.subAccountId || 0);
      
      // Date range for filtering
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : 
        new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Default to first day of current month
      
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : 
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // Default to last day of current month
      
      // Get tasks from storage
      const tasks = await storage.getTasks(subAccountId, undefined, undefined, startDate, endDate);
      
      // Convert tasks to event format
      const events = await Promise.all(tasks.map(async (task) => {
        // If task is related to a lead, get lead info
        let leadName = "";
        
        if (task.leadId) {
          const lead = await storage.getLead(task.leadId);
          if (lead) {
            leadName = lead.name;
          }
        }
        
        // Return task in calendar event format
        return {
          id: task.id,
          title: task.title,
          description: task.description || "",
          startDate: task.dueDate.toISOString(),
          endDate: task.dueDate.toISOString(), // For tasks, start and end date are the same
          type: task.title.toLowerCase().includes('follow') ? 'follow_up' : 'task',
          location: "",
          leadId: task.leadId,
          leadName: leadName,
          createdAt: task.createdAt.toISOString(),
          priority: task.priority,
          completed: task.completed,
          isTask: true // Flag to indicate this is a task
        };
      }));
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });
  
  app.post("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskData = req.body;
      const user = req.user as User;
      
      // Validation
      if (!taskData.title) {
        return res.status(400).json({ message: "Task title is required" });
      }
      
      if (!taskData.dueDate) {
        return res.status(400).json({ message: "Due date is required" });
      }
      
      // Ensure we have a subAccountId
      const subAccountId = taskData.subAccountId || (user.subAccountId || 0);
      
      // Create the task
      const newTask = await storage.createTask({
        title: taskData.title,
        description: taskData.description || null,
        dueDate: new Date(taskData.dueDate),
        subAccountId,
        userId: taskData.userId || user.id,
        createdBy: user.id,
        leadId: taskData.leadId || null,
        priority: taskData.priority || "medium",
        completed: false
      });
      
      // If this is a lead follow-up, also update the lead's last activity
      if (taskData.leadId) {
        // Optionally add a lead activity entry
        await storage.createLeadActivity({
          leadId: taskData.leadId,
          userId: user.id,
          type: "note",
          content: `Follow-up scheduled for ${new Date(taskData.dueDate).toLocaleString()}`
        });
        
        // Update the lead to indicate a follow-up is scheduled
        const lead = await storage.getLead(taskData.leadId);
        if (lead) {
          // Increment follow-up count and update status
          const currentCount = lead.followUpCount || 0;
          console.log(`Updating lead ${taskData.leadId} status to follow_up - current follow-up count: ${currentCount}`);
          
          const updatedLead = await storage.updateLead(taskData.leadId, {
            status: "follow_up", // Change status to follow_up when a follow-up is scheduled
            followUpCount: currentCount + 1, // Increment the follow-up counter
            lastFollowUpDate: new Date(taskData.dueDate) // Track when the follow-up is scheduled for
          });
          
          console.log(`Lead status after update: ${updatedLead?.status}, follow-up count: ${updatedLead?.followUpCount}`);
        }
      }
      
      res.status(201).json({ task: newTask });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Error creating task" });
    }
  });
  
  app.patch("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const taskData = req.body;
      
      // Update the task
      const updatedTask = await storage.updateTask(taskId, {
        ...taskData,
        updatedAt: new Date(),
        ...(taskData.completed ? { completedAt: new Date() } : {})
      });
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json({ task: updatedTask });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Error updating task" });
    }
  });

  // AI Lead Insights API endpoints
  app.get("/api/ai/lead-score/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Get lead activities to provide context for scoring
      const activities = await storage.getLeadActivities(leadId);

      // Generate score based on lead data and activities
      // Import dynamically to work with ES modules
      const openAIService = await import('./openai-service');
      const scoreData = await openAIService.generateLeadScore(lead, activities);

      res.json(scoreData);
    } catch (error: any) {
      console.error("Error generating lead score:", error);
      res.status(500).json({ message: "Error generating lead score", error: error.message });
    }
  });
  
  // New endpoint for AI-powered lead summary
  app.get("/api/ai/lead-summary/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Get lead activities to provide context for summary
      const activities = await storage.getLeadActivities(leadId);

      // Generate summary based on lead data and activities
      // Import dynamically to work with ES modules
      const openAIService = await import('./openai-service');
      const summaryData = await openAIService.generateLeadSummary(lead, activities);

      res.json(summaryData);
    } catch (error: any) {
      console.error("Error generating lead summary:", error);
      res.status(500).json({ 
        summary: "Unable to generate summary at this time.",
        suggestedActions: ["Follow up with the lead to discuss their requirements."]
      });
    }
  });

  app.get("/api/ai/message-suggestions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      const purpose = req.query.purpose as string || "follow-up";

      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Get lead activities to provide context for message generation
      const activities = await storage.getLeadActivities(leadId);

      // Generate message suggestions based on lead data and purpose
      const leadWithActivities = { ...lead, activities };
      const suggestions = await generateMessageSuggestions(leadWithActivities, purpose);

      res.json({ suggestions });
    } catch (error: any) {
      console.error("Error generating message suggestions:", error);
      res.status(500).json({ message: "Error generating message suggestions", error: error.message });
    }
  });

  app.get("/api/ai/follow-up-recommendation/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Get lead activities to provide context for follow-up recommendation
      const activities = await storage.getLeadActivities(leadId);

      // Generate follow-up recommendation based on lead data and activities
      const leadWithActivities = { ...lead, activities };
      const recommendation = await generateFollowUpRecommendation(leadWithActivities);

      res.json(recommendation);
    } catch (error: any) {
      console.error("Error generating follow-up recommendation:", error);
      res.status(500).json({ message: "Error generating follow-up recommendation", error: error.message });
    }
  });

  // Integration API routes
  app.use('/api/integrations', isAuthenticated, integrationRouter);
  
  // Notification API routes
  app.use('/api/notifications', isAuthenticated, notificationRouter);
  
  // Register Settings and Team routes
  registerSettingsRoutes(app);
  registerTeamRoutes(app);
  
  // Lead Sources API - moved here for proper authentication
  app.get("/api/lead-sources", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      
      // Return predefined lead sources for now
      const leadSources = [
        "Website", "Social Media", "Email Campaign", "Phone Call", 
        "Referral", "Advertisement", "Event", "Other"
      ];
      
      res.json(leadSources);
    } catch (error: any) {
      console.error("Error fetching lead sources:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lead-sources", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = req.user as any;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Source name is required" });
      }
      
      console.log(`Adding new lead source: "${name}" for user: ${user.username}`);
      
      res.status(201).json({ 
        success: true, 
        message: `Lead source "${name}" added successfully`,
        source: name.trim()
      });
    } catch (error: any) {
      console.error("Error adding lead source:", error);
      res.status(500).json({ message: error.message });
    }
  });
  

  
  // Templates API endpoint
  app.get("/api/templates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const subAccountId = parseInt(req.query.subAccountId as string) || user.subAccountId || 1;
      const type = req.query.type as string;
      
      console.log(`Templates API called with subAccountId: ${subAccountId}, type: ${type}`);
      
      // Get templates from storage
      const templates = await storage.getTemplates(subAccountId, type);
      
      console.log(`Templates API returning ${templates.length} templates:`, templates.map(t => ({ name: t.name, type: t.type })));
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: "Error fetching templates" });
    }
  });

  // Register WhatsApp routes
  app.use('/api/whatsapp', whatsappRouter);
  
  // Simple bulk add leads endpoint
  app.post("/api/leads/bulk-add", async (req, res) => {
    try {
      const { leads } = req.body;
      
      let imported = 0;
      let duplicates = 0;
      
      for (const leadData of leads) {
        // Check for duplicates by email
        const existingLead = leadData.email ? 
          await storage.getLeadsBySubAccount(1, {}).then(leads => 
            leads.find(l => l.email && l.email.toLowerCase() === leadData.email.toLowerCase())
          ) : null;
        
        if (existingLead) {
          duplicates++;
        } else {
          await storage.createLead({
            ...leadData,
            subAccountId: 1,
            status: "new" as const
          });
          imported++;
        }
      }
      
      res.json({
        total: leads.length,
        imported: imported,
        duplicates: duplicates,
        errors: 0,
        errorDetails: []
      });
      
    } catch (error: any) {
      console.error("Bulk add error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test file upload endpoint
  app.post("/api/test-upload", isAuthenticated, upload.single('csvFile'), (req, res) => {
    console.log('Test upload received');
    console.log('File present:', !!req.file);
    console.log('Body:', req.body);
    if (req.file) {
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    res.json({ 
      fileReceived: !!req.file,
      fileName: req.file?.originalname || 'No file',
      fileSize: req.file?.size || 0
    });
  });

  // Backend CSV bulk import with duplicate detection
  app.post("/api/leads/bulk-import", isAuthenticated, async (req, res) => {
    try {
      const { leads } = req.body;
      
      if (!leads || !Array.isArray(leads)) {
        return res.status(400).json({ error: "Invalid leads data" });
      }

      let imported = 0;
      let duplicates = 0;
      let errors = 0;
      const errorDetails = [];

      // Get existing leads to check for duplicates
      const existingLeads = await storage.getLeadsBySubAccount(req.user!.subAccountId || 1, {});
      const existingEmails = new Set(existingLeads.filter((l: any) => l.email).map((l: any) => l.email.toLowerCase()));
      const existingPhones = new Set(existingLeads.map((l: any) => l.phone?.replace(/\D/g, '')).filter(Boolean));

      for (const leadData of leads) {
        try {
          // Check for duplicates
          const emailExists = leadData.email && existingEmails.has(leadData.email.toLowerCase());
          const phoneExists = leadData.phone && existingPhones.has(leadData.phone.replace(/\D/g, ''));
          
          if (emailExists || phoneExists) {
            duplicates++;
            continue;
          }

          // Create the lead
          const newLead = await storage.createLead({
            name: leadData.name,
            email: leadData.email || null,
            phone: leadData.phone,
            position: leadData.position || null,
            source: leadData.source || 'csv_import',
            status: 'new',
            assignedTo: req.user!.id,
            subAccountId: req.user!.subAccountId || 1,
            value: 0,
            customFields: {}
          });

          // Add to existing sets to prevent duplicates within the same import
          if (leadData.email) existingEmails.add(leadData.email.toLowerCase());
          if (leadData.phone) existingPhones.add(leadData.phone.replace(/\D/g, ''));
          
          imported++;
        } catch (error: any) {
          errors++;
          errorDetails.push(error.message);
        }
      }

      res.json({
        total: leads.length,
        imported,
        duplicates,
        errors,
        errorDetails: errorDetails.slice(0, 10)
      });
    } catch (error: any) {
      console.error("Bulk import error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow API endpoints
  
  // Get workflows
  app.get("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      const { subAccountId } = req.query;
      if (!subAccountId) {
        return res.status(400).json({ error: "subAccountId is required" });
      }

      const workflows = await storage.getWorkflows(parseInt(subAccountId as string));
      res.json(workflows);
    } catch (error: any) {
      console.error("Get workflows error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create workflow
  app.post("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.createWorkflow({
        ...req.body,
        createdBy: req.user!.id
      });
      res.json(workflow);
    } catch (error: any) {
      console.error("Create workflow error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update workflow
  app.patch("/api/workflows/:id", isAuthenticated, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.updateWorkflow(workflowId, req.body);
      res.json(workflow);
    } catch (error: any) {
      console.error("Update workflow error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete workflow
  app.delete("/api/workflows/:id", isAuthenticated, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      await storage.deleteWorkflow(workflowId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete workflow error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get workflow executions
  app.get("/api/workflow-executions", isAuthenticated, async (req, res) => {
    try {
      const { subAccountId } = req.query;
      if (!subAccountId) {
        return res.status(400).json({ error: "subAccountId is required" });
      }

      const executions = await storage.getWorkflowExecutions(parseInt(subAccountId as string));
      res.json(executions);
    } catch (error: any) {
      console.error("Get workflow executions error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}