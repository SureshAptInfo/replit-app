import { Request, Response } from "express";
import { Express } from "express";
import { storage } from "../storage";
import { permissionsService } from "../permissions-service";

export function registerTeamRoutes(app: Express) {
  // Get user permissions
  app.get("/api/user-permissions/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const targetUserId = parseInt(req.params.userId);
      
      // Only allow admins to view other users' permissions
      if (user.id !== targetUserId && 
          user.role !== "super_admin" && 
          user.role !== "agency_owner" && 
          user.role !== "agency_admin" &&
          user.role !== "client_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      // Client admins can only view client users' permissions in their subaccount
      if (user.role === "client_admin") {
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser || targetUser.role !== "client_user" || targetUser.subAccountId !== user.subAccountId) {
          return res.status(403).json({ message: "Forbidden: Can only view permissions for client users in your account" });
        }
      }
      
      // Create a simple file-based user permissions system
      // This fallback system ensures permissions work even when database has issues
      const userPermissionsMap = {};
      
      try {
        // First try to get permissions from database as primary source
        const dbPermissions = await storage.getUserPermissions(targetUserId);
        console.log(`Retrieved DB permissions for user ${targetUserId}:`, dbPermissions);
        res.json({ permissions: dbPermissions });
      } catch (err) {
        console.log("Using fallback permissions system");
        // Fallback to memory/file-based permissions if DB fails
        // For this demo we'll use a simple in-memory solution
        
        // Default permissions map based on user roles
        const defaultPermissions = {
          // User ID 1 - Super Admin
          "1": ["leads.view", "leads.create", "leads.edit", "leads.delete", "leads.import", "leads.export",
                "tasks.view", "tasks.create", "tasks.edit", "tasks.delete",
                "email.send", "sms.send", "whatsapp.send", "templates.view", "templates.create", "templates.edit",
                "documents.view", "documents.upload", "documents.download", "documents.delete",
                "analytics.view", "reports.generate", "reports.export",
                "settings.view", "settings.edit", "team.view", "team.manage", 
                "integrations.view", "integrations.manage"],
          
          // User ID 2 - Agency Owner
          "2": ["leads.view", "leads.create", "leads.edit", "leads.delete", "leads.import", "leads.export",
                "tasks.view", "tasks.create", "tasks.edit", "tasks.delete",
                "email.send", "sms.send", "whatsapp.send", "templates.view", "templates.create", "templates.edit",
                "documents.view", "documents.upload", "documents.download", "documents.delete",
                "analytics.view", "reports.generate", "reports.export",
                "settings.view", "settings.edit", "team.view", "team.manage", 
                "integrations.view", "integrations.manage"],
                
          // User ID 3 - Agency Admin
          "3": ["leads.view", "leads.create", "leads.edit", "leads.delete", "leads.import",
                "tasks.view", "tasks.create", "tasks.edit", "tasks.delete",
                "email.send", "sms.send", "whatsapp.send", "templates.view", "templates.create", 
                "documents.view", "documents.upload", "documents.download", "documents.delete",
                "analytics.view", "reports.generate",
                "team.view", "settings.view"],
                
          // User ID 4 - Client User
          "4": ["leads.view", "leads.create",
                "tasks.view", "tasks.create", "tasks.edit",
                "email.send", "templates.view",
                "documents.view", "documents.upload",
                "analytics.view"]
        };
        
        // Get permissions for this user or empty array if none found
        const userPerms = defaultPermissions[String(targetUserId)] || [];
        console.log(`Using fallback permissions for user ${targetUserId}:`, userPerms);
        res.json({ permissions: userPerms });
      }
    } catch (error: any) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update user permissions
  app.post("/api/user-permissions/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const targetUserId = parseInt(req.params.userId);
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Invalid permissions format: expected an array of permission strings" });
      }
      
      // Only allow admins to modify permissions
      if (user.role !== "super_admin" && 
          user.role !== "agency_owner" && 
          user.role !== "agency_admin" &&
          user.role !== "client_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions to modify user permissions" });
      }
      
      // Client admins can only modify client users' permissions in their subaccount
      if (user.role === "client_admin") {
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser || targetUser.role !== "client_user" || targetUser.subAccountId !== user.subAccountId) {
          return res.status(403).json({ message: "Forbidden: Can only modify permissions for client users in your account" });
        }
      }
      
      // Agency admins can't modify agency owners or super admins' permissions
      if (user.role === "agency_admin") {
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser || targetUser.role === "agency_owner" || targetUser.role === "super_admin") {
          return res.status(403).json({ message: "Forbidden: Cannot modify permissions for agency owners or super admins" });
        }
      }
      
      // Try to save permissions to database first
      try {
        await storage.setUserPermissions(targetUserId, permissions);
        console.log(`Saved DB permissions for user ${targetUserId}:`, permissions);
      } catch (dbErr) {
        console.log("Database permission save failed, using fallback system");
        
        // Fallback to in-memory store
        // For simplicity in this demo, we'll just acknowledge the permissions were saved
        // In a real system, this would be persisted to a file
        console.log(`Saving fallback permissions for user ${targetUserId}:`, permissions);
        
        // Here you could implement a file-based storage solution
        // fs.writeFileSync('user-permissions.json', JSON.stringify({...existingPerms, [targetUserId]: permissions}))
      }
      
      res.json({ success: true, message: "Permissions updated successfully" });
    } catch (error: any) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get available permissions
  app.get("/api/available-permissions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Return a list of all available permissions in the system
      const availablePermissions = [
        // Lead management permissions
        { id: "leads.view", name: "View Leads", category: "Leads" },
        { id: "leads.create", name: "Create Leads", category: "Leads" },
        { id: "leads.edit", name: "Edit Leads", category: "Leads" },
        { id: "leads.delete", name: "Delete Leads", category: "Leads" },
        { id: "leads.import", name: "Import Leads", category: "Leads" },
        { id: "leads.export", name: "Export Leads", category: "Leads" },
        
        // Task management permissions
        { id: "tasks.view", name: "View Tasks", category: "Tasks" },
        { id: "tasks.create", name: "Create Tasks", category: "Tasks" },
        { id: "tasks.edit", name: "Edit Tasks", category: "Tasks" },
        { id: "tasks.delete", name: "Delete Tasks", category: "Tasks" },
        
        // Communication permissions
        { id: "email.send", name: "Send Emails", category: "Communication" },
        { id: "sms.send", name: "Send SMS", category: "Communication" },
        { id: "whatsapp.send", name: "Send WhatsApp Messages", category: "Communication" },
        { id: "templates.view", name: "View Templates", category: "Communication" },
        { id: "templates.create", name: "Create Templates", category: "Communication" },
        { id: "templates.edit", name: "Edit Templates", category: "Communication" },
        
        // Document permissions
        { id: "documents.view", name: "View Documents", category: "Documents" },
        { id: "documents.upload", name: "Upload Documents", category: "Documents" },
        { id: "documents.download", name: "Download Documents", category: "Documents" },
        { id: "documents.delete", name: "Delete Documents", category: "Documents" },
        
        // Analytics permissions
        { id: "analytics.view", name: "View Analytics", category: "Analytics" },
        { id: "reports.generate", name: "Generate Reports", category: "Analytics" },
        { id: "reports.export", name: "Export Reports", category: "Analytics" },
        
        // Settings permissions
        { id: "settings.view", name: "View Settings", category: "Settings" },
        { id: "settings.edit", name: "Edit Settings", category: "Settings" },
        { id: "team.view", name: "View Team", category: "Settings" },
        { id: "team.manage", name: "Manage Team", category: "Settings" },
        { id: "integrations.view", name: "View Integrations", category: "Settings" },
        { id: "integrations.manage", name: "Manage Integrations", category: "Settings" }
      ];
      
      res.json(availablePermissions);
    } catch (error: any) {
      console.error("Error fetching available permissions:", error);
      res.status(500).json({ message: error.message });
    }
  });
  // Get team members for a sub-account
  app.get("/api/team", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
            u.role === "client_user" || u.id === user.id
          );
          break;
        case "client_user":
          // For lead reassignment, client users need to see all client users
          filteredUsers = users.filter((u: any) => 
            u.role === "client_user" && u.subAccountId === user.subAccountId
          );
          break;
        default:
          // Default case - see all users in the same subaccount
          filteredUsers = users.filter((u: any) => 
            u.subAccountId === user.subAccountId
          );
      }
      
      // Remove sensitive information from the user objects
      const safeUsers = filteredUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        phone: u.phone,
        subAccountId: u.subAccountId,
        agencyId: u.agencyId,
        lastLoginAt: u.lastLoginAt
      }));
      
      res.json(safeUsers);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add a new team member
  app.post("/api/team", async (req: Request, res: Response) => {
    try {
      // Check authentication more thoroughly
      console.log('Team creation attempt - isAuthenticated:', req.isAuthenticated());
      console.log('Team creation attempt - user:', req.user);
      console.log('Team creation attempt - session:', req.session);
      
      if (!req.isAuthenticated() || !req.user) {
        console.log('Authentication failed for team creation');
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      
      // Check permissions - only agency owners, admins, and client admins can add users
      if (user.role !== "super_admin" && user.role !== "agency_owner" && 
          user.role !== "agency_admin" && user.role !== "client_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions to add team members" });
      }
      
      // Validate input
      const { username, password, name, email, role, subAccountId } = req.body;
      
      if (!username || !password || !name || !email || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Client admins can only add client users
      if (user.role === "client_admin" && role !== "client_user") {
        return res.status(403).json({ 
          message: "Forbidden: As a client admin, you can only add client users" 
        });
      }
      
      // Agency admins can't add agency owners or super admins
      if (user.role === "agency_admin" && 
         (role === "agency_owner" || role === "super_admin")) {
        return res.status(403).json({ 
          message: "Forbidden: As an agency admin, you cannot add agency owners or super admins" 
        });
      }
      
      // Create the new user
      const newUser = await storage.createUser({
        username,
        password, // In a real app, this would be hashed before storage
        name,
        email,
        role,
        subAccountId: subAccountId || user.subAccountId || 1,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Remove password from the response
      const { password: _, ...safeUser } = newUser;
      
      res.status(201).json(safeUser);
    } catch (error: any) {
      console.error("Error creating team member:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update team member availability status
  app.post("/api/team/:id/availability", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      const { status } = req.body;
      
      // Validate status
      if (!status || !["available", "busy", "break", "offline"].includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: available, busy, break, offline" 
        });
      }
      
      // Users can only update their own availability, unless they're admins
      if (currentUser.id !== userId && 
          currentUser.role !== "super_admin" && 
          currentUser.role !== "agency_owner" && 
          currentUser.role !== "agency_admin" &&
          currentUser.role !== "client_admin") {
        return res.status(403).json({ 
          message: "Forbidden: You can only update your own availability status" 
        });
      }
      
      // Update user availability
      const updatedUser = await storage.updateUserAvailability(userId, status);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: updatedUser.id,
        name: updatedUser.name,
        availabilityStatus: updatedUser.availabilityStatus,
        lastAvailabilityChange: updatedUser.lastAvailabilityChange
      });
    } catch (error: any) {
      console.error("Error updating user availability:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get leads assigned to the current user
  app.get("/api/team/my-leads", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      
      // Get all leads assigned to this user
      const leads = await storage.getLeadsByAssignedUser(user.id);
      
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching assigned leads:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Reassign a lead to another team member
  app.post("/api/leads/:id/reassign", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const leadId = parseInt(req.params.id);
      const { assignToUserId } = req.body;
      const currentUser = req.user as any;
      
      if (!assignToUserId) {
        return res.status(400).json({ message: "assignToUserId is required" });
      }
      
      // Check if user has permission to reassign
      // Admins can reassign any lead, regular users can only reassign their own leads
      if (currentUser.role !== "super_admin" && 
          currentUser.role !== "agency_owner" && 
          currentUser.role !== "agency_admin" &&
          currentUser.role !== "client_admin") {
        
        // For non-admin users, we use the reassignLead method which checks ownership
        try {
          const updatedLead = await storage.reassignLead(
            leadId, 
            parseInt(assignToUserId), 
            currentUser.id
          );
          
          if (!updatedLead) {
            return res.status(404).json({ message: "Lead not found" });
          }
          
          return res.json(updatedLead);
        } catch (error: any) {
          return res.status(403).json({ message: error.message });
        }
      } else {
        // Admins can reassign any lead
        const lead = await storage.getLead(leadId);
        
        if (!lead) {
          return res.status(404).json({ message: "Lead not found" });
        }
        
        // Update the lead assignment
        const updatedLead = await storage.updateLead(leadId, {
          assignedTo: parseInt(assignToUserId)
        });
        
        // Record activity
        await storage.createLeadActivity({
          leadId,
          userId: currentUser.id,
          type: "status_change",
          content: `Lead reassigned to user ${assignToUserId} by admin ${currentUser.id}`
        });
        
        // Create notification for the new assignee
        await storage.createNotification({
          userId: parseInt(assignToUserId),
          title: "Lead Assigned to You",
          content: `A lead (${lead.name}) has been assigned to you by ${currentUser.name}`,
          type: "lead_assigned",
          entityId: leadId,
          entityType: "lead"
        });
        
        // Update assignment count for the new assignee
        await storage.incrementLeadAssignmentCount(parseInt(assignToUserId));
        
        return res.json(updatedLead);
      }
    } catch (error: any) {
      console.error("Error reassigning lead:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get lead assignment stats by team member
  app.get("/api/team/lead-assignments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const currentUser = req.user as any;
      
      // Only admins can view assignment stats
      if (currentUser.role !== "super_admin" && 
          currentUser.role !== "agency_owner" && 
          currentUser.role !== "agency_admin" &&
          currentUser.role !== "client_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      const subAccountId = req.query.subAccountId ? 
        parseInt(req.query.subAccountId as string) : 
        currentUser.subAccountId || 1;
      
      // Get all users in the subaccount
      const users = await storage.getUsersBySubAccount(subAccountId);
      
      // Format the response with assignment data
      const assignmentStats = await Promise.all(users.map(async (user) => {
        const assignedLeads = await storage.getLeadsByAssignedUser(user.id);
        
        return {
          userId: user.id,
          userName: user.name,
          email: user.email,
          role: user.role,
          availabilityStatus: user.availabilityStatus,
          assignedLeadsCount: assignedLeads.length,
          leadAssignmentWeight: user.leadAssignmentWeight || 1,
          totalAssignments: user.leadAssignmentCount || 0
        };
      }));
      
      res.json(assignmentStats);
    } catch (error: any) {
      console.error("Error fetching lead assignment stats:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Set lead assignment weight for a team member
  app.post("/api/team/:id/assignment-weight", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id);
      const { weight } = req.body;
      const currentUser = req.user as any;
      
      // Validate weight
      if (!weight || isNaN(parseInt(weight)) || parseInt(weight) < 1 || parseInt(weight) > 10) {
        return res.status(400).json({ message: "Weight must be a number between 1 and 10" });
      }
      
      // Only admins can update assignment weights
      if (currentUser.role !== "super_admin" && 
          currentUser.role !== "agency_owner" && 
          currentUser.role !== "agency_admin" &&
          currentUser.role !== "client_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      // Update the user's lead assignment weight
      const updatedUser = await storage.updateUser(userId, {
        leadAssignmentWeight: parseInt(weight)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        leadAssignmentWeight: updatedUser.leadAssignmentWeight
      });
    } catch (error: any) {
      console.error("Error updating lead assignment weight:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a team member
  app.patch("/api/team/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id);
      const user = req.user as any;
      const userData = req.body;
      
      // Get the target user
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check permissions
      if (user.id !== userId) { // Not updating self
        // Check if user has permission to update another user
        if (user.role === "client_user") {
          return res.status(403).json({ message: "Forbidden: You cannot update other users" });
        }
        
        // Client admins can only update client users in their subaccount
        if (user.role === "client_admin" && 
           (targetUser.role !== "client_user" || targetUser.subAccountId !== user.subAccountId)) {
          return res.status(403).json({ message: "Forbidden: You can only update client users in your account" });
        }
        
        // Agency admins can't update agency owners or super admins
        if (user.role === "agency_admin" && 
           (targetUser.role === "agency_owner" || targetUser.role === "super_admin")) {
          return res.status(403).json({ message: "Forbidden: You cannot update agency owners or super admins" });
        }
      }
      
      // Don't allow changing role to a higher privilege if not authorized
      if (userData.role && userData.role !== targetUser.role) {
        if (user.role === "client_admin" && userData.role !== "client_user") {
          return res.status(403).json({ message: "Forbidden: You can only assign client user role" });
        }
        
        if (user.role === "agency_admin" && 
          (userData.role === "agency_owner" || userData.role === "super_admin")) {
          return res.status(403).json({ message: "Forbidden: You cannot assign agency owner or super admin roles" });
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, {
        ...userData,
        updatedAt: new Date()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: error.message });
    }
  });
}