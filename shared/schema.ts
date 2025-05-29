import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Can be null for SSO users
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { 
    enum: ["super_admin", "agency_owner", "agency_admin", "client_admin", "client_user"]
  }).default("client_user").notNull(),
  subAccountId: integer("sub_account_id"), // Can be null for agency owners/admins
  profilePicture: text("profile_picture"),
  avatarUrl: text("avatar_url"), // Profile image
  phone: text("phone"), // Phone number for contacts
  position: text("position"), // Job title
  department: text("department"), // Department
  availabilityStatus: text("availability_status", { 
    enum: ["available", "busy", "break", "offline"]
  }).default("available").notNull(), // Team member availability status
  lastAvailabilityChange: timestamp("last_availability_change", { withTimezone: true }), // When availability was last changed
  leadAssignmentWeight: integer("lead_assignment_weight").default(1), // Weight for lead assignment (higher = more leads)
  leadAssignmentCount: integer("lead_assignment_count").default(0), // Count of leads assigned via round-robin
  googleId: text("google_id").unique(), // For Google SSO
  microsoftId: text("microsoft_id").unique(), // For Microsoft SSO
  stripeCustomerId: text("stripe_customer_id"), // For payments
  stripeSubscriptionId: text("stripe_subscription_id"), // For subscriptions
  notifications: json("notifications").default({}), // Notification preferences
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  lastLogin: timestamp("last_login", { withTimezone: true }), // UTC timestamp
});

