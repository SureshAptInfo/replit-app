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
  Workflow, InsertWorkflow,
  WorkflowExecution, InsertWorkflowExecution,
  WorkflowActionLog, InsertWorkflowActionLog,
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersBySubAccount(subAccountId: number): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined>;
  
  // Agency management
  getAgency(id: number): Promise<Agency | undefined>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  getAgencyByOwner(ownerId: number): Promise<Agency | undefined>;
  updateAgency(id: number, agency: Partial<InsertAgency>): Promise<Agency | undefined>;
  
  // SubAccount management
  getSubAccount(id: number): Promise<SubAccount | undefined>;
  getSubAccountsByAgency(agencyId: number): Promise<SubAccount[]>;
  createSubAccount(subAccount: InsertSubAccount): Promise<SubAccount>;
  updateSubAccount(id: number, subAccount: Partial<InsertSubAccount>): Promise<SubAccount | undefined>;
  
  // Lead management
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsBySubAccount(subAccountId: number, filters?: { status?: string, source?: string }): Promise<Lead[]>;
  getLeadsByAssignedUser(userId: number, filters?: { status?: string, source?: string }): Promise<Lead[]>;
  getLeadsByPhone(phone: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  getLeadCounts(subAccountId: number): Promise<Record<string, number>>;
  
  // Lead Activity
  getLeadActivities(leadId: number): Promise<LeadActivity[]>;
  getAllLeadActivities(): Promise<LeadActivity[]>;
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  
  // Email Templates
  getEmailTemplates(subAccountId: number, category?: string): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  
  // Message Templates
  getMessageTemplates(subAccountId: number, type?: string): Promise<MessageTemplate[]>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, template: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined>;
  getTemplates(subAccountId: number, type?: string): Promise<any[]>;
  
  // Tasks
  getTasks(subAccountId: number, userId?: number, leadId?: number, startDate?: Date, endDate?: Date): Promise<Task[]>;
  getTasksByLead(leadId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Documents
  getDocumentsByLead(leadId: number): Promise<Document[]>;
  getDocumentsBySubAccount(subAccountId: number, type?: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // System Configuration
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getSystemConfigByCategory(category: string): Promise<SystemConfig[]>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  
  // Integrations
  getIntegrations(subAccountId: number): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationByType(type: string, subAccountId?: number): Promise<Integration | undefined>;
  getIntegrationsByType(type: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  
  // Notifications
  getNotifications(userId: number, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // User Permissions
  getUserPermissions(userId: number): Promise<string[]>;
  setUserPermissions(userId: number, permissions: string[]): Promise<void>;
  
  // Team Management
  getLeadsByAssignedUser(userId: number): Promise<Lead[]>;
  reassignLead(leadId: number, newAssigneeId: number, currentUserId: number): Promise<Lead | undefined>;
  getNextUserForLeadAssignment(subAccountId: number): Promise<number | null>;
  incrementLeadAssignmentCount(userId: number): Promise<void>;
  updateUserAvailability(userId: number, status: "available" | "busy" | "break" | "offline"): Promise<User | undefined>;
  
  // Workflow management
  getWorkflows(subAccountId: number): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<void>;
  
  // Workflow execution management
  getWorkflowExecutions(subAccountId: number): Promise<WorkflowExecution[]>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecution(id: number, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined>;
  
  // Workflow action logs
  createWorkflowActionLog(log: InsertWorkflowActionLog): Promise<WorkflowActionLog>;
}

// Import the database storage implementation
import { DatabaseStorage } from './database-storage';

// Create an instance of the database storage implementation to be used throughout the app
export const storage = new DatabaseStorage();
