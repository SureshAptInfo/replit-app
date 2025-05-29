import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define notification types
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms' | 'whatsapp';

export interface NotificationPreference {
  type: string;
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference[];
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  updatePreference: (preference: NotificationPreference) => void;
  isUpdatingPreference: boolean;
  notificationPermissionStatus: NotificationPermission | null;
  requestPushPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission | null>(null);
  
  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch preferences
  const { data: preferences = [] } = useQuery<NotificationPreference[]>({
    queryKey: ['/api/notifications/preferences'],
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/notifications/${id}/read`);
      return response.json();
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/notifications/read-all');
      return response.json();
    },
  });
  
  // Update notification preference
  const updatePreferenceMutation = useMutation({
    mutationFn: async (preference: NotificationPreference) => {
      const response = await apiRequest('PATCH', '/api/notifications/preferences', preference);
      return response.json();
    },
  });
  
  const queryClient = useQueryClient();
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Check push notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermissionStatus(Notification.permission);
    }
  }, []);
  
  // Request push notification permission
  const requestPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermissionStatus(permission);
        
        if (permission === 'granted') {
          toast({
            title: 'Push notifications enabled',
            description: 'You will now receive push notifications',
          });
        } else {
          toast({
            title: 'Push notifications not enabled',
            description: 'You will not receive push notifications',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast({
          title: 'Error enabling push notifications',
          description: 'There was an error enabling push notifications',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Invalidate notifications query after mutations
  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  };
  
  // Mark notification as read
  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id, {
      onSuccess: () => {
        invalidateNotifications();
      },
      onError: (error) => {
        console.error('Error marking notification as read:', error);
        toast({
          title: 'Error',
          description: 'Failed to mark notification as read',
          variant: 'destructive',
        });
      },
    });
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        invalidateNotifications();
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      },
      onError: (error) => {
        console.error('Error marking all notifications as read:', error);
        toast({
          title: 'Error',
          description: 'Failed to mark all notifications as read',
          variant: 'destructive',
        });
      },
    });
  };
  
  // Update notification preference
  const updatePreference = (preference: NotificationPreference) => {
    updatePreferenceMutation.mutate(preference, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
        toast({
          title: 'Success',
          description: 'Notification preferences updated',
        });
      },
      onError: (error) => {
        console.error('Error updating notification preference:', error);
        toast({
          title: 'Error',
          description: 'Failed to update notification preferences',
          variant: 'destructive',
        });
      },
    });
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        markAsRead,
        markAllAsRead,
        updatePreference,
        isUpdatingPreference: updatePreferenceMutation.isPending,
        notificationPermissionStatus,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};