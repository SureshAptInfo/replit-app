import { storage } from "../storage";
import fetch from "node-fetch";

/**
 * Sync WhatsApp templates directly using API credentials
 */
async function syncTemplatesDirectly(apiKey: string, phoneNumberId: string, subAccountId: number): Promise<any[]> {
  console.log(`Syncing templates directly with API for subAccountId: ${subAccountId}`);
  
  // WhatsApp Business API endpoint for message templates using Business Account ID
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const url = businessAccountId 
    ? `https://graph.facebook.com/v17.0/${businessAccountId}/message_templates`
    : `https://graph.facebook.com/v17.0/${phoneNumberId}/message_templates`;

  try {
    // Get templates from WhatsApp Business API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      throw new Error(`WhatsApp API error: ${data.error?.message || response.statusText}`);
    }

    console.log(`Successfully fetched ${data.data?.length || 0} templates from WhatsApp API`);
    
    // Process templates and save to database
    const templates = data.data || [];
    const savedTemplates = [];

    for (const template of templates) {
      const savedTemplate = await storage.createMessageTemplate({
        name: template.name,
        content: template.components?.[0]?.text || JSON.stringify(template.components),
        subAccountId,
        type: "whatsapp",
        active: template.status === "APPROVED",
        category: template.category || "custom",
        createdBy: 1, // Default user ID
      });

      savedTemplates.push(savedTemplate);
    }

    return savedTemplates;
  } catch (error) {
    console.error("Error syncing templates directly:", error);
    throw error;
  }
}

/**
 * Formats a phone number for WhatsApp API by removing any spaces or special characters
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number (e.g., 1234567890)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters (including the plus sign)
  return phoneNumber.replace(/\D/g, "");
}

/**
 * Sends a text message via WhatsApp Business API
 * @param to Recipient phone number (formatted)
 * @param message Message text
 * @param apiKey System User Token or API key
 * @param phoneNumberId WhatsApp Business Phone Number ID (not the actual phone number)
 * @returns Object containing status and message ID
 */
export async function sendTextMessage(
  to: string,
  message: string,
  apiKey: string,
  phoneNumberId: string
): Promise<{ success: boolean; messageId: string }> {
  try {
    // Validate input
    if (!to || !message || !apiKey || !phoneNumberId) {
      throw new Error("Missing required parameters for sending WhatsApp message");
    }

    // WhatsApp Cloud API endpoint following your working curl command
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
    
    // Prepare request payload according to official WhatsApp Cloud API send messages guide
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: message
      }
    };

    console.log("Sending WhatsApp message:", {
      url,
      to,
      phoneNumberId,
      hasApiKey: !!apiKey,
      payload
    });

    // Send request to WhatsApp Cloud API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("WhatsApp API error:", {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    console.log("WhatsApp message sent successfully:", data);

    return {
      success: true,
      messageId: data.messages?.[0]?.id || "unknown"
    };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

/**
 * Sends a template message via WhatsApp Business API
 * @param to Recipient phone number (formatted)
 * @param templateName Name of the template to use
 * @param parameters Template parameters for variable substitution
 * @param apiKey System User Token or API key
 * @param phoneNumberId WhatsApp Business Phone Number ID (not the actual phone number)
 * @returns Object containing status and message ID
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  parameters: Record<string, any>,
  apiKey: string,
  phoneNumberId: string,
  subAccountId?: number,
  languageCode: string = 'en_US'
): Promise<{ success: boolean; messageId: string }> {
  try {
    // Validate input
    if (!to || !templateName || !apiKey || !phoneNumberId) {
      throw new Error("Missing required parameters for sending template message");
    }

    // Use the provided language code parameter instead of database lookup
    // languageCode is now passed as a parameter from the calling function

    // WhatsApp Business API endpoint for sending messages (using Phone Number ID directly)
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    
    // Format template components based on parameters
    const components = [];
    
    // Add header component if present in parameters
    if (parameters.header) {
      components.push({
        type: "header",
        parameters: [
          {
            type: "text",
            text: parameters.header
          }
        ]
      });
    }
    
    // Add body parameters if present
    if (parameters.body && Array.isArray(parameters.body)) {
      const bodyParams = parameters.body.map((param: string) => ({
        type: "text",
        text: param
      }));
      
      if (bodyParams.length > 0) {
        components.push({
          type: "body",
          parameters: bodyParams
        });
      }
    }
    
    // Add button parameters if present
    if (parameters.buttons && Array.isArray(parameters.buttons)) {
      components.push({
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: parameters.buttons.map((button: string) => ({
          type: "payload",
          payload: button
        }))
      });
    }
    
    // Prepare request payload
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode || "en_US" // Use provided language code or default
        },
        components: components.length > 0 ? components : undefined
      }
    };

    // Send request to WhatsApp Business API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("WhatsApp API template error:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp template message");
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id || "unknown"
    };
  } catch (error) {
    console.error("Error sending WhatsApp template message:", error);
    throw error;
  }
}

/**
 * Verifies the WhatsApp Business API connection
 * @param apiKey System User Token or API key
 * @param phoneNumberId WhatsApp Business Phone Number ID (not the actual phone number)
 * @returns Object containing connection status and message
 */
