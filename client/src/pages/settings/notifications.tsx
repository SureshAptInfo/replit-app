import React from 'react';
import { Helmet } from 'react-helmet';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/layout/header';
import MobileNavigation from '@/components/shared/mobile-navigation';
import { 
  useNotifications, 
  NotificationPreference, 
  NotificationChannel 
} from '@/components/notifications/notification-provider';
import { 
  BellRing, 
  Mail, 
  MessageSquare, 
  Phone, 
  Radio 
} from 'lucide-react';

// Default notification preferences if none are set
const defaultPreferences: NotificationPreference[] = [
  {
    type: 'lead_created',
    channels: ['in_app', 'email'],
    enabled: true
  },
  {
    type: 'lead_status_change',
    channels: ['in_app', 'email'],
    enabled: true
  },
  {
    type: 'lead_assigned',
    channels: ['in_app', 'email', 'push'],
    enabled: true
  },
  {
    type: 'task_due',
    channels: ['in_app', 'email', 'push'],
    enabled: true
  },
  {
    type: 'message_received',
    channels: ['in_app', 'push', 'email'],
    enabled: true
  },
  {
    type: 'system',
    channels: ['in_app'],
    enabled: true
  }
];

// Notification type labels and descriptions
const notificationTypeInfo: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  lead_created: {
    title: 'New Leads',
    description: 'When a new lead is added to the system',
    icon: <BellRing className="h-5 w-5 text-blue-500" />
  },
  lead_status_change: {
    title: 'Lead Status Changes',
    description: 'When a lead\'s status is updated',
    icon: <Radio className="h-5 w-5 text-green-500" />
  },
  lead_assigned: {
    title: 'Lead Assignments',
    description: 'When a lead is assigned to you or your team',
    icon: <MessageSquare className="h-5 w-5 text-purple-500" />
  },
  task_due: {
    title: 'Task Reminders',
    description: 'When a task is due or approaching deadline',
    icon: <BellRing className="h-5 w-5 text-orange-500" />
  },
  message_received: {
    title: 'New Messages',
    description: 'When you receive a new message from a lead',
    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />
  },
  system: {
    title: 'System Notifications',
    description: 'Important system updates and announcements',
    icon: <Radio className="h-5 w-5 text-slate-500" />
  }
};

// Channel icons and labels
const channelInfo: Record<NotificationChannel, { label: string; icon: React.ReactNode }> = {
  in_app: {
    label: 'In-App',
    icon: <BellRing className="h-4 w-4" />
  },
  email: {
    label: 'Email',
    icon: <Mail className="h-4 w-4" />
  },
  push: {
    label: 'Push',
    icon: <Radio className="h-4 w-4" />
  },
  sms: {
    label: 'SMS',
    icon: <Phone className="h-4 w-4" />
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: <MessageSquare className="h-4 w-4" />
  }
};

