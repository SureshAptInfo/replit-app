import { db } from './db';
import { eq, and, desc, or, isNull, sql } from 'drizzle-orm';
import { IStorage } from './storage';
import * as schema from '@shared/schema';
import { 
  users, leads, agencies, subAccounts, leadActivities, 
  messageTemplates, tasks, integrations, emailTemplates,
  documents, systemConfig, notifications, userPermissions,
  workflows, workflowExecutions, workflowActionLogs
} from '@shared/schema';

/**
 * PostgreSQL implementation of the storage interface
 */
export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<schema.User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results[0];
  }

  async createUser(userData: schema.InsertUser): Promise<schema.User> {
    const results = await db.insert(users).values(userData).returning();
    return results[0];
  }

  async getUsersBySubAccount(subAccountId: number): Promise<schema.User[]> {
    return await db.select().from(users).where(eq(users.subAccountId, subAccountId));
  }

  async updateUser(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined> {
    const results = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<schema.User | undefined> {
    const results = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<schema.User | undefined> {
    const results = await db
      .update(users)
      .set({
        stripeCustomerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }
  
  // Agency management
  async getAgency(id: number): Promise<schema.Agency | undefined> {
    const results = await db.select().from(agencies).where(eq(agencies.id, id)).limit(1);
    return results[0];
  }

  async createAgency(agencyData: schema.InsertAgency): Promise<schema.Agency> {
    const results = await db.insert(agencies).values(agencyData).returning();
    return results[0];
  }

  async getAgencyByOwner(ownerId: number): Promise<schema.Agency | undefined> {
    const results = await db.select().from(agencies).where(eq(agencies.ownerId, ownerId)).limit(1);
    return results[0];
  }
  
  async updateAgency(id: number, agencyData: Partial<schema.InsertAgency>): Promise<schema.Agency | undefined> {
    const results = await db
      .update(agencies)
      .set({
        ...agencyData,
        updatedAt: new Date()
      })
      .where(eq(agencies.id, id))
      .returning();
    return results[0];
  }
  
  // SubAccount management
  async getSubAccount(id: number): Promise<schema.SubAccount | undefined> {
    const results = await db.select().from(subAccounts).where(eq(subAccounts.id, id)).limit(1);
    return results[0];
  }

  async getSubAccountsByAgency(agencyId: number): Promise<schema.SubAccount[]> {
    return await db.select().from(subAccounts).where(eq(subAccounts.agencyId, agencyId));
  }

  async createSubAccount(subAccountData: schema.InsertSubAccount): Promise<schema.SubAccount> {
    const results = await db.insert(subAccounts).values(subAccountData).returning();
    return results[0];
  }

  async updateSubAccount(id: number, subAccountData: Partial<schema.InsertSubAccount>): Promise<schema.SubAccount | undefined> {
    const results = await db
      .update(subAccounts)
      .set({
        ...subAccountData,
        updatedAt: new Date()
      })
      .where(eq(subAccounts.id, id))
      .returning();
    return results[0];
  }
  
  // Lead management
  async getLead(id: number): Promise<schema.Lead | undefined> {
    const results = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return results[0];
  }

  async getLeadsBySubAccount(subAccountId: number, filters?: { status?: string, source?: string }): Promise<schema.Lead[]> {
    let query = db.select().from(leads).where(eq(leads.subAccountId, subAccountId));
    
    if (filters) {
      if (filters.status) {
        query = query.where(eq(leads.status, filters.status as any));
      }
      if (filters.source) {
        query = query.where(eq(leads.source, filters.source));
      }
    }
    
    return await query.orderBy(desc(leads.createdAt));
  }

  async createLead(leadData: schema.InsertLead): Promise<schema.Lead> {
    const now = new Date();
    
    // Check if we need to assign a team member using round-robin (if not already assigned)
    if (!leadData.assignedTo) {
      try {
        const assignedUserId = await this.getNextUserForLeadAssignment(leadData.subAccountId);
        if (assignedUserId) {
          leadData.assignedTo = assignedUserId;
        }
      } catch (error) {
        console.error("Error assigning lead:", error);
        // Continue without assignment if there's an error
      }
    }
    
    const results = await db
      .insert(leads)
      .values({
        ...leadData,
        updatedAt: now,
        lastActivity: now
      })
      .returning();
      
    const lead = results[0];
    
    // Increment the assignment count for the user and create notification
    if (lead.assignedTo) {
      try {
        await this.incrementLeadAssignmentCount(lead.assignedTo);
        
        // Create a notification for the assigned user
        await this.createNotification({
          userId: lead.assignedTo,
          title: "New Lead Assigned",
          content: `You have been assigned a new lead: ${lead.name}`,
          type: "lead_assigned",
          entityId: lead.id,
          entityType: "lead"
        });
      } catch (error) {
        console.error("Error updating assignment count or creating notification:", error);
        // Continue even if notification fails
      }
    }
    
    return lead;
  }

  async updateLead(id: number, leadData: Partial<schema.InsertLead>): Promise<schema.Lead | undefined> {
    const results = await db
      .update(leads)
      .set({
        ...leadData,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    return results[0];
  }

  async getLeadCounts(subAccountId: number): Promise<Record<string, number>> {
    // Get counts for each status
    const statusCounts = await db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(eq(leads.subAccountId, subAccountId))
      .groupBy(leads.status);

    // Create a record with all expected status tabs with counts set to 0 initially
    const counts: Record<string, number> = {
      all: 0,
      unread: 0,
      contacted: 0,
      rnr: 0,
      follow_up: 0,
      interested: 0,
      converted: 0,
      lost: 0
    };

    // Get total count for the "all" tab
    const [totalResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(eq(leads.subAccountId, subAccountId));

    counts.all = totalResult.count;
    
    // Fill in counts for specific statuses
    statusCounts.forEach(row => {
      // Only update if the status is one that we're tracking in the UI
      if (row.status in counts) {
        counts[row.status] = row.count;
      }
    });
    
    return counts;
  }
  
  // Lead Activity
  async getLeadActivities(leadId: number): Promise<schema.LeadActivity[]> {
    return await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async createLeadActivity(activityData: schema.InsertLeadActivity): Promise<schema.LeadActivity> {
    const results = await db.insert(leadActivities).values(activityData).returning();
    
    // Update the lead's lastActivity timestamp
    await db
      .update(leads)
      .set({ lastActivity: new Date() })
      .where(eq(leads.id, activityData.leadId));
      
    return results[0];
  }
  
  // Email Templates
  async getEmailTemplates(subAccountId: number, category?: string): Promise<schema.EmailTemplate[]> {
    let query = db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.subAccountId, subAccountId));
      
    if (category) {
      query = query.where(eq(emailTemplates.category, category as any));
    }
    
    return await query.orderBy(emailTemplates.name);
  }

  async createEmailTemplate(templateData: schema.InsertEmailTemplate): Promise<schema.EmailTemplate> {
    const results = await db.insert(emailTemplates).values(templateData).returning();
    return results[0];
  }
  
  // Message Templates (SMS, WhatsApp)
  async getMessageTemplates(subAccountId: number, type?: string): Promise<schema.MessageTemplate[]> {
    let query = db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.subAccountId, subAccountId));
      
    if (type) {
      query = query.where(eq(messageTemplates.type, type as any));
    }
    
    return await query.orderBy(messageTemplates.name);
  }

  async createMessageTemplate(templateData: schema.InsertMessageTemplate): Promise<schema.MessageTemplate> {
    const results = await db.insert(messageTemplates).values(templateData).returning();
    return results[0];
  }

  async updateMessageTemplate(id: number, templateData: Partial<schema.InsertMessageTemplate>): Promise<schema.MessageTemplate | undefined> {
    const results = await db
      .update(messageTemplates)
      .set({
        ...templateData,
        updatedAt: new Date()
      })
      .where(eq(messageTemplates.id, id))
      .returning();
    return results[0];
  }

  async getTemplates(subAccountId: number, type?: string): Promise<any[]> {
    try {
      console.log(`Getting templates for subAccountId: ${subAccountId}, type: ${type}`);
      
      // Fetch templates stored in message_templates table
      const allTemplates = await db
        .select()
        .from(messageTemplates)
        .where(eq(messageTemplates.subAccountId, subAccountId));

      console.log(`Found ${allTemplates.length} total templates in database:`, allTemplates.map(t => ({ name: t.name, type: t.type, id: t.id })));

      // Filter by type if specified
      if (type === 'whatsapp') {
        const filtered = allTemplates.filter(template => 
          template.type === 'whatsapp'
        );
        console.log(`Filtered WhatsApp templates: ${filtered.length}`, filtered.map(t => ({ name: t.name, type: t.type })));
        return filtered;
      }

      // Return all templates if no type filter
      return allTemplates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }
  
  // Tasks
  async getTasks(subAccountId: number, userId?: number): Promise<schema.Task[]> {
    let query = db
      .select()
      .from(tasks)
      .where(eq(tasks.subAccountId, subAccountId));
      
    if (userId) {
      query = query.where(eq(tasks.userId, userId));
    }
    
    return await query.orderBy(tasks.dueDate);
  }

  async getTasksByLead(leadId: number): Promise<schema.Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.leadId, leadId))
      .orderBy(tasks.dueDate);
  }

  async createTask(taskData: schema.InsertTask): Promise<schema.Task> {
    const results = await db.insert(tasks).values(taskData).returning();
    return results[0];
  }

  async updateTask(id: number, taskData: Partial<schema.InsertTask>): Promise<schema.Task | undefined> {
    // If task is being marked as completed, set completedAt
    let updateData = { ...taskData };
    if (taskData.completed === true) {
      updateData = {
        ...updateData,
        completedAt: new Date()
      };
    }
    
    const results = await db
      .update(tasks)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return results[0];
  }
  
  // Documents
  async getDocumentsByLead(leadId: number): Promise<schema.Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.leadId, leadId))
      .orderBy(desc(documents.createdAt));
  }
  
  async getDocumentsBySubAccount(subAccountId: number, type?: string): Promise<schema.Document[]> {
    let query = db
      .select()
      .from(documents)
      .where(eq(documents.subAccountId, subAccountId));
      
    if (type) {
      query = query.where(eq(documents.type, type as any));
    }
    
    return await query.orderBy(desc(documents.createdAt));
  }
  
  async createDocument(documentData: schema.InsertDocument): Promise<schema.Document> {
    const results = await db.insert(documents).values(documentData).returning();
    return results[0];
  }
  
  // Integrations
  async getIntegrations(subAccountId: number): Promise<schema.Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(
        or(
          eq(integrations.subAccountId, subAccountId),
          isNull(integrations.subAccountId) // Also return system-wide integrations
        )
      );
  }

  async getIntegration(id: number): Promise<schema.Integration | undefined> {
    const results = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
    return results[0];
  }
  
  async getIntegrationByType(type: string, subAccountId?: number): Promise<schema.Integration | undefined> {
    let query = db
      .select()
      .from(integrations)
      .where(eq(integrations.type, type as any))
      .where(eq(integrations.active, true));
      
    if (subAccountId) {
      // Look for subaccount-specific integration first
      query = query.where(eq(integrations.subAccountId, subAccountId));
    } else {
      // Look for system-wide integration
      query = query.where(isNull(integrations.subAccountId));
    }
    
    const results = await query.limit(1);
    return results[0];
  }

  async createIntegration(integrationData: schema.InsertIntegration): Promise<schema.Integration> {
    const results = await db.insert(integrations).values(integrationData).returning();
    return results[0];
  }

  async updateIntegration(id: number, integrationData: Partial<schema.InsertIntegration>): Promise<schema.Integration | undefined> {
    const results = await db
      .update(integrations)
      .set({
        ...integrationData,
        updatedAt: new Date()
      })
      .where(eq(integrations.id, id))
      .returning();
    return results[0];
  }
  
  // System Configuration
  async getSystemConfig(key: string): Promise<schema.SystemConfig | undefined> {
    const results = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key))
      .limit(1);
    return results[0];
  }
  
  async getSystemConfigByCategory(category: string): Promise<schema.SystemConfig[]> {
    return await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.category, category as any));
  }
  
  async setSystemConfig(configData: schema.InsertSystemConfig): Promise<schema.SystemConfig> {
    // Check if key already exists
    const existing = await this.getSystemConfig(configData.key);
    
    if (existing) {
      // Update existing config
      const results = await db
        .update(systemConfig)
        .set({
          value: configData.value,
          updatedAt: new Date(),
          updatedBy: configData.updatedBy
        })
        .where(eq(systemConfig.id, existing.id))
        .returning();
      return results[0];
    } else {
      // Create new config
      const results = await db.insert(systemConfig).values(configData).returning();
      return results[0];
    }
  }
  
  // Notifications
  async getNotifications(userId: number, limit: number = 20): Promise<schema.Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
  
  async createNotification(notificationData: schema.InsertNotification): Promise<schema.Notification> {
    const results = await db.insert(notifications).values(notificationData).returning();
    return results[0];
  }
  
  async markNotificationAsRead(id: number): Promise<schema.Notification | undefined> {
    const results = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return results[0];
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
  }

  // User Permissions
  async getUserPermissions(userId: number): Promise<string[]> {
    const permissions = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
    
    return permissions.map(p => p.permissionId);
  }
  
  async setUserPermissions(userId: number, permissions: string[]): Promise<void> {
    // First, remove all existing permissions for this user
    await db
      .delete(userPermissions)
      .where(eq(userPermissions.userId, userId));
    
    // Then add the new permissions
    if (permissions.length > 0) {
      await db
        .insert(userPermissions)
        .values(
          permissions.map(permissionId => ({
            userId,
            permissionId,
          }))
        );
    }
  }
  
  // Team lead assignment methods
  
  /**
   * Gets the next user for lead assignment using round-robin algorithm
   */
  async getNextUserForLeadAssignment(subAccountId: number): Promise<number | null> {
    // Get all active users in the subaccount
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.subAccountId, subAccountId))
      .where(eq(schema.users.active, true));
    
    // Debug
    console.log(`Found ${users.length} eligible users for lead assignment`);
    
    if (users.length === 0) {
      console.warn(`No users found for subaccount ${subAccountId}`);
      return null;
    }
    
    // Get users with client_user role first (regular team members)
    const teamMembers = users.filter(u => u.role === 'client_user');
    
    // If no team members, use any available user
    const eligibleUsers = teamMembers.length > 0 ? teamMembers : users;
    
    // Select the user with the lowest assignment count 
    // (factoring in the weight for priority assignments)
    let selectedUser = eligibleUsers[0];
    
    for (const user of eligibleUsers) {
      const adjustedCount = (user.leadAssignmentCount || 0) / (user.leadAssignmentWeight || 1);
      const selectedAdjustedCount = (selectedUser.leadAssignmentCount || 0) / (selectedUser.leadAssignmentWeight || 1);
      
      console.log(`User ${user.id} (${user.name}) - Adjusted count: ${adjustedCount}`);
      
      if (adjustedCount < selectedAdjustedCount) {
        selectedUser = user;
      }
    }
    
    console.log(`Selected user ${selectedUser.id} (${selectedUser.name}) for lead assignment`);
    return selectedUser.id;
  }
  
  /**
   * Increments the lead assignment count for a user
   */
  async incrementLeadAssignmentCount(userId: number): Promise<void> {
    await db
      .update(schema.users)
      .set({
        leadAssignmentCount: sql`${schema.users.leadAssignmentCount} + 1`,
      })
      .where(eq(schema.users.id, userId));
  }
  
  /**
   * Updates a user's availability status
   */
  async updateUserAvailability(userId: number, status: "available" | "busy" | "break" | "offline"): Promise<schema.User | undefined> {
    const results = await db
      .update(schema.users)
      .set({
        availabilityStatus: status,
        lastAvailabilityChange: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId))
      .returning();
    
    return results[0];
  }
  
  /**
   * Gets leads assigned to a specific user
   */
  async getLeadsByAssignedUser(userId: number): Promise<schema.Lead[]> {
    return await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.assignedTo, userId))
      .orderBy(desc(schema.leads.createdAt));
  }
  
  /**
   * Reassigns a lead to another user
   */
  async reassignLead(leadId: number, newAssigneeId: number, currentUserId: number): Promise<schema.Lead | undefined> {
    // First get the lead to check if the current user is allowed to reassign it
    const [lead] = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.id, leadId));
    
    if (!lead) {
      return undefined;
    }
    
    // Only allow reassignment if the lead is assigned to the current user
    // or if the current user has admin permissions (handled in route)
    if (lead.assignedTo !== currentUserId) {
      throw new Error("You can only reassign leads that are assigned to you");
    }
    
    // Reassign the lead
    const results = await db
      .update(schema.leads)
      .set({
        assignedTo: newAssigneeId,
        updatedAt: new Date()
      })
      .where(eq(schema.leads.id, leadId))
      .returning();
    
    const updatedLead = results[0];
    
    if (updatedLead) {
      // Record this activity
      await this.createLeadActivity({
        leadId,
        userId: currentUserId,
        type: "status_change",
        content: `Lead reassigned to ${newAssigneeId}`,
      });
      
      // Create notification for the new assignee
      await this.createNotification({
        userId: newAssigneeId,
        title: "Lead Reassigned to You",
        content: `A lead (${updatedLead.name}) has been reassigned to you`,
        type: "lead_assigned",
        entityId: leadId,
        entityType: "lead"
      });
      
      // Update assignment counters
      await this.incrementLeadAssignmentCount(newAssigneeId);
    }
    
    return updatedLead;
  }

  // Workflow management
  async getWorkflows(subAccountId: number): Promise<schema.Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.subAccountId, subAccountId)).orderBy(desc(workflows.createdAt));
  }

  async createWorkflow(workflowData: schema.InsertWorkflow): Promise<schema.Workflow> {
    const results = await db.insert(workflows).values(workflowData).returning();
    return results[0];
  }

  async updateWorkflow(id: number, workflowData: Partial<schema.InsertWorkflow>): Promise<schema.Workflow | undefined> {
    const results = await db
      .update(workflows)
      .set({
        ...workflowData,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, id))
      .returning();
    return results[0];
  }

  async deleteWorkflow(id: number): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  // Workflow execution management
  async getWorkflowExecutions(subAccountId: number): Promise<schema.WorkflowExecution[]> {
    return await db
      .select()
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(eq(workflows.subAccountId, subAccountId))
      .orderBy(desc(workflowExecutions.startedAt));
  }

  async createWorkflowExecution(executionData: schema.InsertWorkflowExecution): Promise<schema.WorkflowExecution> {
    const results = await db.insert(workflowExecutions).values(executionData).returning();
    return results[0];
  }

  async updateWorkflowExecution(id: number, executionData: Partial<schema.InsertWorkflowExecution>): Promise<schema.WorkflowExecution | undefined> {
    const results = await db
      .update(workflowExecutions)
      .set(executionData)
      .where(eq(workflowExecutions.id, id))
      .returning();
    return results[0];
  }

  // Workflow action logs
  async createWorkflowActionLog(logData: schema.InsertWorkflowActionLog): Promise<schema.WorkflowActionLog> {
    const results = await db.insert(workflowActionLogs).values(logData).returning();
    return results[0];
  }
}