export async function verifyWhatsAppConnection(
  apiKey: string,
  phoneNumberId: string
): Promise<{ connected: boolean; message: string }> {
  try {
    // Validate input
    if (!apiKey || !phoneNumberId) {
      throw new Error("Missing required parameters for WhatsApp verification");
    }

    // WhatsApp Business API endpoint for checking business profile (using Phone Number ID directly)
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/whatsapp_business_profile`;

    // Send request to WhatsApp Business API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("WhatsApp API verification error:", data);
      return {
        connected: false,
        message: data.error?.message || "Failed to verify WhatsApp connection"
      };
    }

    return {
      connected: true,
      message: "WhatsApp Business API connection verified successfully"
    };
  } catch (error) {
    console.error("Error verifying WhatsApp connection:", error);
    return {
      connected: false,
      message: (error as Error).message || "Failed to verify WhatsApp connection"
    };
  }
}

/**
 * Syncs WhatsApp templates from the Business API to the database
 * @param subAccountId The ID of the sub-account
 * @param userId The ID of the user syncing the templates
 * @returns Array of synced templates
 */
export async function syncWhatsAppTemplates(
  subAccountId: number,
  userId: number
): Promise<any[]> {
  try {
    // Get WhatsApp integration for the subaccount
    console.log(`Template sync: Looking for WhatsApp integration for subAccountId: ${subAccountId}`);
    
    // First try to get integration from database
    const integration = await storage.getIntegrationByType("whatsapp", subAccountId);
    console.log("Template sync: Found integration:", integration ? "Yes" : "No");
    
    // Always use environment variables as primary source if available
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log("Template sync: Using environment variables");
      const apiKey = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      
      return await syncTemplatesDirectly(apiKey, phoneNumberId, subAccountId);
    }
    
    // If no integration found and no environment variables, throw error
    if (!integration || !integration.config) {
      throw new Error("WhatsApp API credentials not found in environment or integration settings");
    }

    // Parse config if it's a string
    let config = integration.config;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        console.error("Failed to parse integration config:", e);
        throw new Error("Invalid integration configuration");
      }
    }
    
    const apiKey = (config as any).apiKey || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = (config as any).phoneNumberId || (config as any).businessPhoneNumber || process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    console.log("Template sync: Using API key:", apiKey ? "✓ Available" : "✗ Missing");
    console.log("Template sync: Using phone number ID:", phoneNumberId ? "✓ Available" : "✗ Missing");

    // WhatsApp Business API endpoint for message templates (using Phone Number ID, not business phone number)
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/message_templates`;

    // Get templates from WhatsApp Business API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("WhatsApp API templates error:", data);
      throw new Error(data.error?.message || "Failed to sync WhatsApp templates");
    }

    // Process templates
    const templates = data.data || [];
    const savedTemplates = [];
    
    console.log(`WhatsApp API returned ${templates.length} templates:`, templates.map(t => t.name));

    // Get all existing templates once to avoid repeated database calls
    const existingTemplates = await storage.getMessageTemplates(subAccountId, "whatsapp");
    console.log(`Found ${existingTemplates.length} existing templates in database:`, existingTemplates.map(t => t.name));
    
    // Save each template to the database with language information from API
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      console.log(`\n--- Processing template ${i + 1}/${templates.length}: ${template.name} ---`);
      
      // Extract language information from the template - WhatsApp API returns it in different formats
      const languageCode = template.language_policy?.options?.[0]?.code || 
                          template.language || 
                          'en_US'; // Get actual language from API
      
      console.log(`Template ${template.name} has language: ${languageCode}`);
      
      // Check if template already exists (case-insensitive)
      const existingTemplate = existingTemplates.find(t => 
        t.name.toLowerCase() === template.name.toLowerCase()
      );

      if (existingTemplate) {
        // Update existing template with correct language from API
        console.log(`Template ${template.name} already exists (ID: ${existingTemplate.id}), updating instead of creating`);
        const updatedTemplate = await storage.updateMessageTemplate(existingTemplate.id, { 
          language: languageCode,
          active: template.status === "APPROVED",
          content: template.components?.[0]?.text || JSON.stringify(template.components)
        });
        if (updatedTemplate) {
          savedTemplates.push(updatedTemplate);
          console.log(`Successfully updated template ${template.name}`);
        }
      } else {
        console.log(`Template ${template.name} not found in existing templates, creating new one`);

        // Create message template in database with proper language
        const savedTemplate = await storage.createMessageTemplate({
          name: template.name,
          content: template.components?.[0]?.text || JSON.stringify(template.components),
          subAccountId,
          type: "whatsapp", // Set type specifically to whatsapp
          active: template.status === "APPROVED",
          category: template.category || "custom",
          createdBy: userId,
          language: languageCode // Store the actual language from API
        });

        savedTemplates.push(savedTemplate);
        console.log(`Successfully created new template ${template.name}`);
      }
    }
    
    console.log(`\nSync completed. Processed ${templates.length} templates, saved ${savedTemplates.length} templates`)

    return savedTemplates;
  } catch (error) {
    console.error("Error syncing WhatsApp templates:", error);
    throw error;
  }
}