// Sub-Account model for multi-tenancy
export const subAccounts = pgTable("sub_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // URL to S3
  favicon: text("favicon"), // URL to S3
  domain: text("domain"),
  senderId: text("sender_id"), // For emails/SMS
  agencyId: integer("agency_id"), // Can be null for standalone accounts
  active: boolean("active").default(true).notNull(),
  tierLimitId: integer("tier_limit_id"), // For subscription tiers
  colorPrimary: text("color_primary").default("#3B82F6"),
  colorSecondary: text("color_secondary").default("#10B981"),
  contactEmail: text("contact_email"), // Main contact email
  address: text("address"), // Physical address
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  phone: text("phone"),
  website: text("website"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Agency model (top-level accounts)
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // URL to S3
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipcode: text("zipcode"),
  phone: text("phone"),
  email: text("email"),
  ownerId: integer("owner_id"), // Reference to the user who owns this agency
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Lead model
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: text("status", { 
    enum: ["new", "unread", "read", "contacted", "rnr", "follow_up", "interested", "not_interested", "junk", "converted", "lost"] 
  }).default("new").notNull(),
  source: text("source"),
  subAccountId: integer("sub_account_id").notNull(), // Foreign key to subAccounts
  assignedUserId: integer("assigned_user_id"), // Foreign key to users
  assignedTo: integer("assigned_to"), // Legacy field (maintained for compatibility)
  notes: text("notes"),
  tags: text("tags").array(),
  value: integer("value"), // Potential value of the lead
  company: text("company"),
  position: text("position"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipcode: text("zipcode"),
  followUpCount: integer("follow_up_count").default(0), // Track how many follow-ups have been made
  lastFollowUpDate: timestamp("last_follow_up_date"), // Track when the last follow-up was scheduled
  lastContactedAt: timestamp("last_contacted_at"), // Track when the lead was last contacted
  customFields: json("custom_fields"), // For flexible lead data
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Lead Activity model
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(), // Foreign key to leads
  userId: integer("user_id").notNull(), // Foreign key to users
  type: text("type", { 
    enum: ["note", "status_change", "call", "email", "sms", "whatsapp", "meeting", "reassignment", "other"]
  }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  attachments: text("attachments").array(), // URLs to S3
  direction: text("direction", { enum: ["outgoing", "incoming", "internal"] }).default("outgoing"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  design: json("design"), // Visual editor data
  category: text("category", {
    enum: ["welcome", "lead_followup", "newsletter", "notification", "marketing", "custom"]
  }).default("custom").notNull(),
  subAccountId: integer("sub_account_id").notNull(), // Foreign key to subAccounts
  createdBy: integer("created_by").notNull(), // Foreign key to users
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Message Templates (SMS, WhatsApp)
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["sms", "whatsapp"] }).notNull(),
  category: text("category", {
    enum: ["welcome", "lead_followup", "notification", "marketing", "custom"]
  }).default("custom").notNull(),
  subAccountId: integer("sub_account_id").notNull(), // Foreign key to subAccounts
  createdBy: integer("created_by").notNull(), // Foreign key to users
  active: boolean("active").default(true).notNull(),
  language: text("language").default("en_US"), // Language code for WhatsApp templates
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(), // UTC timestamp
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  leadId: integer("lead_id"), // Foreign key to leads (can be null for general tasks)
  userId: integer("user_id").notNull(), // Foreign key to users (assigned to)
  createdBy: integer("created_by").notNull(), // Foreign key to users (created by)
  subAccountId: integer("sub_account_id").notNull(), // Foreign key to subAccounts
  completedAt: timestamp("completed_at", { withTimezone: true }), // UTC timestamp
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Documents & Files
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["image", "document", "video", "other"] }).notNull(),
  path: text("path").notNull(), // S3 path
  size: integer("size").notNull(), // In bytes
  mimeType: text("mime_type").notNull(),
  leadId: integer("lead_id"), // Foreign key to leads (can be null)
  subAccountId: integer("sub_account_id").notNull(), // Foreign key to subAccounts
  uploadedBy: integer("uploaded_by").notNull(), // Foreign key to users
  thumbnail: text("thumbnail"), // S3 path for thumbnail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// System Configuration
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category", {
    enum: ["aws", "email", "stripe", "vimeo", "general", "security"]
  }).notNull(),
  description: text("description"),
  isSecret: boolean("is_secret").default(false).notNull(),
  updatedBy: integer("updated_by").notNull(), // Foreign key to users
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Subscription Tiers & Limits
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // In cents
  billingCycle: text("billing_cycle", { enum: ["monthly", "yearly"] }).default("monthly").notNull(),
  stripePriceId: text("stripe_price_id"),
  features: json("features"), // JSON array of features
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Account Limits (tied to subscription tiers)
export const accountLimits = pgTable("account_limits", {
  id: serial("id").primaryKey(),
  tierId: integer("tier_id").notNull(), // Foreign key to subscriptionTiers
  maxLeads: integer("max_leads").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxStorage: integer("max_storage").notNull(), // In MB
  maxSubAccounts: integer("max_sub_accounts").notNull(),
  allowedFeatures: text("allowed_features").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Integration Settings
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  type: text("type", { 
    enum: [
      "aws_s3", 
      "brevo", 
      "stripe", 
      "vimeo", 
      "google_sso", 
      "microsoft_sso", 
      "facebook", 
      "whatsapp", 
      "twilio", 
      "sendgrid",
      "webchat"
    ] 
  }).notNull(),
  name: text("name").notNull(),
  config: json("config").notNull(), // Configuration values as JSON
  active: boolean("active").default(true).notNull(),
  subAccountId: integer("sub_account_id"), // Can be null for system-wide integrations
  createdBy: integer("created_by").notNull(), // Foreign key to users
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// Contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  source: text("source").notNull(),
  status: text("status").notNull(),
  tags: text("tags").array(),
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date", { withTimezone: true }).defaultNow(),
  subAccountId: integer("sub_account_id").references(() => subAccounts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactsRelations = relations(contacts, ({ one }) => ({
  subAccount: one(subAccounts, {
    fields: [contacts.subAccountId],
    references: [subAccounts.id],
  }),
}));

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Foreign key to users
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", {
    enum: ["lead_assigned", "task_assigned", "task_due", "message", "system"]
  }).notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"), // URL to navigate when clicked
  entityId: integer("entity_id"), // ID of related entity (lead, task, etc.)
  entityType: text("entity_type"), // Type of related entity
  leadId: integer("lead_id"), // Direct reference to lead for messaging notifications
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // UTC timestamp
});

