import { Request, Response } from "express";
import { Express } from "express";
import { storage } from "../storage";

export function registerSettingsRoutes(app: Express) {
  // User settings endpoints
  app.get("/api/settings/user", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      
      // Get user with notifications preferences
      const userSettings = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        avatarUrl: user.avatarUrl,
        notifications: user.notifications || {
          email: true,
          browser: true,
          sms: false,
          leads: true,
          marketing: false,
          system: true
        }
      };
      
      res.json(userSettings);
    } catch (error: any) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/settings/user", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const userData = req.body;
      
      // Don't allow changing role through this endpoint
      delete userData.role;
      
      // Update the user
      const updatedUser = await storage.updateUser(user.id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        notifications: updatedUser.notifications
      });
    } catch (error: any) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Account settings endpoints
  app.get("/api/settings/account", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // Get the subaccount
      const subAccount = await storage.getSubAccount(subAccountId);
      if (!subAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Return account settings
      res.json({
        id: subAccount.id,
        name: subAccount.name,
        email: subAccount.contactEmail || "",
        logo: subAccount.logo,
        domain: subAccount.domain,
        favicon: subAccount.favicon,
        colorPrimary: subAccount.colorPrimary || "#6366F1",
        colorSecondary: subAccount.colorSecondary || "#4F46E5",
        address: subAccount.address,
        city: subAccount.city,
        state: subAccount.state,
        zip: subAccount.zipCode,
        country: subAccount.country,
        phone: subAccount.phone,
        website: subAccount.website
      });
    } catch (error: any) {
      console.error("Error fetching account settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/settings/account", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      const subAccountId = user.subAccountId || 1;
      
      // For this demo, let's allow all authenticated users to update account settings
      // Later we can restrict to specific roles if needed
      // Commented out the role restriction for now:
      /*
      if (user.role !== "agency_owner" && user.role !== "agency_admin" && user.role !== "client_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      */
      
      const accountData = req.body;
      
      // Map frontend fields to database fields
      const updateData: any = {
        name: accountData.name,
        contactEmail: accountData.email,
        logo: accountData.logo,
        domain: accountData.domain,
        favicon: accountData.favicon,
        colorPrimary: accountData.colorPrimary,
        colorSecondary: accountData.colorSecondary,
        address: accountData.address,
        city: accountData.city,
        state: accountData.state,
        zipCode: accountData.zip,
        country: accountData.country,
        phone: accountData.phone,
        website: accountData.website
      };
      
      // Update subaccount
      const updatedAccount = await storage.updateSubAccount(subAccountId, updateData);
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Return updated account with frontend field naming
      res.json({
        id: updatedAccount.id,
        name: updatedAccount.name,
        email: updatedAccount.contactEmail,
        logo: updatedAccount.logo,
        domain: updatedAccount.domain,
        favicon: updatedAccount.favicon,
        colorPrimary: updatedAccount.colorPrimary,
        colorSecondary: updatedAccount.colorSecondary,
        address: updatedAccount.address,
        city: updatedAccount.city,
        state: updatedAccount.state,
        zip: updatedAccount.zipCode,
        country: updatedAccount.country,
        phone: updatedAccount.phone,
        website: updatedAccount.website
      });
    } catch (error: any) {
      console.error("Error updating account settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
}