/**
 * Process incoming WhatsApp webhook data
 * @param data Webhook payload from WhatsApp Business API
 */
export async function processWhatsAppWebhook(data: any): Promise<void> {
  try {
    // Check if this is a valid WhatsApp webhook payload
    if (!data || !data.entry || !Array.isArray(data.entry)) {
      console.log("Invalid webhook payload");
      return;
    }

    console.log("Processing WhatsApp webhook data");

    // Process each entry
    for (const entry of data.entry) {
      // Process each change in the entry
      for (const change of entry.changes || []) {
        // Check if this is a messages change (incoming messages)
        if (change.field === "messages") {
          console.log("Processing incoming messages webhook");
          await processIncomingMessages(change.value);
        }
        // Check if this is a message_status_updates change (delivery/read receipts)
        else if (change.field === "message_status_updates") {
          console.log("Processing message status updates webhook");
          await processMessageStatusUpdates(change.value);
        }
      }
    }
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
  }
}

/**
 * Find lead activities by WhatsApp message ID
 * This helper function searches through all lead activities to find those
 * that match a specific WhatsApp message ID in their metadata
 * @param messageId The WhatsApp message ID to search for
 * @returns Array of lead activities that match the messageId
 */
async function findLeadActivitiesByMessageId(messageId: string): Promise<any[]> {
  try {
    // Get all lead activities from the storage
    const allLeadActivities = await storage.getLeadActivities(0); // Get all activities
    
    // Filter to find activities that have this messageId in their metadata
    const matchingActivities = allLeadActivities.filter(activity => {
      if (!activity.metadata) return false;
      
      // Try to parse the metadata if it's a string
      let metadata = activity.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          return false;
        }
      }
      
      // Check if the messageId matches
      return metadata.messageId === messageId;
    });
    
    return matchingActivities;
  } catch (error) {
    console.error(`Error finding lead activities for message ID ${messageId}:`, error);
    return [];
  }
}

/**
 * Process WhatsApp message status updates (delivery/read receipts)
 * @param data Status update data from webhook
 */
async function processMessageStatusUpdates(data: any): Promise<void> {
  try {
    // Check if there are status updates
    if (!data || !data.statuses || !Array.isArray(data.statuses)) {
      console.log("No status updates found in webhook data");
      return;
    }

    const statuses = data.statuses;
    console.log(`Processing ${statuses.length} status update(s)`);

    // Process each status update
    for (const status of statuses) {
      const messageId = status.id;
      const recipientId = status.recipient_id;
      const timestamp = status.timestamp;
      const statusType = status.status; // delivered, read, etc.

      console.log(`Processing status update for message ${messageId}: ${statusType}`);

      // Find the activity associated with this message ID
      // Note: This is a simplified implementation - in production, you'd store message IDs
      console.log(`Looking for activities with message ID: ${messageId}`);
      
      // For now, just log the status update since we'd need to implement message ID tracking
      console.log(`Message ${messageId} status updated to: ${statusType}`);
      
      // TODO: Implement proper message ID tracking to update message delivery status
    }
  } catch (error) {
    console.error("Error processing message status updates:", error);
  }
}

/**
 * Process incoming WhatsApp messages
 * @param data Message data from webhook
 */
