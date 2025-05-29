// A simple file-based permission service that doesn't rely on the database
// This ensures permissions work even if there are database connection issues

import fs from 'fs';
import path from 'path';

// Store permissions in memory with file backup
class PermissionsService {
  private userPermissions: Record<number, string[]> = {};
  private permissionsFile = path.join(process.cwd(), 'user-permissions.json');
  
  constructor() {
    this.loadPermissions();
  }
  
  // Load permissions from file
  private loadPermissions() {
    try {
      if (fs.existsSync(this.permissionsFile)) {
        const data = fs.readFileSync(this.permissionsFile, 'utf8');
        this.userPermissions = JSON.parse(data);
        console.log('Permissions loaded from file');
      } else {
        console.log('No permissions file found, creating new one');
        this.savePermissions();
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Initialize with empty permissions if file can't be read
      this.userPermissions = {};
      this.savePermissions();
    }
  }
  
  // Save permissions to file
  private savePermissions() {
    try {
      fs.writeFileSync(
        this.permissionsFile,
        JSON.stringify(this.userPermissions, null, 2),
        'utf8'
      );
      console.log('Permissions saved to file');
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  }
  
  // Get permissions for a user
  getUserPermissions(userId: number): string[] {
    return this.userPermissions[userId] || [];
  }
  
  // Set permissions for a user
  setUserPermissions(userId: number, permissions: string[]): void {
    this.userPermissions[userId] = [...permissions];
    this.savePermissions();
  }
  
  // Available permissions in the system
  getAvailablePermissions(): Array<{id: string, name: string, category: string}> {
    return [
      // Lead management permissions
      { id: "leads.view", name: "View Leads", category: "Leads" },
      { id: "leads.create", name: "Create Leads", category: "Leads" },
      { id: "leads.edit", name: "Edit Leads", category: "Leads" },
      { id: "leads.delete", name: "Delete Leads", category: "Leads" },
      { id: "leads.export", name: "Export Leads", category: "Leads" },
      { id: "leads.import", name: "Import Leads", category: "Leads" },
      
      // Task management permissions
      { id: "tasks.view", name: "View Tasks", category: "Tasks" },
      { id: "tasks.create", name: "Create Tasks", category: "Tasks" },
      { id: "tasks.edit", name: "Edit Tasks", category: "Tasks" },
      { id: "tasks.delete", name: "Delete Tasks", category: "Tasks" },
      { id: "tasks.assign", name: "Assign Tasks", category: "Tasks" },
      
      // Communication permissions
      { id: "communication.view", name: "View Messages", category: "Communication" },
      { id: "communication.send", name: "Send Messages", category: "Communication" },
      { id: "communication.templates", name: "Manage Templates", category: "Communication" },
      
      // Document permissions
      { id: "documents.view", name: "View Documents", category: "Documents" },
      { id: "documents.upload", name: "Upload Documents", category: "Documents" },
      { id: "documents.download", name: "Download Documents", category: "Documents" },
      { id: "documents.delete", name: "Delete Documents", category: "Documents" },
      
      // Analytics permissions
      { id: "analytics.view", name: "View Analytics", category: "Analytics" },
      { id: "analytics.export", name: "Export Reports", category: "Analytics" },
      
      // Settings permissions
      { id: "settings.view", name: "View Settings", category: "Settings" },
      { id: "settings.edit", name: "Edit Settings", category: "Settings" },
      { id: "settings.integrations", name: "Manage Integrations", category: "Settings" }
    ];
  }
  
  // Get role-based preset permissions
  getRolePresetPermissions(role: string): string[] {
    switch (role) {
      case "super_admin":
        // Super admin has all permissions
        return this.getAvailablePermissions().map(p => p.id);
        
      case "agency_owner":
        // Agency owner has almost all permissions except some super admin ones
        return this.getAvailablePermissions()
          .filter(p => !p.id.includes("settings.superadmin"))
          .map(p => p.id);
          
      case "agency_admin":
        // Agency admin has most permissions except agency-level settings
        return this.getAvailablePermissions()
          .filter(p => !p.id.includes("settings.agency"))
          .map(p => p.id);
          
      case "client_admin":
        // Client admin has permissions for their specific client account
        return [
          "leads.view", "leads.create", "leads.edit", "leads.export", "leads.import",
          "tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.assign",
          "communication.view", "communication.send", "communication.templates",
          "documents.view", "documents.upload", "documents.download", "documents.delete",
          "analytics.view", "analytics.export",
          "settings.view"
        ];
        
      case "client_user":
        // Basic user with limited permissions
        return [
          "leads.view", "leads.create",
          "tasks.view", "tasks.create", "tasks.edit",
          "communication.view", "communication.send",
          "documents.view", "documents.upload", "documents.download",
          "analytics.view"
        ];
        
      default:
        return [];
    }
  }
}

// Create and export a singleton instance
export const permissionsService = new PermissionsService();