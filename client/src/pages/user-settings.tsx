import React, { useState } from 'react';
import SidebarLayout from '@/components/layouts/sidebar-layout';
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
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  Upload,
  Mail,
  Smartphone,
  Bell as BellIcon,
  Lock,
  LogOut,
  Clock,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';

export default function UserSettings() {
  const { toast } = useToast();
  
  // Get current user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      return response.json();
    }
  });

  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    username: userData?.username || '',
    phone: userData?.phone || '',
    bio: userData?.bio || '',
    avatarUrl: userData?.avatarUrl || '',
    jobTitle: userData?.jobTitle || '',
    company: userData?.company || '',
    timeZone: userData?.timeZone || 'UTC',
    language: userData?.language || 'en',
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: userData?.twoFactorEnabled || false,
    showNewPassword: false,
    sessionTimeout: userData?.sessionTimeout || 60, // minutes
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: userData?.notifications?.email || true,
    smsNotifications: userData?.notifications?.sms || false,
    browserNotifications: userData?.notifications?.browser || true,
    newLeadNotifications: userData?.notifications?.newLead || true,
    taskDueNotifications: userData?.notifications?.taskDue || true,
    taskAssignedNotifications: userData?.notifications?.taskAssigned || true,
    leadStatusChangeNotifications: userData?.notifications?.leadStatusChange || true,
    dailySummaryNotifications: userData?.notifications?.dailySummary || false,
    weeklyReportNotifications: userData?.notifications?.weeklyReport || true,
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: userData?.appearance?.theme || 'light',
    fontSize: userData?.appearance?.fontSize || 'medium',
    compactView: userData?.appearance?.compactView || false,
    reduceAnimations: userData?.appearance?.reduceAnimations || false,
    dashboardLayout: userData?.appearance?.dashboardLayout || 'default',
    colorScheme: userData?.appearance?.colorScheme || 'default',
  });

  // Handle profile form submission
  const handleSaveProfile = () => {
    // Here you would normally submit to the server
    toast({
      title: "Profile Saved",
      description: "Your profile settings have been updated successfully.",
    });
  };

  // Handle password change
  const handleChangePassword = () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally submit to the server
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });

    // Reset password fields
    setSecuritySettings({
      ...securitySettings,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Handle notification settings change
  const handleSaveNotifications = () => {
    // Here you would normally submit to the server
    toast({
      title: "Notifications Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  // Handle appearance settings change
  const handleSaveAppearance = () => {
    // Here you would normally submit to the server
    toast({
      title: "Appearance Saved",
      description: "Your appearance settings have been updated.",
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileSettings({
            ...profileSettings,
            avatarUrl: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <SidebarLayout>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Settings</h1>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Appearance</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileSettings.avatarUrl} alt={profileSettings.name} />
                      <AvatarFallback>{profileSettings.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center">
                      <Label htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary hover:underline">
                        Change Avatar
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileSettings.name}
                          onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileSettings.username}
                          onChange={(e) => setProfileSettings({...profileSettings, username: e.target.value})}
                          placeholder="johndoe"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileSettings.email}
                          onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileSettings.phone}
                          onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={profileSettings.jobTitle}
                          onChange={(e) => setProfileSettings({...profileSettings, jobTitle: e.target.value})}
                          placeholder="Marketing Manager"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={profileSettings.company}
                          onChange={(e) => setProfileSettings({...profileSettings, company: e.target.value})}
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={profileSettings.bio}
                        onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                        placeholder="A short bio about yourself"
                      />
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={profileSettings.language}
                          onChange={(e) => setProfileSettings({...profileSettings, language: e.target.value})}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="timeZone">Time Zone</Label>
                        <select
                          id="timeZone"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={profileSettings.timeZone}
                          onChange={(e) => setProfileSettings({...profileSettings, timeZone: e.target.value})}
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
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Update your password and security preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={securitySettings.currentPassword}
                        onChange={(e) => setSecuritySettings({...securitySettings, currentPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={securitySettings.showNewPassword ? "text" : "password"}
                          value={securitySettings.newPassword}
                          onChange={(e) => setSecuritySettings({...securitySettings, newPassword: e.target.value})}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                          onClick={() => setSecuritySettings({...securitySettings, showNewPassword: !securitySettings.showNewPassword})}
                        >
                          {securitySettings.showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters and include a mix of letters, numbers, and symbols.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={securitySettings.confirmPassword}
                        onChange={(e) => setSecuritySettings({...securitySettings, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={!securitySettings.currentPassword || !securitySettings.newPassword || !securitySettings.confirmPassword}
                      className="w-full md:w-auto md:self-end"
                    >
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account.
                        </p>
                      </div>
                      <Switch
                        id="two-factor"
                        checked={securitySettings.twoFactorEnabled}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorEnabled: checked})}
                      />
                    </div>
                    
                    {securitySettings.twoFactorEnabled && (
                      <div className="rounded-lg border p-4 mt-2">
                        <p className="text-sm mb-4">
                          Two-factor authentication is enabled. You will be prompted for a verification code when signing in from a new device.
                        </p>
                        <Button variant="outline" size="sm">
                          Setup Authenticator App
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Session Settings</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min={5}
                        max={1440}
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your session will automatically end after this period of inactivity.
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" className="w-full md:w-auto">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out From All Other Devices
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save Security Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how and when you want to be notified.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Channels</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                        </div>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <Label htmlFor="sms-notifications">SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive text messages for important updates.</p>
                        </div>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <Label htmlFor="browser-notifications">Browser Notifications</Label>
                          <p className="text-sm text-muted-foreground">Show desktop notifications in your browser.</p>
                        </div>
                      </div>
                      <Switch
                        id="browser-notifications"
                        checked={notificationSettings.browserNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, browserNotifications: checked})}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Types</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="new-lead-notifications">New Lead</Label>
                          <p className="text-sm text-muted-foreground">When a new lead is added to the system.</p>
                        </div>
                        <Switch
                          id="new-lead-notifications"
                          checked={notificationSettings.newLeadNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newLeadNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="task-due-notifications">Task Due</Label>
                          <p className="text-sm text-muted-foreground">When a task is due or approaching its deadline.</p>
                        </div>
                        <Switch
                          id="task-due-notifications"
                          checked={notificationSettings.taskDueNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, taskDueNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="task-assigned-notifications">Task Assigned</Label>
                          <p className="text-sm text-muted-foreground">When a task is assigned to you.</p>
                        </div>
                        <Switch
                          id="task-assigned-notifications"
                          checked={notificationSettings.taskAssignedNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, taskAssignedNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="lead-status-change-notifications">Lead Status Change</Label>
                          <p className="text-sm text-muted-foreground">When a lead's status changes.</p>
                        </div>
                        <Switch
                          id="lead-status-change-notifications"
                          checked={notificationSettings.leadStatusChangeNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, leadStatusChangeNotifications: checked})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Summary Reports</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="daily-summary-notifications">Daily Summary</Label>
                          <p className="text-sm text-muted-foreground">Receive a daily summary of all activities.</p>
                        </div>
                        <Switch
                          id="daily-summary-notifications"
                          checked={notificationSettings.dailySummaryNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, dailySummaryNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-report-notifications">Weekly Report</Label>
                          <p className="text-sm text-muted-foreground">Receive a weekly performance and activity report.</p>
                        </div>
                        <Switch
                          id="weekly-report-notifications"
                          checked={notificationSettings.weeklyReportNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReportNotifications: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how the application looks and feels.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.theme === 'light' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'light'})}
                      >
                        <Sun className="h-6 w-6 mb-2" />
                        <span>Light</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.theme === 'dark' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'dark'})}
                      >
                        <Moon className="h-6 w-6 mb-2" />
                        <span>Dark</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.theme === 'system' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'system'})}
                      >
                        <span className="flex mb-2">
                          <Sun className="h-6 w-6" />
                          <Moon className="h-6 w-6" />
                        </span>
                        <span>System</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Text Size</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.fontSize === 'small' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, fontSize: 'small'})}
                      >
                        <span className="text-sm mb-2">Aa</span>
                        <span>Small</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.fontSize === 'medium' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, fontSize: 'medium'})}
                      >
                        <span className="text-base mb-2">Aa</span>
                        <span>Medium</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.fontSize === 'large' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, fontSize: 'large'})}
                      >
                        <span className="text-lg mb-2">Aa</span>
                        <span>Large</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Display Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="compact-view">Compact View</Label>
                          <p className="text-sm text-muted-foreground">Use a more compact layout with less whitespace.</p>
                        </div>
                        <Switch
                          id="compact-view"
                          checked={appearanceSettings.compactView}
                          onCheckedChange={(checked) => setAppearanceSettings({...appearanceSettings, compactView: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="reduce-animations">Reduce Animations</Label>
                          <p className="text-sm text-muted-foreground">Minimize motion effects in the interface.</p>
                        </div>
                        <Switch
                          id="reduce-animations"
                          checked={appearanceSettings.reduceAnimations}
                          onCheckedChange={(checked) => setAppearanceSettings({...appearanceSettings, reduceAnimations: checked})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dashboard Layout</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="dashboard-layout">Default Dashboard View</Label>
                      <select
                        id="dashboard-layout"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={appearanceSettings.dashboardLayout}
                        onChange={(e) => setAppearanceSettings({...appearanceSettings, dashboardLayout: e.target.value})}
                      >
                        <option value="default">Default</option>
                        <option value="compact">Compact</option>
                        <option value="detailed">Detailed</option>
                        <option value="performance">Performance Focus</option>
                        <option value="leads">Leads Focus</option>
                      </select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Color Scheme</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.colorScheme === 'default' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, colorScheme: 'default'})}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary mb-2" />
                        <span>Default</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.colorScheme === 'blue' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, colorScheme: 'blue'})}
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-500 mb-2" />
                        <span>Blue</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.colorScheme === 'green' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, colorScheme: 'green'})}
                      >
                        <div className="h-8 w-8 rounded-full bg-green-500 mb-2" />
                        <span>Green</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.colorScheme === 'purple' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, colorScheme: 'purple'})}
                      >
                        <div className="h-8 w-8 rounded-full bg-purple-500 mb-2" />
                        <span>Purple</span>
                      </div>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer flex flex-col items-center ${
                          appearanceSettings.colorScheme === 'orange' ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setAppearanceSettings({...appearanceSettings, colorScheme: 'orange'})}
                      >
                        <div className="h-8 w-8 rounded-full bg-orange-500 mb-2" />
                        <span>Orange</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveAppearance}>Save Appearance Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}