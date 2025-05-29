import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

// Input validation schemas
const notificationPreferenceSchema = z.object({
  type: z.enum(['lead_created', 'lead_status_change', 'lead_assigned', 'task_due', 'message_received', 'system']),
  channels: z.array(z.enum(['in_app', 'email', 'sms', 'push', 'whatsapp'])),
  enabled: z.boolean()
});

// Create router
export const notificationRouter = Router();

// Get all notifications for the current user
notificationRouter.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await storage.getNotifications(req.user.id);
    return res.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
});

// Get notification preferences for the current user
notificationRouter.get('/preferences', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // For demonstration purposes, we'll return default preferences
    // In a real app, these would be fetched from the database
    const defaultPreferences = [
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
    
    return res.json(defaultPreferences);
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch notification preferences' });
  }
});

// Update notification preference
notificationRouter.patch('/preferences', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const validationResult = notificationPreferenceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid notification preference', 
        errors: validationResult.error.issues 
      });
    }

    const preference = validationResult.data;
    
    // Update notification preference in the database
    // For now, we'll just return success
    return res.json({ message: 'Notification preference updated successfully', preference });
  } catch (error: any) {
    console.error('Error updating notification preference:', error);
    return res.status(500).json({ message: error.message || 'Failed to update notification preference' });
  }
});

// Mark a notification as read
notificationRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await storage.markNotificationAsRead(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: error.message || 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
notificationRouter.patch('/read-all', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await storage.markAllNotificationsAsRead(req.user.id);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: error.message || 'Failed to mark all notifications as read' });
  }
});

export default notificationRouter;