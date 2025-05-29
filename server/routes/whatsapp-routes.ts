import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { formatPhoneNumber, processWhatsAppWebhook, sendTextMessage, sendTemplateMessage, syncWhatsAppTemplates, verifyWhatsAppConnection } from "../services/whatsapp-service";
import { isAuthenticated } from "../middleware/auth-middleware";
import * as z from "zod";

const router = Router();

// Validation schema for WhatsApp connection
const whatsappConnectionSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  businessPhoneNumber: z.string().min(1, "Business phone number is required"),
  verifyToken: z.string().min(1, "Verify token is required"),
  subAccountId: z.number().int().positive("Sub Account ID is required"),
  lastVerified: z.string().optional(), // Allow optional timestamp from frontend
});

// Connect to WhatsApp Business API
router.post("/connect", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = whatsappConnectionSchema.parse(req.body);
    
    // Get current user ID for tracking who made this integration
    const userId = (req.user as any)?.id || 1;
    
    // Test the credentials before saving them
    console.log("Testing WhatsApp credentials before saving...");
    try {
      // Make a simple API call to validate the credentials
      const testResponse = await fetch(`https://graph.facebook.com/v18.0/${validatedData.businessPhoneNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validatedData.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!testResponse.ok) {
        const errorData = await testResponse.text();
        console.error("WhatsApp credential validation failed:", errorData);
        return res.status(400).json({
          success: false,
          message: "Invalid WhatsApp credentials. Please check your System User Token and Phone Number ID.",
          details: `API validation failed with status ${testResponse.status}`
        });
      }
      
      console.log("WhatsApp credentials validated successfully");
    } catch (credentialError) {
      console.error("Error validating WhatsApp credentials:", credentialError);
      return res.status(400).json({
        success: false,
        message: "Unable to validate WhatsApp credentials. Please check your internet connection and try again.",
        details: credentialError.message
      });
    }
    
    // Check if integration already exists
    let integration = await storage.getIntegrationByType("whatsapp", validatedData.subAccountId);
    
    // If integration exists, update it
    if (integration) {
      integration = await storage.updateIntegration(integration.id, {
        config: {
          apiKey: validatedData.apiKey,
          businessPhoneNumber: validatedData.businessPhoneNumber,
          verifyToken: validatedData.verifyToken,
          connected: true
        }
      });
    } else {
      // Create new integration
      integration = await storage.createIntegration({
        type: "whatsapp",
        name: "WhatsApp Business API",
        subAccountId: validatedData.subAccountId,
        config: {
          apiKey: validatedData.apiKey,
          businessPhoneNumber: validatedData.businessPhoneNumber,
          verifyToken: validatedData.verifyToken,
          connected: true
        },
        active: true,
        createdBy: userId
      });
    }

    // Process environment variables if they exist
    process.env.WHATSAPP_API_KEY = validatedData.apiKey;
    process.env.WHATSAPP_BUSINESS_PHONE_NUMBER = validatedData.businessPhoneNumber;
    process.env.WHATSAPP_VERIFY_TOKEN = validatedData.verifyToken;
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: "WhatsApp Business API connected successfully",
      integration: integration || null
    });
  } catch (error) {
    console.error("WhatsApp connection error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data provided", 
        errors: error.errors 
      });
    }
    
    // Provide more specific error information for debugging
    return res.status(500).json({ 
      success: false, 
      message: "Failed to connect to WhatsApp Business API",
      error: error.message || "Unknown error occurred",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Send a WhatsApp message
router.post("/send", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Log the full request body to debug what's coming in
    console.log("WhatsApp send request body:", JSON.stringify(req.body, null, 2));
    
    // Extract values and ensure they're properly converted to the right type
    // Handle leadId properly whether it comes as a string or number
    const leadId = req.body.leadId ? Number(req.body.leadId) : 0;
    const message = req.body.message;
    const subAccountId = Number(req.body.subAccountId);
    const userId = Number(req.body.userId);
    const receivedPhone = req.body.phone; // Get phone from request for fallback
    
    // Log the conversion details for debugging
    console.log("ID conversion details:", {
      receivedLeadId: req.body.leadId,
      receivedType: typeof req.body.leadId,
      convertedLeadId: leadId,
      convertedType: typeof leadId,
      phone: receivedPhone || "not provided"
    });
    
    // Detailed logging for missing fields
    if (!message || !subAccountId || !userId) {
      console.log("Missing WhatsApp message fields:", {
        leadId: !!leadId ? "present" : "missing",
        message: !!message ? "present" : "missing",
        subAccountId: !!subAccountId ? "present" : "missing",
        userId: !!userId ? "present" : "missing"
      });
      
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields",
        details: {
          leadId: !!leadId,
          message: !!message,
          subAccountId: !!subAccountId,
          userId: !!userId
        }
      });
    }

    // Try multiple approaches to find the lead
    console.log(`Looking for lead with ID: ${leadId}`);
    
    // Always get all leads first to ensure we're working with the complete dataset
    const allLeads = await storage.getLeadsBySubAccount(subAccountId);
    console.log(`Found ${allLeads.length} total leads in sub-account ${subAccountId}`);
    console.log(`All available leads:`, allLeads.map(l => ({ id: l.id, name: l.name, phone: l.phone })));
    
    // Try to find the lead by ID first
    let lead = allLeads.find(l => l.id === leadId);
    
    // If not found by ID, try by phone number
    if (!lead && receivedPhone) {
      console.log(`Lead not found by ID, trying to find by phone: ${receivedPhone}`);
      lead = allLeads.find(l => l.phone === receivedPhone || l.phone === receivedPhone.replace(/\+/g, ''));
      
      if (lead) {
        console.log(`Lead found by phone: ${lead.id} - ${lead.name}`);
      }
    }
    
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        message: "Lead not found",
        details: `Could not find lead with ID: ${leadId}` + (receivedPhone ? ` or phone: ${receivedPhone}` : "")
      });
    }

    // Get WhatsApp integration for the subaccount
    const integration = await storage.getIntegrationByType("whatsapp", subAccountId);
    if (!integration || !integration.config) {
      return res.status(404).json({ 
        success: false, 
        message: "WhatsApp integration not found" 
      });
    }

    // Get user sending the message
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Format phone number for sending
    const formattedPhoneNumber = formatPhoneNumber(lead.phone);
    
    // Send WhatsApp message
    console.log("Integration config:", JSON.stringify(integration.config));
    
    // Parse config if it's a string
    let configData = integration.config;
    if (typeof configData === 'string') {
      try {
        configData = JSON.parse(configData);
      } catch (e) {
        console.error("Failed to parse integration config:", e);
      }
    }
    
    // Get credentials from integration settings (not environment variables!)
    const apiKey = configData.apiKey; // System User Token
    const phoneNumberId = configData.businessPhoneNumber; // Phone Number ID
    
    // Check for missing credentials
    if (!apiKey || !phoneNumberId) {
      console.error("Missing WhatsApp credentials in integration settings", { 
        hasApiKey: !!apiKey, 
        hasPhoneNumberId: !!phoneNumberId 
      });
      return res.status(400).json({ 
        success: false, 
        message: "WhatsApp API credentials are missing from integration settings",
        details: "Please update your WhatsApp integration with System User Token and Phone Number ID"
      });
    }
    
    console.log("Using WhatsApp credentials from integration settings:", { 
      apiKey: apiKey ? "Present (length: " + apiKey.length + ")" : "Missing", 
      phoneNumberId: phoneNumberId ? "Present" : "Missing"
    });
    
    const result = await sendTextMessage(
      formattedPhoneNumber,
      message,
      apiKey,
      phoneNumberId  // Use the Phone Number ID from integration settings
    );

    // Create lead activity
    await storage.createLeadActivity({
      leadId,
      userId,
      type: "whatsapp",
      content: message,
      direction: "outgoing",
      metadata: {
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      },
      attachments: null
    });

    res.status(200).json({ 
      success: true, 
      message: "WhatsApp message sent successfully",
      result
    });
  } catch (error) {
    console.error("WhatsApp send message error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send WhatsApp message",
      error: (error as Error).message
    });
  }
});

// Send a WhatsApp template message
router.post("/send-template", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { leadId, templateName, parameters, subAccountId, userId } = req.body;
    
    if (!leadId || !templateName || !subAccountId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Get lead details
    const lead = await storage.getLead(leadId);
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        message: "Lead not found" 
      });
    }

    // Get WhatsApp integration for the subaccount
    const integration = await storage.getIntegrationByType("whatsapp", subAccountId);
    if (!integration || !integration.config) {
      return res.status(404).json({ 
        success: false, 
        message: "WhatsApp integration not found" 
      });
    }

    // Format phone number
    const formattedRecipientPhone = formatPhoneNumber(lead.phone);
    
    // Get the template from database to retrieve the correct language
    const templates = await storage.getMessageTemplates(subAccountId, 'whatsapp');
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      return res.status(400).json({
        success: false,
        message: `Template '${templateName}' not found. Available templates: ${templates.map(t => t.name).join(', ')}`
      });
    }
    
    const languageCode = (template as any).language || 'en_US';
    console.log(`Using template '${templateName}' with language: ${languageCode}`);
    
    // Send WhatsApp template message using stored language
    const result = await sendTemplateMessage(
      formattedRecipientPhone,
      templateName,
      parameters || {},
      process.env.WHATSAPP_API_KEY as string,
      process.env.WHATSAPP_BUSINESS_PHONE_NUMBER as string,
      subAccountId,
      languageCode
    );

    // Create lead activity
    await storage.createLeadActivity({
      leadId,
      userId,
      type: "whatsapp",
      content: `Template: ${templateName}`,
      direction: "outgoing",
      metadata: {
        messageId: result.messageId,
        templateName,
        parameters,
        timestamp: new Date().toISOString()
      },
      attachments: null
    });

    res.status(200).json({ 
      success: true, 
      message: "WhatsApp template message sent successfully",
      result
    });
  } catch (error) {
    console.error("WhatsApp send template message error:", error);
    
    // Check if it's a token-related error
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('Error validating access token') || 
        errorMessage.includes('session is invalid') ||
        errorMessage.includes('OAuthException')) {
      
      console.log("WhatsApp token expired. Environment token length:", 
        process.env.WHATSAPP_API_KEY ? process.env.WHATSAPP_API_KEY.length : 'undefined');
      
      res.status(401).json({ 
        success: false, 
        message: "WhatsApp access token has expired. Please update your deployment environment with a new System User Token.",
        error: errorMessage,
        tokenExpired: true,
        suggestion: "Generate a new token in Meta Business Manager and update the WHATSAPP_API_KEY environment variable"
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Failed to send WhatsApp template message",
        error: errorMessage
      });
    }
  }
});

// Check WhatsApp status
router.get("/status", async (req: Request, res: Response) => {
  try {
    // Check if we have environment variables set
    const envApiKey = process.env.WHATSAPP_API_KEY;
    const envPhoneNumber = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER;
    
    // Default response - we'll check for subaccount-specific configuration if query param is provided
    let status = {
      available: !!envApiKey && !!envPhoneNumber,
      configured: false,
      connected: false,
      message: "WhatsApp service is available"
    };
    
    // If subAccountId is provided, check for specific configuration
    const subAccountId = req.query.subAccountId ? parseInt(req.query.subAccountId as string) : null;
    if (subAccountId) {
      // Get WhatsApp integration for the subaccount
      const integration = await storage.getIntegrationByType("whatsapp", subAccountId);
      
      if (integration && integration.config) {
        let config = integration.config;
        // Parse config if it's a string
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config);
          } catch (e) {
            console.error("Failed to parse integration config:", e);
          }
        }
        
        // Check if the integration has required credentials - use environment variables as primary source
        const hasApiKey = !!envApiKey;
        const hasPhoneNumber = !!envPhoneNumber;
        const isActive = integration.active !== false; // Default to true if not specified
        
        // Update status
        status = {
          ...status,
          configured: hasApiKey && hasPhoneNumber,
          connected: hasApiKey && hasPhoneNumber && isActive,
          lastChecked: new Date().toISOString()
        };
        
        if (status.connected) {
          status.message = "WhatsApp service is connected and ready";
        } else if (status.configured) {
          status.message = "WhatsApp service is configured but not active";
        } else {
          status.message = "WhatsApp service requires configuration";
        }
        
        // Include last verified timestamp if available
        if (config && typeof config === 'object' && config.lastVerified) {
          status.lastVerified = config.lastVerified;
        }
      }
    }
    
    return res.json(status);
  } catch (error) {
    console.error("Error checking WhatsApp status:", error);
    return res.status(500).json({ 
      available: false, 
      configured: false,
      connected: false,
      message: "Error checking WhatsApp service status" 
    });
  }
});

// Verify WhatsApp connection
router.get("/verify", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const subAccountId = parseInt(req.query.subAccountId as string);
    
    if (!subAccountId) {
      return res.status(400).json({ 
        success: false, 
        message: "Sub Account ID is required" 
      });
    }

    // Get WhatsApp integration for the subaccount
    const integration = await storage.getIntegrationByType("whatsapp", subAccountId);
    if (!integration || !integration.config) {
      return res.status(404).json({ 
        success: false, 
        message: "WhatsApp integration not found" 
      });
    }

    // Verify WhatsApp connection
    const config = integration.config;
    const result = await verifyWhatsAppConnection(
      config.apiKey as string,
      config.businessPhoneNumber as string
    );

    res.status(200).json({ 
      success: true, 
      connected: result.connected,
      message: result.message
    });
  } catch (error) {
    console.error("WhatsApp verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify WhatsApp connection",
      error: (error as Error).message
    });
  }
});

// This is a duplicate route handler - removed to prevent conflicts

// Sync WhatsApp templates
router.post("/sync-templates", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { subAccountId } = req.body;
    
    if (!subAccountId) {
      return res.status(400).json({ 
        success: false, 
        message: "Sub Account ID is required" 
      });
    }

    // Get the user ID from the session
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    // Debug: Log the subAccountId being used
    console.log(`Template sync request: subAccountId=${subAccountId}, userId=${userId}`);
    
    // Sync WhatsApp templates
    const templates = await syncWhatsAppTemplates(subAccountId, userId);

    res.status(200).json({ 
      success: true, 
      message: "WhatsApp templates synced successfully",
      templates
    });
  } catch (error) {
    console.error("WhatsApp template sync error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to sync WhatsApp templates",
      error: (error as Error).message
    });
  }
});

// Remove duplicate webhook handler - keeping the one below with full lead creation logic

// WhatsApp webhook verification (GET request)
router.get("/webhook", (req: Request, res: Response) => {
  try {
    // Get query parameters from the request
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    console.log("WhatsApp webhook verification attempt");
    console.log("Mode:", mode);
    console.log("Token:", token);
    console.log("Challenge:", challenge);
    
    // The simplest verification - always accept during testing
    if (mode && challenge) {
      // Simply return the challenge string
      console.log("WhatsApp webhook verified successfully");
      return res.status(200).send(challenge);
    }
    
    // If verification fails
    console.error("WhatsApp webhook verification failed");
    return res.sendStatus(403);
  } catch (error) {
    console.error("WhatsApp webhook verification error:", error);
    return res.sendStatus(500);
  }
});

// WhatsApp webhook for incoming messages (POST request)
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    console.log("WhatsApp incoming message webhook received");
    console.log("Webhook body:", JSON.stringify(body, null, 2));

    // Check if this is a WhatsApp message event
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Process incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                const fromPhoneNumber = message.from;
                const messageText = message.text?.body || '';
                const messageId = message.id;
                const timestamp = new Date(parseInt(message.timestamp) * 1000);

                console.log(`Processing WhatsApp message ${messageId} from ${fromPhoneNumber}: ${messageText}`);

                // First check if this exact message was already processed (global duplicate check)
                try {
                  const allLeads = await storage.getLeadsBySubAccount(1);
                  let alreadyProcessed = false;
                  
                  for (const lead of allLeads) {
                    const activities = await storage.getLeadActivities(lead.id);
                    const messageExists = activities.some((activity: any) => {
                      if (activity.metadata && typeof activity.metadata === 'object') {
                        return activity.metadata.messageId === messageId;
                      }
                      return false;
                    });
                    if (messageExists) {
                      alreadyProcessed = true;
                      console.log(`Message ${messageId} already processed, skipping`);
                      break;
                    }
                  }
                  
                  if (alreadyProcessed) {
                    continue; // Skip this message entirely
                  }
                } catch (error) {
                  console.log(`Error checking for duplicate messages: ${error}`);
                }

                // Format phone number consistently
                let formattedPhone = fromPhoneNumber;
                if (!formattedPhone.startsWith('+')) {
                  formattedPhone = '+' + formattedPhone;
                }

                // Look for existing lead with this phone number
                const leads = await storage.getLeadsBySubAccount(1); // Default subaccount
                let existingLead = leads.find(lead => {
                  const leadPhone = lead.phone?.replace(/[^\d]/g, '') || '';
                  const incomingPhone = fromPhoneNumber.replace(/[^\d]/g, '');
                  return leadPhone === incomingPhone || 
                         lead.phone === formattedPhone || 
                         lead.phone === fromPhoneNumber;
                });

                let leadId = existingLead?.id;

                // If no existing lead found, create a new one
                if (!existingLead) {
                  console.log(`No existing lead found for ${fromPhoneNumber}. Creating new lead...`);
                  
                  // Try to get contact name from WhatsApp profile
                  let contactName = `WhatsApp Contact ${fromPhoneNumber.slice(-4)}`; // Fallback name
                  
                  try {
                    // Check if contact info is available in the webhook data
                    if (value.contacts && value.contacts.length > 0) {
                      const contact = value.contacts.find((c: any) => c.wa_id === fromPhoneNumber);
                      if (contact && contact.profile && contact.profile.name) {
                        contactName = contact.profile.name;
                        console.log(`Found WhatsApp profile name: ${contactName}`);
                      }
                    }
                  } catch (error) {
                    console.log(`Could not fetch WhatsApp profile name, using fallback: ${error}`);
                  }
                  
                  try {
                    const newLead = await storage.createLead({
                      name: contactName,
                      phone: formattedPhone,
                      email: null,
                      source: "whatsapp_inbound",
                      status: "new",
                      subAccountId: 1,
                      assignedTo: null,
                      tags: ["whatsapp"],
                      notes: `Lead created automatically from incoming WhatsApp message`
                    });
                    
                    leadId = newLead.id;
                    console.log(`✅ New lead created successfully with ID: ${leadId} for ${contactName} (${formattedPhone})`);
                  } catch (error) {
                    console.error(`❌ Failed to create new lead: ${error}`);
                    continue; // Skip this message if lead creation fails
                  }
                } else {
                  console.log(`Found existing lead ${leadId} for ${fromPhoneNumber}`);
                }

                // Create the message activity
                if (leadId) {
                  try {
                    await storage.createLeadActivity({
                      leadId: leadId,
                      userId: 1, // System user for incoming messages
                      type: "whatsapp",
                      content: messageText,
                      direction: "incoming",
                      metadata: {
                        messageId: messageId,
                        timestamp: timestamp.toISOString(),
                        fromPhone: fromPhoneNumber
                      },
                      attachments: null
                    });

                    console.log(`✅ Message activity created for lead ${leadId}: "${messageText}"`);
                  } catch (error) {
                    console.error(`❌ Failed to create message activity: ${error}`);
                  }
                }
              }
            }

            // Process message status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                const messageId = status.id;
                const statusType = status.status; // sent, delivered, read, failed
                
                console.log(`Message ${messageId} status updated to: ${statusType}`);
                // Note: You could update message delivery status in your database here
              }
            }
          }
        }
      }
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error("WhatsApp webhook processing error:", error);
    res.status(500).send('Error processing webhook');
  }
});

export { router };