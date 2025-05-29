import React from 'react';
import { Link } from 'wouter';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator, 
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Check, 
  Calendar, 
  Mail, 
  MessageSquare, 
  User, 
  Clock,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification } from '@/components/notifications/notification-provider';
import { useNotifications } from '@/components/notifications/notification-provider';
import { format, formatDistanceToNow } from 'date-fns';

// Component to render the notification icon that will appear in both headers
export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Format notification timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get notification type icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
      case 'lead_status_change':
      case 'lead_assigned':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'task_due':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'message_received':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'email_received':
        return <Mail className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-5 w-5 text-neutral-500" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center px-[5px] py-px rounded-full animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="font-heading">
            Notifications
          </DropdownMenuLabel>
          
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs flex gap-1 items-center text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead()}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((notification: Notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={cn(
                  "p-3 cursor-pointer transition-colors flex items-start gap-3 focus:bg-accent",
                  !notification.read && "bg-blue-50"
                )}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="p-2 rounded-full bg-muted flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight mb-1">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(notification.createdAt)}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Link href="/settings/notifications">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex gap-2 h-9 mt-1"
            >
              <Settings className="h-4 w-4" />
              <span>Notification Settings</span>
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}