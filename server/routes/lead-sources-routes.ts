import type { Request, Response, Express } from "express";
import { storage } from "../storage";

export function registerLeadSourcesRoutes(app: Express): void {
  // Get all lead sources for a sub-account
  app.get("/api/lead-sources", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = req.user as any;
      const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : user.subAccountId || 1;
      
      // For now, return a default set of lead sources
      // In a real database implementation, this would come from a lead_sources table
      const defaultSources = [
        "Website",
        "Facebook", 
        "Google Ads",
        "Referral",
        "Cold Call",
        "Email Campaign",
        "LinkedIn",
        "Trade Show"
      ];
      
      res.json(defaultSources);
    } catch (error: any) {
      console.error("Error fetching lead sources:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add a new lead source
  app.post("/api/lead-sources", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = req.user as any;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Source name is required" });
      }
      
      // For now, just return success
      // In a real database implementation, this would save to a lead_sources table
      console.log(`Adding new lead source: "${name}" for user: ${user.username}`);
      
      res.status(201).json({ 
        success: true, 
        message: `Lead source "${name}" added successfully`,
        source: name.trim()
      });
    } catch (error: any) {
      console.error("Error adding lead source:", error);
      res.status(500).json({ message: error.message });
    }
  });
}