async function processIncomingMessages(data: any): Promise<void> {
  try {
    // Check if there are messages
    if (!data || !data.messages || !Array.isArray(data.messages)) {
      console.log("No messages found in webhook data");
      return;
    }

    const messages = data.messages;
    const metadata = data.metadata || {};
    const contacts = data.contacts || [];

    console.log(`Processing ${messages.length} WhatsApp message(s)`);

    // Process each message
    for (const message of messages) {
      const from = message.from; // Phone number that sent the message
      const timestamp = message.timestamp;
      const messageId = message.id;
      
      // Find contact information
      let contactName = "Unknown";
      if (contacts.length > 0) {
        contactName = contacts[0].profile?.name || "Unknown";
      }

      // Find lead by phone number with improved matching
      const formattedPhone = from; // Use as is, since it comes from WhatsApp already formatted
      console.log(`Looking up lead with phone: ${formattedPhone}`);
      
      // Get all leads for the account and find matching phone number
      const allLeads = await storage.getLeadsBySubAccount(1); // Using default sub-account for now
      const leads = allLeads.filter(lead => {
        if (!lead.phone) return false;
        
        // Clean both phone numbers for comparison
        const cleanLeadPhone = lead.phone.replace(/\D/g, ''); // Remove all non-digits
        const cleanFromPhone = formattedPhone.replace(/\D/g, ''); // Remove all non-digits
        
        // Check various formats
        return (
          lead.phone === formattedPhone ||
          lead.phone === `+${formattedPhone}` ||
          `+${lead.phone}` === formattedPhone ||
          cleanLeadPhone === cleanFromPhone ||
          cleanLeadPhone.endsWith(cleanFromPhone.slice(-10)) || // Match last 10 digits
          cleanFromPhone.endsWith(cleanLeadPhone.slice(-10))
        );
      });

      let lead;
      if (leads.length === 0) {
        console.log(`No lead found for phone number: ${from}. Creating new lead...`);
        
        // Create new lead automatically
        try {
          const newLead = await storage.createLead({
            name: contactName !== "Unknown" ? contactName : `WhatsApp Contact ${from.slice(-4)}`,
            phone: from,
            email: null,
            source: "whatsapp_inbound",
            status: "new",
            subAccountId: 1,
            assignedTo: null,
            tags: ["whatsapp"],
            notes: `Lead created automatically from incoming WhatsApp message`
          });
          
          lead = newLead;
          console.log(`✅ New lead created successfully with ID: ${lead.id} for ${contactName} (${from})`);
        } catch (error) {
          console.error(`❌ Failed to create new lead: ${error}`);
          continue; // Skip this message if lead creation fails
        }
      } else {
        lead = leads[0];
        console.log(`Found existing lead: ${lead.name} (ID: ${lead.id})`);
      }

      // Find the assigned user for this lead
      const assignedUserId = lead.assignedUserId || lead.assignedTo || null;
      
      // Extract message content based on type
      let content = "";
      let attachments = null;
      let messageType = "text";

      // Process different message types
      if (message.type === "text") {
        content = message.text?.body || "";
        messageType = "text";
      } 
      else if (message.type === "image") {
        content = message.image?.caption || "Sent an image";
        messageType = "image";
        if (message.image?.id) {
          attachments = [message.image.id];
        }
      } 
      else if (message.type === "document") {
        content = message.document?.caption || "Sent a document";
        messageType = "document";
        if (message.document?.id) {
          attachments = [message.document.id];
        }
      } 
      else if (message.type === "audio") {
        content = "Sent an audio message";
        messageType = "audio";
        if (message.audio?.id) {
          attachments = [message.audio.id];
        }
      } 
      else if (message.type === "video") {
        content = message.video?.caption || "Sent a video";
        messageType = "video";
        if (message.video?.id) {
          attachments = [message.video.id];
        }
      } 
      else if (message.type === "location") {
        const lat = message.location?.latitude;
        const lng = message.location?.longitude;
        content = `Shared a location: ${lat}, ${lng}`;
        messageType = "location";
      } 
      else if (message.type === "contacts") {
        content = "Shared contact information";
        messageType = "contacts";
      } 
      else {
        content = `Sent a message of type: ${message.type}`;
        messageType = message.type;
      }

      console.log(`Processing ${messageType} message: ${content}`);
      
      // Create lead activity for the incoming message
      await storage.createLeadActivity({
        leadId: lead.id,
        userId: assignedUserId || 1, // Use admin ID if no assigned user
        type: "whatsapp",
        content: content,
        direction: "incoming",
        metadata: {
          messageId,
          timestamp,
          contactName,
          phone: from,
          messageType
        },
        attachments: attachments
      });

      // Create notification for assigned user
      if (assignedUserId) {
        await storage.createNotification({
          type: "message",
          title: "New WhatsApp Message",
          content: `${lead.name}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
          userId: assignedUserId,
          leadId: lead.id,
          read: false
        });
      }

      // Automatically update lead status to 'contacted' if it's 'new'
      if (lead.status === "new" || lead.status === "unread") {
        console.log(`Updating lead status from ${lead.status} to contacted`);
        await storage.updateLead(lead.id, {
          status: "contacted"
        });
        
        // Log a status change activity
        await storage.createLeadActivity({
          leadId: lead.id,
          userId: assignedUserId || 1,
          type: "status_change",
          content: `Status changed from ${lead.status} to contacted (automated)`,
          direction: "internal",
          metadata: {
            oldStatus: lead.status,
            newStatus: "contacted",
            trigger: "incoming_message"
          },
          attachments: null
        });
      }
    }
  } catch (error) {
    console.error("Error processing incoming WhatsApp messages:", error);
  }
}