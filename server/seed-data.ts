import { storage } from "./storage";

// Function to seed initial data for the application
export async function seedInitialData() {
  console.log("Seeding initial data...");
  
  try {
    // Check if we already have team members
    const existingUsers = await storage.getUsersBySubAccount(1);
    
    // Only seed if we don't have enough team members
    if (existingUsers.length < 3) {
      console.log("Adding sample team members...");
      
      // Add sample team members if they don't exist
      if (!existingUsers.find(user => user.username === "sarah")) {
        await storage.createUser({
          username: "sarah",
          password: "password",
          name: "Sarah Johnson",
          email: "sarah@example.com",
          role: "agency_admin",
          subAccountId: 1,
          avatarUrl: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff",
          phone: "+1 (555) 234-5678",
          position: "Sales Director",
          department: "Sales",
          notifications: {
            email: true,
            browser: true,
            sms: true,
            leads: true,
            marketing: false,
            system: true
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
        });
      }
      
      if (!existingUsers.find(user => user.username === "michael")) {
        await storage.createUser({
          username: "michael",
          password: "password",
          name: "Michael Chen",
          email: "michael@example.com",
          role: "client_admin",
          subAccountId: 1,
          avatarUrl: "https://ui-avatars.com/api/?name=Michael+Chen&background=3B82F6&color=fff",
          phone: "+1 (555) 345-6789",
          position: "Marketing Manager",
          department: "Marketing",
          notifications: {
            email: true,
            browser: false,
            sms: false,
            leads: true,
            marketing: true,
            system: false
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
        });
      }
      
      if (!existingUsers.find(user => user.username === "jessica")) {
        await storage.createUser({
          username: "jessica",
          password: "password",
          name: "Jessica Williams",
          email: "jessica@example.com",
          role: "client_user",
          subAccountId: 1,
          avatarUrl: "https://ui-avatars.com/api/?name=Jessica+Williams&background=EC4899&color=fff",
          phone: "+1 (555) 456-7890",
          position: "Lead Developer",
          department: "Engineering",
          notifications: {
            email: true,
            browser: true,
            sms: false,
            leads: false,
            marketing: false,
            system: true
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
        });
      }
    }
    
    // Ensure we have a Default Account with real data
    const subAccount = await storage.getSubAccount(1);
    if (subAccount) {
      await storage.updateSubAccount(1, {
        contactEmail: "contact@leadtrackpro.com",
        address: "123 Business Ave",
        city: "San Francisco",
        state: "CA",
        zipCode: "94107",
        country: "United States",
        phone: "+1 (555) 123-4567",
        website: "https://leadtrackpro.com",
      });
    }
    
    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}