import { 
  User, InsertUser, 
  SubAccount, InsertSubAccount, 
  Agency, InsertAgency,
  Lead, InsertLead,
  LeadActivity, InsertLeadActivity,
  EmailTemplate, InsertEmailTemplate,
  MessageTemplate, InsertMessageTemplate,
  Task, InsertTask,
  Document, InsertDocument,
  SystemConfig, InsertSystemConfig,
  Integration, InsertIntegration,
  Notification, InsertNotification,
  SubscriptionTier, InsertSubscriptionTier,
  AccountLimit, InsertAccountLimit,
  Contact, InsertContact
} from "@shared/schema";
import { IStorage } from "./storage";

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private agencies: Agency[] = [];
  private subAccounts: SubAccount[] = [];
  private leads: Lead[] = [];
  private leadActivities: LeadActivity[] = [];
  private emailTemplates: EmailTemplate[] = [];
  private messageTemplates: MessageTemplate[] = [];
  private tasks: Task[] = [];
  private documents: Document[] = [];
  private userPermissions: { userId: number; permissionId: string }[] = [];
  private systemConfigs: SystemConfig[] = [];
  private integrations: Integration[] = [];
  private notifications: Notification[] = [];
  private subscriptionTiers: SubscriptionTier[] = [];
  private accountLimits: AccountLimit[] = [];
  private contacts: Contact[] = [];
  private userPermissionsMap: Record<number, string[]> = {};
  
  private nextId = {
    user: 1,
    agency: 1,
    subAccount: 1,
    lead: 1,
    leadActivity: 1,
    emailTemplate: 1,
    messageTemplate: 1,
    task: 1,
    document: 1,
    systemConfig: 1,
    integration: 1,
    notification: 1,
    subscriptionTier: 1,
    accountLimit: 1,
    contact: 1
  };

  constructor() {
    // Add a default admin user for demo
    this.users.push({
      id: this.nextId.user++,
      username: "admin",
      password: "password",
      name: "Admin User",
      email: "admin@example.com",
      role: "super_admin",
      subAccountId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      phone: null,
      avatar: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      lastLogin: null,
      preferences: null
    });
    
    // Add a default subaccount
    this.subAccounts.push({
      id: this.nextId.subAccount++,
      name: "Default Account",
      agencyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      logo: null,
      favicon: null,
      domain: null,
      senderId: null,
      tierLimitId: null,
      colorPrimary: null,
      colorSecondary: null
    });
    
    // Add default demo data
    this.leads.push({
      id: this.nextId.lead++,
      name: "John Smith",
      phone: "+1234567890",
      email: "john@example.com",
      subAccountId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: "Website",
      status: "new",
      assignedTo: 1,
      value: 5000,
      address: null,
      city: null,
      state: null,
      zipcode: null,
      country: null,
      notes: null,
      company: null,
      tags: [],
      lastActivity: new Date()
    });

    // Add test lead for WhatsApp messaging
    this.leads.push({
      id: this.nextId.lead++,
      name: "venu",
      phone: "+917010749648",
      email: "venu@example.com",
      subAccountId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: "manual",
      status: "new",
      assignedTo: 1,
      value: null,
      address: null,
      city: null,
      state: null,
      zipcode: null,
      country: null,
      notes: null,
      company: null,
      tags: [],
      lastActivity: new Date()
    });
    
    // We've already created the user and account directly
    // No need to call createUser
    
    // Add a default regular user for demo
    this.createUser({
      username: "user",
      password: "password",
      name: "Regular User",
      email: "user@example.com",
      role: "client_user",
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId.user++,
      ...userData,
      active: userData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUsersBySubAccount(subAccountId: number): Promise<User[]> {
    return this.users.filter(user => user.subAccountId === subAccountId);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      ...stripeInfo,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      stripeCustomerId,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }

  // Agency management
  async getAgency(id: number): Promise<Agency | undefined> {
    return this.agencies.find(agency => agency.id === id);
  }

  async createAgency(agencyData: InsertAgency): Promise<Agency> {
    const newAgency: Agency = {
      id: this.nextId.agency++,
      ...agencyData,
      active: agencyData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agencies.push(newAgency);
    return newAgency;
  }

  async getAgencyByOwner(ownerId: number): Promise<Agency | undefined> {
    return this.agencies.find(agency => agency.ownerId === ownerId);
  }

  async updateAgency(id: number, agencyData: Partial<InsertAgency>): Promise<Agency | undefined> {
    const index = this.agencies.findIndex(agency => agency.id === id);
    if (index === -1) return undefined;
    
    this.agencies[index] = {
      ...this.agencies[index],
      ...agencyData,
      updatedAt: new Date()
    };
    
    return this.agencies[index];
  }

  // SubAccount management
  async getSubAccount(id: number): Promise<SubAccount | undefined> {
    return this.subAccounts.find(subAccount => subAccount.id === id);
  }

  async getSubAccountsByAgency(agencyId: number): Promise<SubAccount[]> {
    return this.subAccounts.filter(subAccount => subAccount.agencyId === agencyId);
  }

  async createSubAccount(subAccountData: InsertSubAccount): Promise<SubAccount> {
    const newSubAccount: SubAccount = {
      id: this.nextId.subAccount++,
      ...subAccountData,
      active: subAccountData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.subAccounts.push(newSubAccount);
    return newSubAccount;
  }

  async updateSubAccount(id: number, subAccountData: Partial<InsertSubAccount>): Promise<SubAccount | undefined> {
    const index = this.subAccounts.findIndex(subAccount => subAccount.id === id);
    if (index === -1) return undefined;
    
    this.subAccounts[index] = {
      ...this.subAccounts[index],
      ...subAccountData,
      updatedAt: new Date()
    };
    
    return this.subAccounts[index];
  }

  // Lead management
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.find(lead => lead.id === id);
  }

  async getLeadsBySubAccount(subAccountId: number, filters?: { status?: string, source?: string }): Promise<Lead[]> {
    let result = this.leads.filter(lead => lead.subAccountId === subAccountId);
    
    if (filters?.status) {
      result = result.filter(lead => lead.status === filters.status);
    }
    
    if (filters?.source) {
      result = result.filter(lead => lead.source === filters.source);
    }
    
    return result;
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const newLead: Lead = {
      id: this.nextId.lead++,
      ...leadData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date()
    };
    this.leads.push(newLead);
    return newLead;
  }

  async updateLead(id: number, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    const index = this.leads.findIndex(lead => lead.id === id);
    if (index === -1) {
      console.log(`updateLead: Lead with ID ${id} not found`);
      return undefined;
    }
    
    console.log(`updateLead: Updating lead ${id} with data:`, JSON.stringify(leadData));
    console.log(`updateLead: Current lead status: ${this.leads[index].status}`);
    
    this.leads[index] = {
      ...this.leads[index],
      ...leadData,
      updatedAt: new Date()
    };
    
    console.log(`updateLead: New lead status: ${this.leads[index].status}`);
    
    return this.leads[index];
  }

  async getLeadCounts(subAccountId: number): Promise<Record<string, number>> {
    const leadsForSubAccount = this.leads.filter(lead => lead.subAccountId === subAccountId);
    
    // Return the counts in the format expected by the API endpoint
    const counts: Record<string, number> = {
      total: leadsForSubAccount.length,
      new: 0,
      contacted: 0,
      rnr: 0,
      follow_up: 0,
      interested: 0,
      qualified: 0,
      converted: 0,
      lost: 0
    };
    
    // Count leads by status with backend naming convention
    leadsForSubAccount.forEach(lead => {
      if (lead.status === "new") counts.new++;
      else if (lead.status === "contacted") counts.contacted++;
      else if (lead.status === "rnr") counts.rnr++;
      else if (lead.status === "follow_up") counts.follow_up++;
      else if (lead.status === "interested") counts.interested++;
      else if (lead.status === "qualified") counts.qualified++;
      else if (lead.status === "converted") counts.converted++;
      else if (lead.status === "lost") counts.lost++;
    });
    
    return counts;
  }

  // Lead Activity
  async getLeadActivities(leadId: number): Promise<LeadActivity[]> {
    return this.leadActivities.filter(activity => activity.leadId === leadId);
  }
  
  /**
   * Get all lead activities 
   * @returns Array of all lead activities across all leads
   */
  async getAllLeadActivities(): Promise<LeadActivity[]> {
    return this.leadActivities;
  }

  async createLeadActivity(activityData: InsertLeadActivity): Promise<LeadActivity> {
    const newActivity: LeadActivity = {
      id: this.nextId.leadActivity++,
      ...activityData,
      createdAt: new Date()
    };
    this.leadActivities.push(newActivity);
    
    // Update lead's lastActivity
    const leadIndex = this.leads.findIndex(lead => lead.id === activityData.leadId);
    if (leadIndex !== -1) {
      this.leads[leadIndex].lastActivity = new Date();
    }
    
    return newActivity;
  }

  // Email Templates
  async getEmailTemplates(subAccountId: number, category?: string): Promise<EmailTemplate[]> {
    let templates = this.emailTemplates.filter(template => template.subAccountId === subAccountId);
    
    if (category) {
      templates = templates.filter(template => template.category === category);
    }
    
    return templates;
  }

  async createEmailTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      id: this.nextId.emailTemplate++,
      ...templateData,
      active: templateData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.emailTemplates.push(newTemplate);
    return newTemplate;
  }

  // Message Templates
  async getMessageTemplates(subAccountId: number, type?: string): Promise<MessageTemplate[]> {
    let templates = this.messageTemplates.filter(template => template.subAccountId === subAccountId);
    
    if (type) {
      templates = templates.filter(template => template.type === type);
    }
    
    return templates;
  }

  async createMessageTemplate(templateData: InsertMessageTemplate): Promise<MessageTemplate> {
    const newTemplate: MessageTemplate = {
      id: this.nextId.messageTemplate++,
      ...templateData,
      active: templateData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.messageTemplates.push(newTemplate);
    return newTemplate;
  }

  async updateMessageTemplate(id: number, templateData: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined> {
    const index = this.messageTemplates.findIndex(template => template.id === id);
    if (index === -1) return undefined;
    
    this.messageTemplates[index] = {
      ...this.messageTemplates[index],
      ...templateData,
      updatedAt: new Date()
    };
    return this.messageTemplates[index];
  }

  // Tasks
  async getTasks(subAccountId: number, userId?: number, leadId?: number, startDate?: Date, endDate?: Date): Promise<Task[]> {
    let tasks = this.tasks.filter(task => task.subAccountId === subAccountId);
    
    if (userId) {
      tasks = tasks.filter(task => task.userId === userId);
    }
    
    if (leadId) {
      tasks = tasks.filter(task => task.leadId === leadId);
    }
    
    if (startDate || endDate) {
      tasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        if (startDate && endDate) {
          return taskDate >= startDate && taskDate <= endDate;
        } else if (startDate) {
          return taskDate >= startDate;
        } else if (endDate) {
          return taskDate <= endDate;
        }
        return true;
      });
    }
    
    // Sort by due date descending (most recent first)
    return tasks.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }

  async getTasksByLead(leadId: number): Promise<Task[]> {
    return this.tasks.filter(task => task.leadId === leadId);
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const newTask: Task = {
      id: this.nextId.task++,
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    };
    this.tasks.push(newTask);
    return newTask;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;
    
    const updatedTask = {
      ...this.tasks[index],
      ...taskData,
      updatedAt: new Date()
    };
    
    // If task is being marked as completed and wasn't completed before
    if (taskData.completed === true && !this.tasks[index].completed) {
      updatedTask.completedAt = new Date();
    }
    
    // If task is being marked as not completed
    if (taskData.completed === false) {
      updatedTask.completedAt = null;
    }
    
    this.tasks[index] = updatedTask;
    
    return this.tasks[index];
  }

  // Documents
  async getDocumentsByLead(leadId: number): Promise<Document[]> {
    return this.documents.filter(doc => doc.leadId === leadId);
  }

  async getDocumentsBySubAccount(subAccountId: number, type?: string): Promise<Document[]> {
    let docs = this.documents.filter(doc => doc.subAccountId === subAccountId);
    
    if (type) {
      docs = docs.filter(doc => doc.type === type);
    }
    
    return docs;
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      id: this.nextId.document++,
      ...documentData,
      createdAt: new Date()
    };
    this.documents.push(newDocument);
    return newDocument;
  }

  // System Configuration
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfigs.find(config => config.key === key);
  }

  async getSystemConfigByCategory(category: string): Promise<SystemConfig[]> {
    return this.systemConfigs.filter(config => config.category === category);
  }

  async setSystemConfig(configData: InsertSystemConfig): Promise<SystemConfig> {
    const existingIndex = this.systemConfigs.findIndex(config => config.key === configData.key);
    
    if (existingIndex !== -1) {
      // Update existing config
      this.systemConfigs[existingIndex] = {
        ...this.systemConfigs[existingIndex],
        value: configData.value,
        updatedBy: configData.updatedBy,
        updatedAt: new Date()
      };
      return this.systemConfigs[existingIndex];
    } else {
      // Create new config
      const newConfig: SystemConfig = {
        id: this.nextId.systemConfig++,
        ...configData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.systemConfigs.push(newConfig);
      return newConfig;
    }
  }

  // Integrations
  async getIntegrations(subAccountId: number): Promise<Integration[]> {
    return this.integrations.filter(integration => integration.subAccountId === subAccountId);
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    return this.integrations.find(integration => integration.id === id);
  }

  async getIntegrationByType(type: string, subAccountId?: number): Promise<Integration | undefined> {
    let result = this.integrations.filter(integration => integration.type === type);
    
    if (subAccountId) {
      result = result.filter(integration => integration.subAccountId === subAccountId);
    } else {
      // Get system-wide integration (subAccountId is null)
      result = result.filter(integration => integration.subAccountId === null);
    }
    
    return result[0];
  }
  
  // Get all integrations of a specific type across all subaccounts
  async getIntegrationsByType(type: string): Promise<Integration[]> {
    return this.integrations.filter(integration => integration.type === type);
  }

  async createIntegration(integrationData: InsertIntegration): Promise<Integration> {
    const newIntegration: Integration = {
      id: this.nextId.integration++,
      ...integrationData,
      active: integrationData.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.integrations.push(newIntegration);
    return newIntegration;
  }

  async updateIntegration(id: number, integrationData: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const index = this.integrations.findIndex(integration => integration.id === id);
    if (index === -1) return undefined;
    
    this.integrations[index] = {
      ...this.integrations[index],
      ...integrationData,
      updatedAt: new Date()
    };
    
    return this.integrations[index];
  }

  // Notifications
  async getNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.nextId.notification++,
      ...notificationData,
      createdAt: new Date()
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const index = this.notifications.findIndex(notification => notification.id === id);
    if (index === -1) return undefined;
    
    this.notifications[index] = {
      ...this.notifications[index],
      read: true
    };
    
    return this.notifications[index];
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    this.notifications = this.notifications.map(notification => {
      if (notification.userId === userId) {
        return { ...notification, read: true };
      }
      return notification;
    });
  }
  
  // Contacts methods for our new feature
  async getContacts(subAccountId?: number): Promise<Contact[]> {
    if (subAccountId) {
      return this.contacts.filter(contact => contact.subAccountId === subAccountId);
    }
    return this.contacts;
  }
  
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.find(contact => contact.id === id);
  }
  
  async createContact(contactData: InsertContact): Promise<Contact> {
    const newContact: Contact = {
      id: this.nextId.contact++,
      ...contactData,
      lastContactDate: contactData.lastContactDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contacts.push(newContact);
    return newContact;
  }
  
  async updateContact(id: number, contactData: Partial<InsertContact>): Promise<Contact | undefined> {
    const index = this.contacts.findIndex(contact => contact.id === id);
    if (index === -1) return undefined;
    
    this.contacts[index] = {
      ...this.contacts[index],
      ...contactData,
      updatedAt: new Date()
    };
    
    return this.contacts[index];
  }
  
  // User Permissions
  async getUserPermissions(userId: number): Promise<string[]> {
    return this.userPermissionsMap[userId] || [];
  }
  
  async setUserPermissions(userId: number, permissions: string[]): Promise<void> {
    this.userPermissionsMap[userId] = [...permissions];
  }

  /**
   * Gets leads assigned to a specific user
   */
  async getLeadsByAssignedUser(userId: number): Promise<Lead[]> {
    return this.leads.filter(lead => lead.assignedTo === userId || lead.assignedUserId === userId);
  }
  
  /**
   * Search for leads by phone number
   * Handles different phone number formats (with/without country code)
   */
  async getLeadsByPhone(phone: string): Promise<Lead[]> {
    // Format the search phone number (remove non-numeric characters)
    const formattedSearchPhone = phone.replace(/\D/g, '');
    
    // Check for matches with the phone number
    return this.leads.filter(lead => {
      if (!lead.phone) return false;
      
      // Format the lead's phone number
      const formattedLeadPhone = lead.phone.replace(/\D/g, '');
      
      // Check for exact match
      if (formattedLeadPhone === formattedSearchPhone) {
        return true;
      }
      
      // Check for match without country code (assuming US/Canada format)
      if (formattedSearchPhone.length === 11 && formattedSearchPhone.startsWith('1')) {
        if (formattedLeadPhone === formattedSearchPhone.substring(1)) {
          return true;
        }
      }
      
      // Check match with added country code
      if (formattedSearchPhone.length === 10) {
        if (formattedLeadPhone === '1' + formattedSearchPhone) {
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Reassigns a lead to another user
   */
  async reassignLead(leadId: number, newAssigneeId: number, currentUserId: number): Promise<Lead | undefined> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      return undefined;
    }

    // Update the lead assignment
    const updatedLead = await this.updateLead(leadId, { 
      assignedTo: newAssigneeId
    });

    // Create activity record for the reassignment
    await this.createLeadActivity({
      leadId,
      userId: currentUserId,
      type: 'reassignment',
      content: `Lead reassigned to team member ID: ${newAssigneeId}`,
      metadata: JSON.stringify({
        previousAssignee: lead.assignedTo,
        newAssignee: newAssigneeId
      })
    });

    // Create notification for the new assignee
    await this.createNotification({
      userId: newAssigneeId,
      type: 'lead_assigned',
      title: 'New Lead Assigned',
      content: `A lead (${lead.name}) has been assigned to you`,
      entityId: leadId,
      entityType: 'lead',
      read: false
    });

    return updatedLead;
  }

  /**
   * Gets the next available user for lead assignment in a round-robin manner
   */
  async getNextUserForLeadAssignment(subAccountId: number): Promise<number | null> {
    // Get all active users for this subaccount with role client_user
    const teamMembers = this.users.filter(user => 
      user.subAccountId === subAccountId && 
      user.role === 'client_user' && 
      user.active && 
      user.availabilityStatus !== 'offline' && 
      user.availabilityStatus !== 'break'
    );

    if (teamMembers.length === 0) {
      return null;
    }

    // Sort by leadAssignmentCount (ascending) to implement round-robin
    teamMembers.sort((a, b) => 
      (a.leadAssignmentCount || 0) - (b.leadAssignmentCount || 0)
    );

    // Return the ID of the user with the fewest leads
    return teamMembers[0].id;
  }

  /**
   * Increments the lead assignment count for a user
   */
  async incrementLeadAssignmentCount(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      const currentCount = user.leadAssignmentCount || 0;
      await this.updateUser(userId, { 
        leadAssignmentCount: currentCount + 1 
      });
    }
  }

  /**
   * Updates a user's availability status
   */
  async updateUserAvailability(userId: number, status: "available" | "busy" | "break" | "offline"): Promise<User | undefined> {
    return this.updateUser(userId, { 
      availabilityStatus: status 
    });
  }
}

// Create and export a single instance of MemStorage
export const memStorage = new MemStorage();