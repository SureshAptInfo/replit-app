import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // For development environment without auth, simulate authentication
  if (process.env.NODE_ENV === 'development') {
    // Check for a dev user in headers or query
    const devUserId = req.headers['x-dev-user-id'] || req.query.devUserId;
    
    if (devUserId) {
      storage.getUser(Number(devUserId))
        .then(user => {
          if (user) {
            (req as any).user = user;
            return next();
          }
          return res.status(401).json({ message: 'Unauthorized' });
        })
        .catch(err => {
          console.error('Error in dev authentication:', err);
          return res.status(401).json({ message: 'Unauthorized' });
        });
      return;
    }
    
    // Default dev user (for easy testing)
    req.user = {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'super_admin',
      subAccountId: 1
    };
    return next();
  }
  
  return res.status(401).json({ message: 'Unauthorized' });
}