import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  FileText, 
  Globe, 
  Users, 
  Calendar, 
  MessageSquare,
  BriefcaseBusiness,
  Cloud 
} from 'lucide-react';

export default function SystemSettings() {
  const { toast } = useToast();
  
  // Local state for each settings tab
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'LeadTrackPro',
    adminEmail: 'admin@leadtrackpro.com',
    supportEmail: 'support@leadtrackpro.com',
    maintenanceMode: false,
    maintenanceMessage: 'The system is currently under maintenance. Please check back later.',
    defaultLanguage: 'en',
    defaultTimezone: 'UTC',
    termsUrl: 'https://leadtrackpro.com/terms',
    privacyUrl: 'https://leadtrackpro.com/privacy',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.brevo.com',
    smtpPort: '587',
    smtpUser: 'api',
    smtpPassword: '',
    smtpEncryption: 'tls',
    emailFromName: 'LeadTrackPro',
    emailFromAddress: 'noreply@leadtrackpro.com',
    emailReplyToAddress: 'support@leadtrackpro.com',
    emailFooter: 'LeadTrackPro - Professional Lead Management Solution',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    enableBrowserNotifications: true,
    enableSystemAlerts: true,
    alertsEmailAddress: 'alerts@leadtrackpro.com',
    dailyDigest: true,
    weeklyReport: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    forceStrongPasswords: true,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    enableTwoFactor: true,
    ipRestriction: false,
    allowedIpAddresses: '',
    sessionTimeoutMinutes: 60,
    enableApiAccess: true,
  });

  const [defaultSettings, setDefaultSettings] = useState({
    leads: {
      defaultStatus: 'new',
      defaultFollowUpDays: 3,
      autoAssignment: true,
      requireNotes: false,
    },
    tasks: {
      defaultReminderHours: 24,
      autoCloseCompletedTasks: true,
      taskAging: {
        warning: 3, // days
        critical: 7, // days
      },
    },
    calendar: {
      startDay: 'monday',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    contacts: {
      requiredFields: ['name', 'email', 'phone'],
      enableDuplicateCheck: true,
      duplicateCheckFields: ['email', 'phone'],
    },
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    googleCalendar: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: '',
    },
    microsoftCalendar: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: '',
    },
    whatsappBusiness: {
      enabled: false,
      apiKey: '',
      phoneNumberId: '',
    },
    twilioSms: {
      enabled: false,
      accountSid: '',
      authToken: '',
      phoneNumber: '',
    },
  });

  const [limitsSettings, setLimitsSettings] = useState({
    tier: {
      basic: {
        maxUsers: 3,
        maxSubAccounts: 1,
        maxLeads: 100,
        maxStorage: 5, // GB
        maxDocuments: 1000,
      },
      professional: {
        maxUsers: 10,
        maxSubAccounts: 5,
        maxLeads: 1000,
        maxStorage: 10, // GB
        maxDocuments: 5000,
      },
      enterprise: {
        maxUsers: -1, // unlimited
        maxSubAccounts: -1, // unlimited
        maxLeads: -1, // unlimited
        maxStorage: 100, // GB
        maxDocuments: -1, // unlimited
      },
    },
    global: {
      maxFileSize: 10, // MB
      allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
      maxBulkImportRows: 1000,
      apiRateLimit: 100, // requests per minute
    },
  });

  // Handle general settings form submission
  const handleSaveGeneralSettings = () => {
    toast({
      title: "Settings Saved",
      description: "General settings have been updated successfully.",
    });
  };

  // Handle email settings form submission
  const handleSaveEmailSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Email settings have been updated successfully.",
    });
  };

  // Handle notification settings form submission
  const handleSaveNotificationSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Notification settings have been updated successfully.",
    });
  };

  // Handle security settings form submission
  const handleSaveSecuritySettings = () => {
    toast({
      title: "Settings Saved",
      description: "Security settings have been updated successfully.",
    });
  };
  
  // Handle default values form submission
  const handleSaveDefaultSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Default values have been updated successfully.",
    });
  };

  // Handle integration settings form submission
  const handleSaveIntegrationSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Integration settings have been updated successfully.",
    });
  };

  // Handle limits settings form submission
  const handleSaveLimitsSettings = () => {
    toast({
      title: "Settings Saved",
      description: "System limits have been updated successfully.",
    });
  };

  return (
    <>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full mb-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="defaults" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Defaults</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4" />
              <span className="hidden md:inline">Limits</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic system settings and information.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      value={generalSettings.systemName}
                      onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={generalSettings.adminEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="defaultLanguage">Default Language</Label>
                    <select
                      id="defaultLanguage"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={generalSettings.defaultLanguage}
                      onChange={(e) => setGeneralSettings({...generalSettings, defaultLanguage: e.target.value})}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="defaultTimezone">Default Timezone</Label>
                    <select
                      id="defaultTimezone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={generalSettings.defaultTimezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, defaultTimezone: e.target.value})}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="termsUrl">Terms & Conditions URL</Label>
                    <Input
                      id="termsUrl"
                      value={generalSettings.termsUrl}
                      onChange={(e) => setGeneralSettings({...generalSettings, termsUrl: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="privacyUrl">Privacy Policy URL</Label>
                    <Input
                      id="privacyUrl"
                      value={generalSettings.privacyUrl}
                      onChange={(e) => setGeneralSettings({...generalSettings, privacyUrl: e.target.value})}
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable this when performing system updates.</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                    />
                  </div>
                  
                  {generalSettings.maintenanceMode && (
                    <div className="grid gap-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        id="maintenanceMessage"
                        value={generalSettings.maintenanceMessage}
                        onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMessage: e.target.value})}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveGeneralSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Email Settings Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure how the system sends emails.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpEncryption">Encryption</Label>
                    <select
                      id="smtpEncryption"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={emailSettings.smtpEncryption}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpEncryption: e.target.value})}
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="emailFromName">From Name</Label>
                    <Input
                      id="emailFromName"
                      value={emailSettings.emailFromName}
                      onChange={(e) => setEmailSettings({...emailSettings, emailFromName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailFromAddress">From Email Address</Label>
                    <Input
                      id="emailFromAddress"
                      type="email"
                      value={emailSettings.emailFromAddress}
                      onChange={(e) => setEmailSettings({...emailSettings, emailFromAddress: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailReplyToAddress">Reply-To Email Address</Label>
                    <Input
                      id="emailReplyToAddress"
                      type="email"
                      value={emailSettings.emailReplyToAddress}
                      onChange={(e) => setEmailSettings({...emailSettings, emailReplyToAddress: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailFooter">Default Email Footer</Label>
                    <Input
                      id="emailFooter"
                      value={emailSettings.emailFooter}
                      onChange={(e) => setEmailSettings({...emailSettings, emailFooter: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Test Connection</Button>
                <Button onClick={handleSaveEmailSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system notifications and alerts.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email.</p>
                    </div>
                    <Switch
                      id="enableEmailNotifications"
                      checked={notificationSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enableEmailNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableSmsNotifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via SMS.</p>
                    </div>
                    <Switch
                      id="enableSmsNotifications"
                      checked={notificationSettings.enableSmsNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enableSmsNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableBrowserNotifications">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">Display browser notifications.</p>
                    </div>
                    <Switch
                      id="enableBrowserNotifications"
                      checked={notificationSettings.enableBrowserNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enableBrowserNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableSystemAlerts">System Alerts</Label>
                      <p className="text-sm text-muted-foreground">Send admin alerts for system issues.</p>
                    </div>
                    <Switch
                      id="enableSystemAlerts"
                      checked={notificationSettings.enableSystemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enableSystemAlerts: checked})}
                    />
                  </div>
                  
                  {notificationSettings.enableSystemAlerts && (
                    <div className="grid gap-2">
                      <Label htmlFor="alertsEmailAddress">Alerts Email Address</Label>
                      <Input
                        id="alertsEmailAddress"
                        type="email"
                        value={notificationSettings.alertsEmailAddress}
                        onChange={(e) => setNotificationSettings({...notificationSettings, alertsEmailAddress: e.target.value})}
                      />
                    </div>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dailyDigest">Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">Send a daily summary of activities.</p>
                    </div>
                    <Switch
                      id="dailyDigest"
                      checked={notificationSettings.dailyDigest}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, dailyDigest: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReport">Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">Send a weekly summary of performance metrics.</p>
                    </div>
                    <Switch
                      id="weeklyReport"
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReport: checked})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Settings Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure system security and access controls.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="forceStrongPasswords">Strong Passwords</Label>
                      <p className="text-sm text-muted-foreground">Require strong passwords for all users.</p>
                    </div>
                    <Switch
                      id="forceStrongPasswords"
                      checked={securitySettings.forceStrongPasswords}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, forceStrongPasswords: checked})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="passwordExpiryDays">Password Expiry (Days)</Label>
                    <Input
                      id="passwordExpiryDays"
                      type="number"
                      value={securitySettings.passwordExpiryDays}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiryDays: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lockoutDurationMinutes">Lockout Duration (Minutes)</Label>
                      <Input
                        id="lockoutDurationMinutes"
                        type="number"
                        value={securitySettings.lockoutDurationMinutes}
                        onChange={(e) => setSecuritySettings({...securitySettings, lockoutDurationMinutes: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableTwoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for all users.</p>
                    </div>
                    <Switch
                      id="enableTwoFactor"
                      checked={securitySettings.enableTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableTwoFactor: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ipRestriction">IP Restriction</Label>
                      <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses.</p>
                    </div>
                    <Switch
                      id="ipRestriction"
                      checked={securitySettings.ipRestriction}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, ipRestriction: checked})}
                    />
                  </div>
                  
                  {securitySettings.ipRestriction && (
                    <div className="grid gap-2">
                      <Label htmlFor="allowedIpAddresses">Allowed IP Addresses</Label>
                      <Textarea
                        id="allowedIpAddresses"
                        value={securitySettings.allowedIpAddresses}
                        onChange={(e) => setSecuritySettings({...securitySettings, allowedIpAddresses: e.target.value})}
                        placeholder="Enter IP addresses separated by commas (e.g. 192.168.1.1, 10.0.0.1)"
                        rows={3}
                      />
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sessionTimeoutMinutes">Session Timeout (Minutes)</Label>
                    <Input
                      id="sessionTimeoutMinutes"
                      type="number"
                      value={securitySettings.sessionTimeoutMinutes}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableApiAccess">API Access</Label>
                      <p className="text-sm text-muted-foreground">Allow API access for integrations.</p>
                    </div>
                    <Switch
                      id="enableApiAccess"
                      checked={securitySettings.enableApiAccess}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableApiAccess: checked})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveSecuritySettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Default Values Tab */}
          <TabsContent value="defaults">
            <Card>
              <CardHeader>
                <CardTitle>Default Values</CardTitle>
                <CardDescription>Configure default settings for different modules.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="leads" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="leads" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Leads</span>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Tasks</span>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Calendar</span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Contacts</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Leads Defaults */}
                  <TabsContent value="leads">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="defaultLeadStatus">Default Lead Status</Label>
                        <select
                          id="defaultLeadStatus"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={defaultSettings.leads.defaultStatus}
                          onChange={(e) => setDefaultSettings({...defaultSettings, leads: {...defaultSettings.leads, defaultStatus: e.target.value}})}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="follow_up">Follow Up</option>
                          <option value="interested">Interested</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="defaultFollowUpDays">Default Follow-Up Days</Label>
                        <Input
                          id="defaultFollowUpDays"
                          type="number"
                          value={defaultSettings.leads.defaultFollowUpDays}
                          onChange={(e) => setDefaultSettings({...defaultSettings, leads: {...defaultSettings.leads, defaultFollowUpDays: parseInt(e.target.value)}})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoAssignment">Auto Assignment</Label>
                          <p className="text-sm text-muted-foreground">Automatically assign new leads to users.</p>
                        </div>
                        <Switch
                          id="autoAssignment"
                          checked={defaultSettings.leads.autoAssignment}
                          onCheckedChange={(checked) => setDefaultSettings({...defaultSettings, leads: {...defaultSettings.leads, autoAssignment: checked}})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="requireNotes">Require Notes on Status Change</Label>
                          <p className="text-sm text-muted-foreground">Require users to add notes when changing lead status.</p>
                        </div>
                        <Switch
                          id="requireNotes"
                          checked={defaultSettings.leads.requireNotes}
                          onCheckedChange={(checked) => setDefaultSettings({...defaultSettings, leads: {...defaultSettings.leads, requireNotes: checked}})}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Tasks Defaults */}
                  <TabsContent value="tasks">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="defaultReminderHours">Default Reminder (Hours Before Task)</Label>
                        <Input
                          id="defaultReminderHours"
                          type="number"
                          value={defaultSettings.tasks.defaultReminderHours}
                          onChange={(e) => setDefaultSettings({...defaultSettings, tasks: {...defaultSettings.tasks, defaultReminderHours: parseInt(e.target.value)}})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoCloseCompletedTasks">Auto-Close Completed Tasks</Label>
                          <p className="text-sm text-muted-foreground">Automatically close tasks when marked as completed.</p>
                        </div>
                        <Switch
                          id="autoCloseCompletedTasks"
                          checked={defaultSettings.tasks.autoCloseCompletedTasks}
                          onCheckedChange={(checked) => setDefaultSettings({...defaultSettings, tasks: {...defaultSettings.tasks, autoCloseCompletedTasks: checked}})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Task Aging Thresholds (Days)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="taskAgingWarning">Warning</Label>
                            <Input
                              id="taskAgingWarning"
                              type="number"
                              value={defaultSettings.tasks.taskAging.warning}
                              onChange={(e) => setDefaultSettings({
                                ...defaultSettings, 
                                tasks: {
                                  ...defaultSettings.tasks, 
                                  taskAging: {
                                    ...defaultSettings.tasks.taskAging,
                                    warning: parseInt(e.target.value)
                                  }
                                }
                              })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="taskAgingCritical">Critical</Label>
                            <Input
                              id="taskAgingCritical"
                              type="number"
                              value={defaultSettings.tasks.taskAging.critical}
                              onChange={(e) => setDefaultSettings({
                                ...defaultSettings, 
                                tasks: {
                                  ...defaultSettings.tasks, 
                                  taskAging: {
                                    ...defaultSettings.tasks.taskAging,
                                    critical: parseInt(e.target.value)
                                  }
                                }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Calendar Defaults */}
                  <TabsContent value="calendar">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDay">Week Start Day</Label>
                        <select
                          id="startDay"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={defaultSettings.calendar.startDay}
                          onChange={(e) => setDefaultSettings({...defaultSettings, calendar: {...defaultSettings.calendar, startDay: e.target.value}})}
                        >
                          <option value="sunday">Sunday</option>
                          <option value="monday">Monday</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                          <Input
                            id="workingHoursStart"
                            type="time"
                            value={defaultSettings.calendar.workingHoursStart}
                            onChange={(e) => setDefaultSettings({...defaultSettings, calendar: {...defaultSettings.calendar, workingHoursStart: e.target.value}})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                          <Input
                            id="workingHoursEnd"
                            type="time"
                            value={defaultSettings.calendar.workingHoursEnd}
                            onChange={(e) => setDefaultSettings({...defaultSettings, calendar: {...defaultSettings.calendar, workingHoursEnd: e.target.value}})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Working Days</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`workingDay-${day}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={defaultSettings.calendar.workingDays.includes(day)}
                                onChange={(e) => {
                                  const workingDays = e.target.checked
                                    ? [...defaultSettings.calendar.workingDays, day]
                                    : defaultSettings.calendar.workingDays.filter(d => d !== day);
                                  setDefaultSettings({
                                    ...defaultSettings,
                                    calendar: {...defaultSettings.calendar, workingDays}
                                  });
                                }}
                              />
                              <Label htmlFor={`workingDay-${day}`} className="capitalize">{day}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Contacts Defaults */}
                  <TabsContent value="contacts">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Required Fields</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['name', 'email', 'phone', 'company', 'address', 'city', 'state', 'country'].map((field) => (
                            <div key={field} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`requiredField-${field}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={defaultSettings.contacts.requiredFields.includes(field)}
                                onChange={(e) => {
                                  const requiredFields = e.target.checked
                                    ? [...defaultSettings.contacts.requiredFields, field]
                                    : defaultSettings.contacts.requiredFields.filter(f => f !== field);
                                  setDefaultSettings({
                                    ...defaultSettings,
                                    contacts: {...defaultSettings.contacts, requiredFields}
                                  });
                                }}
                              />
                              <Label htmlFor={`requiredField-${field}`} className="capitalize">{field}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="enableDuplicateCheck">Duplicate Contact Check</Label>
                          <p className="text-sm text-muted-foreground">Check for duplicate contacts during creation.</p>
                        </div>
                        <Switch
                          id="enableDuplicateCheck"
                          checked={defaultSettings.contacts.enableDuplicateCheck}
                          onCheckedChange={(checked) => setDefaultSettings({...defaultSettings, contacts: {...defaultSettings.contacts, enableDuplicateCheck: checked}})}
                        />
                      </div>
                      
                      {defaultSettings.contacts.enableDuplicateCheck && (
                        <div className="space-y-2">
                          <Label>Duplicate Check Fields</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {['email', 'phone', 'name', 'company'].map((field) => (
                              <div key={field} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`duplicateField-${field}`}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={defaultSettings.contacts.duplicateCheckFields.includes(field)}
                                  onChange={(e) => {
                                    const duplicateCheckFields = e.target.checked
                                      ? [...defaultSettings.contacts.duplicateCheckFields, field]
                                      : defaultSettings.contacts.duplicateCheckFields.filter(f => f !== field);
                                    setDefaultSettings({
                                      ...defaultSettings,
                                      contacts: {...defaultSettings.contacts, duplicateCheckFields}
                                    });
                                  }}
                                />
                                <Label htmlFor={`duplicateField-${field}`} className="capitalize">{field}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveDefaultSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>Configure third-party service integrations.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Calendar</span>
                    </TabsTrigger>
                    <TabsTrigger value="messaging" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Messaging</span>
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      <span>Storage</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Calendar Integrations */}
                  <TabsContent value="calendar">
                    <div className="grid gap-6">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-primary/10 text-primary">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            </div>
                            <div>
                              <h3 className="font-medium">Google Calendar</h3>
                              <p className="text-sm text-muted-foreground">Sync events with Google Calendar</p>
                            </div>
                          </div>
                          <Switch
                            id="googleCalendarEnabled"
                            checked={integrationSettings.googleCalendar.enabled}
                            onCheckedChange={(checked) => setIntegrationSettings({
                              ...integrationSettings,
                              googleCalendar: {...integrationSettings.googleCalendar, enabled: checked}
                            })}
                          />
                        </div>
                        
                        {integrationSettings.googleCalendar.enabled && (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="googleClientId">Client ID</Label>
                              <Input
                                id="googleClientId"
                                value={integrationSettings.googleCalendar.clientId}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  googleCalendar: {...integrationSettings.googleCalendar, clientId: e.target.value}
                                })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="googleClientSecret">Client Secret</Label>
                              <Input
                                id="googleClientSecret"
                                type="password"
                                value={integrationSettings.googleCalendar.clientSecret}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  googleCalendar: {...integrationSettings.googleCalendar, clientSecret: e.target.value}
                                })}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="googleRedirectUri">Redirect URI</Label>
                              <Input
                                id="googleRedirectUri"
                                value={integrationSettings.googleCalendar.redirectUri}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  googleCalendar: {...integrationSettings.googleCalendar, redirectUri: e.target.value}
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-blue-100 text-blue-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            </div>
                            <div>
                              <h3 className="font-medium">Microsoft Calendar</h3>
                              <p className="text-sm text-muted-foreground">Sync events with Microsoft Calendar</p>
                            </div>
                          </div>
                          <Switch
                            id="microsoftCalendarEnabled"
                            checked={integrationSettings.microsoftCalendar.enabled}
                            onCheckedChange={(checked) => setIntegrationSettings({
                              ...integrationSettings,
                              microsoftCalendar: {...integrationSettings.microsoftCalendar, enabled: checked}
                            })}
                          />
                        </div>
                        
                        {integrationSettings.microsoftCalendar.enabled && (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="microsoftClientId">Client ID</Label>
                              <Input
                                id="microsoftClientId"
                                value={integrationSettings.microsoftCalendar.clientId}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  microsoftCalendar: {...integrationSettings.microsoftCalendar, clientId: e.target.value}
                                })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="microsoftClientSecret">Client Secret</Label>
                              <Input
                                id="microsoftClientSecret"
                                type="password"
                                value={integrationSettings.microsoftCalendar.clientSecret}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  microsoftCalendar: {...integrationSettings.microsoftCalendar, clientSecret: e.target.value}
                                })}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="microsoftRedirectUri">Redirect URI</Label>
                              <Input
                                id="microsoftRedirectUri"
                                value={integrationSettings.microsoftCalendar.redirectUri}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  microsoftCalendar: {...integrationSettings.microsoftCalendar, redirectUri: e.target.value}
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Messaging Integrations */}
                  <TabsContent value="messaging">
                    <div className="grid gap-6">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-green-100 text-green-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <div>
                              <h3 className="font-medium">WhatsApp Business API</h3>
                              <p className="text-sm text-muted-foreground">Connect to WhatsApp Business API</p>
                            </div>
                          </div>
                          <Switch
                            id="whatsappEnabled"
                            checked={integrationSettings.whatsappBusiness.enabled}
                            onCheckedChange={(checked) => setIntegrationSettings({
                              ...integrationSettings,
                              whatsappBusiness: {...integrationSettings.whatsappBusiness, enabled: checked}
                            })}
                          />
                        </div>
                        
                        {integrationSettings.whatsappBusiness.enabled && (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="whatsappApiKey">API Key</Label>
                              <Input
                                id="whatsappApiKey"
                                value={integrationSettings.whatsappBusiness.apiKey}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  whatsappBusiness: {...integrationSettings.whatsappBusiness, apiKey: e.target.value}
                                })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
                              <Input
                                id="whatsappPhoneNumberId"
                                value={integrationSettings.whatsappBusiness.phoneNumberId}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  whatsappBusiness: {...integrationSettings.whatsappBusiness, phoneNumberId: e.target.value}
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-red-100 text-red-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <div>
                              <h3 className="font-medium">Twilio SMS</h3>
                              <p className="text-sm text-muted-foreground">Connect to Twilio for SMS messaging</p>
                            </div>
                          </div>
                          <Switch
                            id="twilioEnabled"
                            checked={integrationSettings.twilioSms.enabled}
                            onCheckedChange={(checked) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioSms: {...integrationSettings.twilioSms, enabled: checked}
                            })}
                          />
                        </div>
                        
                        {integrationSettings.twilioSms.enabled && (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="twilioAccountSid">Account SID</Label>
                              <Input
                                id="twilioAccountSid"
                                value={integrationSettings.twilioSms.accountSid}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  twilioSms: {...integrationSettings.twilioSms, accountSid: e.target.value}
                                })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="twilioAuthToken">Auth Token</Label>
                              <Input
                                id="twilioAuthToken"
                                type="password"
                                value={integrationSettings.twilioSms.authToken}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  twilioSms: {...integrationSettings.twilioSms, authToken: e.target.value}
                                })}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="twilioPhoneNumber">Phone Number</Label>
                              <Input
                                id="twilioPhoneNumber"
                                value={integrationSettings.twilioSms.phoneNumber}
                                onChange={(e) => setIntegrationSettings({
                                  ...integrationSettings,
                                  twilioSms: {...integrationSettings.twilioSms, phoneNumber: e.target.value}
                                })}
                                placeholder="+1234567890"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Storage Integrations */}
                  <TabsContent value="storage">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Amazon S3 (Document Storage)</h3>
                        <p className="text-sm text-muted-foreground mb-4">Configure on the AWS Configuration page.</p>
                        <Button variant="outline" className="w-full">
                          Go to AWS Configuration
                        </Button>
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Vimeo (Video Storage)</h3>
                        <p className="text-sm text-muted-foreground mb-4">Configure on the Video Configuration page.</p>
                        <Button variant="outline" className="w-full">
                          Go to Video Configuration
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveIntegrationSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* System Limits Tab */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>System Limits</CardTitle>
                <CardDescription>Configure system limits and restrictions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tier" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="tier">
                      Subscription Tier Limits
                    </TabsTrigger>
                    <TabsTrigger value="global">
                      Global System Limits
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Tier Limits */}
                  <TabsContent value="tier">
                    <div className="space-y-6">
                      {Object.entries(limitsSettings.tier).map(([tierName, tierLimits]) => (
                        <div key={tierName} className="rounded-lg border p-4">
                          <h3 className="font-medium mb-3 capitalize">{tierName} Tier Limits</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor={`${tierName}MaxUsers`}>Max Users</Label>
                              <Input
                                id={`${tierName}MaxUsers`}
                                type="number"
                                value={tierLimits.maxUsers === -1 ? "Unlimited" : tierLimits.maxUsers}
                                onChange={(e) => {
                                  const value = e.target.value === "Unlimited" ? -1 : parseInt(e.target.value);
                                  setLimitsSettings({
                                    ...limitsSettings,
                                    tier: {
                                      ...limitsSettings.tier,
                                      [tierName]: {
                                        ...tierLimits,
                                        maxUsers: value
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`${tierName}MaxSubAccounts`}>Max Sub-Accounts</Label>
                              <Input
                                id={`${tierName}MaxSubAccounts`}
                                type="number"
                                value={tierLimits.maxSubAccounts === -1 ? "Unlimited" : tierLimits.maxSubAccounts}
                                onChange={(e) => {
                                  const value = e.target.value === "Unlimited" ? -1 : parseInt(e.target.value);
                                  setLimitsSettings({
                                    ...limitsSettings,
                                    tier: {
                                      ...limitsSettings.tier,
                                      [tierName]: {
                                        ...tierLimits,
                                        maxSubAccounts: value
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`${tierName}MaxLeads`}>Max Leads</Label>
                              <Input
                                id={`${tierName}MaxLeads`}
                                type="number"
                                value={tierLimits.maxLeads === -1 ? "Unlimited" : tierLimits.maxLeads}
                                onChange={(e) => {
                                  const value = e.target.value === "Unlimited" ? -1 : parseInt(e.target.value);
                                  setLimitsSettings({
                                    ...limitsSettings,
                                    tier: {
                                      ...limitsSettings.tier,
                                      [tierName]: {
                                        ...tierLimits,
                                        maxLeads: value
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`${tierName}MaxStorage`}>Max Storage (GB)</Label>
                              <Input
                                id={`${tierName}MaxStorage`}
                                type="number"
                                value={tierLimits.maxStorage === -1 ? "Unlimited" : tierLimits.maxStorage}
                                onChange={(e) => {
                                  const value = e.target.value === "Unlimited" ? -1 : parseInt(e.target.value);
                                  setLimitsSettings({
                                    ...limitsSettings,
                                    tier: {
                                      ...limitsSettings.tier,
                                      [tierName]: {
                                        ...tierLimits,
                                        maxStorage: value
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`${tierName}MaxDocuments`}>Max Documents</Label>
                              <Input
                                id={`${tierName}MaxDocuments`}
                                type="number"
                                value={tierLimits.maxDocuments === -1 ? "Unlimited" : tierLimits.maxDocuments}
                                onChange={(e) => {
                                  const value = e.target.value === "Unlimited" ? -1 : parseInt(e.target.value);
                                  setLimitsSettings({
                                    ...limitsSettings,
                                    tier: {
                                      ...limitsSettings.tier,
                                      [tierName]: {
                                        ...tierLimits,
                                        maxDocuments: value
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {/* Global Limits */}
                  <TabsContent value="global">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                        <Input
                          id="maxFileSize"
                          type="number"
                          value={limitsSettings.global.maxFileSize}
                          onChange={(e) => setLimitsSettings({
                            ...limitsSettings,
                            global: {
                              ...limitsSettings.global,
                              maxFileSize: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                        <Input
                          id="allowedFileTypes"
                          value={limitsSettings.global.allowedFileTypes.join(', ')}
                          onChange={(e) => setLimitsSettings({
                            ...limitsSettings,
                            global: {
                              ...limitsSettings.global,
                              allowedFileTypes: e.target.value.split(',').map(type => type.trim())
                            }
                          })}
                          placeholder="pdf, doc, docx, xls, xlsx, jpg, jpeg, png"
                        />
                        <p className="text-xs text-muted-foreground">Comma-separated list of file extensions</p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="maxBulkImportRows">Max Bulk Import Rows</Label>
                        <Input
                          id="maxBulkImportRows"
                          type="number"
                          value={limitsSettings.global.maxBulkImportRows}
                          onChange={(e) => setLimitsSettings({
                            ...limitsSettings,
                            global: {
                              ...limitsSettings.global,
                              maxBulkImportRows: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="apiRateLimit">API Rate Limit (requests/minute)</Label>
                        <Input
                          id="apiRateLimit"
                          type="number"
                          value={limitsSettings.global.apiRateLimit}
                          onChange={(e) => setLimitsSettings({
                            ...limitsSettings,
                            global: {
                              ...limitsSettings.global,
                              apiRateLimit: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveLimitsSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}