export default function NotificationSettingsPage() {
  const { 
    preferences: savedPreferences = [], 
    updatePreference, 
    isUpdatingPreference,
    notificationPermissionStatus,
    requestPushPermission
  } = useNotifications();

  // Merge default preferences with saved preferences
  const preferences = defaultPreferences.map(defaultPref => {
    const savedPref = savedPreferences.find(p => p.type === defaultPref.type);
    return savedPref || defaultPref;
  });

  // Handle toggle for enabling/disabling notification types
  const handleToggleNotificationType = (type: string, enabled: boolean) => {
    const preference = preferences.find(p => p.type === type);
    if (preference) {
      updatePreference({
        ...preference,
        enabled
      });
    }
  };

  // Handle toggle for notification channels
  const handleToggleChannel = (type: string, channel: NotificationChannel, enabled: boolean) => {
    const preference = preferences.find(p => p.type === type);
    if (!preference) return;

    const updatedChannels = enabled
      ? [...preference.channels, channel]
      : preference.channels.filter(c => c !== channel);

    updatePreference({
      ...preference,
      channels: updatedChannels
    });
  };

  // Check if a channel is enabled for a notification type
  const isChannelEnabled = (type: string, channel: NotificationChannel): boolean => {
    const preference = preferences.find(p => p.type === type);
    return preference?.channels.includes(channel) || false;
  };

  // Check if push notifications are supported and enabled in the browser
  const isPushEnabled = notificationPermissionStatus === 'granted';
  const isPushDenied = notificationPermissionStatus === 'denied';
  const isPushNotSupported = typeof Notification === 'undefined';

  return (
    <>
      <Helmet>
        <title>Notification Settings | LeadTrackPro</title>
        <meta name="description" content="Customize your notification preferences" />
      </Helmet>

      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        <main className="flex-1 min-h-screen md:ml-0">
          <Header title="Settings" />
          
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl md:text-2xl font-heading font-semibold">Notification Settings</h1>
            </div>

            <div className="grid gap-6">
              {/* Push Notification Permission Card */}
              {!isPushNotSupported && !isPushEnabled && (
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
                  <CardHeader>
                    <CardTitle>Enable Push Notifications</CardTitle>
                    <CardDescription>
                      Get instant notifications even when you're not using the app
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {isPushDenied 
                            ? "Push notifications are blocked. Please update your browser settings to enable them."
                            : "Allow push notifications to get important updates in real-time."}
                        </p>
                      </div>
                      <Button 
                        onClick={requestPushPermission} 
                        disabled={isPushDenied || isUpdatingPreference}
                        className="relative overflow-hidden group"
                      >
                        <span className="relative z-10">Enable Push Notifications</span>
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notification Preferences Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Customize which notifications you receive and how they're delivered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="all">All Notifications</TabsTrigger>
                      <TabsTrigger value="channels">By Channel</TabsTrigger>
                    </TabsList>
                    
                    {/* All Notifications Tab */}
                    <TabsContent value="all">
                      <div className="space-y-6 mt-4">
                        {preferences.map((preference) => {
                          const typeInfo = notificationTypeInfo[preference.type];
                          return (
                            <div key={preference.type} className="flex flex-col gap-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">{typeInfo.icon}</div>
                                  <div>
                                    <h4 className="text-sm font-medium">{typeInfo.title}</h4>
                                    <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
                                    
                                    {/* Channel badges */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {preference.channels.map(channel => (
                                        <Badge 
                                          key={channel} 
                                          variant="secondary"
                                          className="flex items-center gap-1 px-1.5 py-0.5 text-xs"
                                        >
                                          {channelInfo[channel].icon}
                                          <span className="ml-1">{channelInfo[channel].label}</span>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center">
                                  <Switch 
                                    checked={preference.enabled} 
                                    onCheckedChange={(checked) => handleToggleNotificationType(preference.type, checked)}
                                    disabled={isUpdatingPreference}
                                  />
                                </div>
                              </div>
                              
                              {/* Channel toggles */}
                              <div className="ml-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(channelInfo).map(([channel, info]) => {
                                  const channelType = channel as NotificationChannel;
                                  // Skip push if not supported or denied
                                  if (channelType === 'push' && (isPushNotSupported || isPushDenied)) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div key={channel} className="flex items-center gap-2">
                                      <Switch 
                                        id={`${preference.type}-${channel}`}
                                        checked={isChannelEnabled(preference.type, channelType)}
                                        onCheckedChange={(checked) => 
                                          handleToggleChannel(preference.type, channelType, checked)
                                        }
                                        disabled={!preference.enabled || isUpdatingPreference}
                                      />
                                      <Label 
                                        htmlFor={`${preference.type}-${channel}`}
                                        className="flex items-center gap-1.5 text-sm cursor-pointer"
                                      >
                                        {info.icon}
                                        {info.label}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <Separator className="my-2" />
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                    
                    {/* By Channel Tab */}
                    <TabsContent value="channels">
                      <div className="space-y-6 mt-4">
                        {Object.entries(channelInfo).map(([channelKey, channelData]) => {
                          const channel = channelKey as NotificationChannel;
                          
                          // Skip push if not supported or denied
                          if (channel === 'push' && (isPushNotSupported || isPushDenied)) {
                            return null;
                          }
                          
                          return (
                            <div key={channelKey} className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  {channelData.icon}
                                </div>
                                <h3 className="text-md font-medium">{channelData.label} Notifications</h3>
                              </div>
                              
                              <div className="ml-10 space-y-3">
                                {preferences.map(preference => {
                                  const typeInfo = notificationTypeInfo[preference.type];
                                  return (
                                    <div key={preference.type} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div>{typeInfo.icon}</div>
                                        <span className="text-sm">{typeInfo.title}</span>
                                      </div>
                                      <Switch 
                                        checked={isChannelEnabled(preference.type, channel)}
                                        onCheckedChange={(checked) => 
                                          handleToggleChannel(preference.type, channel, checked)
                                        }
                                        disabled={!preference.enabled || isUpdatingPreference}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <Separator className="my-2" />
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <MobileNavigation />
        </main>
      </div>
    </>
  );
}