// User Permissions for granular access control
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Foreign key to users
  permissionId: text("permission_id").notNull(), // Permission identifier (e.g., "leads_view", "leads_edit")
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Workflows for automation
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: json("trigger").notNull(), // Trigger configuration as JSON
  actions: json("actions").notNull(), // Array of actions as JSON
  conditions: json("conditions"), // Array of conditions as JSON
  active: boolean("active").default(true).notNull(),
  subAccountId: integer("sub_account_id").notNull(), // Foreign key to subAccounts
  createdBy: integer("created_by").notNull(), // Foreign key to users
  executionCount: integer("execution_count").default(0).notNull(),
  lastExecuted: timestamp("last_executed", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Workflow Executions for tracking
export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(), // Foreign key to workflows
  leadId: integer("lead_id"), // Foreign key to leads (can be null for non-lead triggers)
  status: text("status", { 
    enum: ["running", "completed", "failed", "cancelled"] 
  }).default("running").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"), // Error message if failed
  executionData: json("execution_data"), // Execution context and results
  triggeredBy: text("triggered_by").notNull(), // What triggered this execution
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Workflow Action Logs for detailed tracking
export const workflowActionLogs = pgTable("workflow_action_logs", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").notNull(), // Foreign key to workflowExecutions
  actionType: text("action_type").notNull(), // send_email, send_sms, update_lead, etc.
  actionData: json("action_data").notNull(), // Action configuration
  status: text("status", { 
    enum: ["pending", "completed", "failed", "skipped"] 
  }).default("pending").notNull(),
  result: json("result"), // Action result data
  error: text("error"), // Error message if failed
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  subAccount: one(subAccounts, {
    fields: [users.subAccountId],
    references: [subAccounts.id],
  }),
  ownedAgency: one(agencies, {
    fields: [users.id],
    references: [agencies.ownerId],
  }),
  assignedLeads: many(leads, { relationName: "assignedLeads" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  leadActivities: many(leadActivities),
  notifications: many(notifications),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  owner: one(users, {
    fields: [agencies.ownerId],
    references: [users.id],
  }),
  subAccounts: many(subAccounts),
}));

export const subAccountsRelations = relations(subAccounts, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [subAccounts.agencyId],
    references: [agencies.id],
  }),
  users: many(users),
  leads: many(leads),
  emailTemplates: many(emailTemplates),
  messageTemplates: many(messageTemplates),
  tasks: many(tasks),
  documents: many(documents),
  integrations: many(integrations),
}));

// Insert schemas for validation - User management
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  lastLogin: true 
});

// Insert schemas for tenant management
export const insertSubAccountSchema = createInsertSchema(subAccounts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertAgencySchema = createInsertSchema(agencies).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Insert schemas for lead management
export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  lastActivity: true 
});
export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({ 
  id: true, 
  createdAt: true 
});

// Insert schemas for communications
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
});

// Insert schemas for task management
export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  completedAt: true 
});

// Insert schemas for document management
export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true 
});

// Insert schema for user permissions
export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Insert schemas for system configuration
export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertIntegrationSchema = createInsertSchema(integrations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Insert schemas for subscription management
export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertAccountLimitSchema = createInsertSchema(accountLimits).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Insert schemas for notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});

// Insert schema for contacts
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Insert schemas for workflow automation
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  executionCount: true,
  lastExecuted: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  createdAt: true
});

export const insertWorkflowActionLogSchema = createInsertSchema(workflowActionLogs).omit({
  id: true
});

// Types for user management
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Types for tenant management
export type SubAccount = typeof subAccounts.$inferSelect;
export type InsertSubAccount = z.infer<typeof insertSubAccountSchema>;
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;

// Types for lead management
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;

// Types for communications
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

// Types for task management
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Types for document management
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Types for system configuration
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

// Types for subscription management
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type AccountLimit = typeof accountLimits.$inferSelect;
export type InsertAccountLimit = z.infer<typeof insertAccountLimitSchema>;

// Types for notifications
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Types for contacts
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Types for workflow automation
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowActionLog = typeof workflowActionLogs.$inferSelect;
export type InsertWorkflowActionLog = z.infer<typeof insertWorkflowActionLogSchema>;
