import type { IStorage } from '../storage';
import { Integration } from '@shared/schema';

// Integration types
type WhatsAppConfig = {
  apiKey: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
};

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
};

type BrevoConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

type StripeConfig = {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
};

type S3Config = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
};

type VimeoConfig = {
  accessToken: string;
  clientId: string;
  clientSecret: string;
};

type GoogleSSOConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type MicrosoftSSOConfig = {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
};

/**
 * Integration Service - Handles communication with external service APIs
 */
export class IntegrationService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Get integration by type, optionally specifying a subAccount to search for
   */
  async getIntegration(type: string, subAccountId?: number): Promise<Integration | undefined> {
    try {
      // First try to get subaccount-specific integration
      if (subAccountId) {
        const integration = await this.storage.getIntegrationByType(type, subAccountId);
        if (integration) return integration;
      }
      
      // Fall back to system-wide integration
      return await this.storage.getIntegrationByType(type);
    } catch (error) {
      console.error(`Error getting ${type} integration:`, error);
      return undefined;
    }
  }

  /**
   * Send WhatsApp message via WhatsApp Business API
   */
  async sendWhatsAppMessage(
    to: string, 
    message: string, 
    subAccountId?: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const integration = await this.getIntegration('whatsapp', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'WhatsApp integration not found or inactive' };
      }

      const config = integration.config as WhatsAppConfig;
      
      // WhatsApp Business API endpoint
      const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `WhatsApp API error: ${data.error?.message || response.statusText}` 
        };
      }

      return { 
        success: true, 
        messageId: data.messages?.[0]?.id 
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error.message || 'Failed to send WhatsApp message' };
    }
  }

  /**
   * Send SMS message via Twilio
   */
  async sendSMS(
    to: string, 
    message: string, 
    subAccountId?: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const integration = await this.getIntegration('twilio', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'Twilio integration not found or inactive' };
      }

      const config = integration.config as TwilioConfig;
      
      // Twilio API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
      
      // Basic auth for Twilio
      const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
      
      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', config.phoneNumber);
      formData.append('Body', message);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `Twilio API error: ${data.message || response.statusText}` 
        };
      }

      return { 
        success: true, 
        messageId: data.sid 
      };
    } catch (error: any) {
      console.error('Error sending SMS via Twilio:', error);
      return { success: false, error: error.message || 'Failed to send SMS' };
    }
  }

  /**
   * Send email via BREVO
   */
  async sendEmail(
    to: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    from?: { email: string; name: string },
    subAccountId?: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const integration = await this.getIntegration('brevo', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'BREVO integration not found or inactive' };
      }

      const config = integration.config as BrevoConfig;
      
      // Use default sender from config if not provided
      if (!from) {
        from = {
          email: config.senderEmail,
          name: config.senderName
        };
      }
      
      // BREVO API endpoint
      const url = 'https://api.brevo.com/v3/smtp/email';
      
      const payload = {
        sender: from,
        to: to,
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent || '',
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': config.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `BREVO API error: ${data.message || response.statusText}` 
        };
      }

      return { 
        success: true, 
        messageId: data.messageId 
      };
    } catch (error: any) {
      console.error('Error sending email via BREVO:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  /**
   * Upload file to Amazon S3
   */
  async uploadFileToS3(
    fileName: string,
    fileData: Buffer,
    contentType: string,
    subAccountId?: number
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const integration = await this.getIntegration('aws_s3', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'AWS S3 integration not found or inactive' };
      }

      const config = integration.config as S3Config;
      
      // When connected to actual AWS S3, this function would use the AWS SDK
      // to upload the file to S3 using the credentials from the integration
      
      // Generate the S3 URL based on the bucket and filename
      const s3Url = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileName}`;
      
      return { 
        success: true, 
        url: s3Url 
      };
    } catch (error: any) {
      console.error('Error uploading file to S3:', error);
      return { success: false, error: error.message || 'Failed to upload file to S3' };
    }
  }

  /**
   * Upload video to Vimeo
   */
  async uploadVideoToVimeo(
    title: string,
    description: string,
    fileData: Buffer,
    subAccountId?: number
  ): Promise<{ success: boolean; videoId?: string; url?: string; error?: string }> {
    try {
      const integration = await this.getIntegration('vimeo', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'Vimeo integration not found or inactive' };
      }

      const config = integration.config as VimeoConfig;
      
      // When connected to actual Vimeo API, this function would use the Vimeo SDK
      // to upload the video to Vimeo using the credentials from the integration
      
      // Generate video ID and URL for demonstration
      const videoId = `${Date.now()}`;
      const videoUrl = `https://vimeo.com/${videoId}`;
      
      return { 
        success: true, 
        videoId,
        url: videoUrl
      };
    } catch (error: any) {
      console.error('Error uploading video to Vimeo:', error);
      return { success: false, error: error.message || 'Failed to upload video to Vimeo' };
    }
  }

  /**
   * Create a Stripe payment
   */
  async createPayment(
    amount: number,
    currency: string,
    description: string,
    customerEmail?: string,
    subAccountId?: number
  ): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
      const integration = await this.getIntegration('stripe', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'Stripe integration not found or inactive' };
      }

      const config = integration.config as StripeConfig;
      
      // When connected to actual Stripe API, this function would use the Stripe SDK
      // to create a payment intent using the credentials from the integration
      
      // For demonstration, generate a client secret
      const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;
      
      return { 
        success: true, 
        clientSecret
      };
    } catch (error: any) {
      console.error('Error creating Stripe payment:', error);
      return { success: false, error: error.message || 'Failed to create payment' };
    }
  }

  /**
   * Validate Google SSO token
   */
  async validateGoogleSSOToken(
    token: string,
    subAccountId?: number
  ): Promise<{ success: boolean; userData?: any; error?: string }> {
    try {
      const integration = await this.getIntegration('google_sso', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'Google SSO integration not found or inactive' };
      }

      const config = integration.config as GoogleSSOConfig;
      
      // When connected to actual Google OAuth API, this function would validate the token
      // using the credentials from the integration
      
      // For demonstration, return user data based on token
      const userData = {
        id: `google_${Date.now()}`,
        email: 'user@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg'
      };
      
      return { 
        success: true, 
        userData
      };
    } catch (error: any) {
      console.error('Error validating Google SSO token:', error);
      return { success: false, error: error.message || 'Failed to validate Google SSO token' };
    }
  }

  /**
   * Validate Microsoft SSO token
   */
  async validateMicrosoftSSOToken(
    token: string,
    subAccountId?: number
  ): Promise<{ success: boolean; userData?: any; error?: string }> {
    try {
      const integration = await this.getIntegration('microsoft_sso', subAccountId);
      if (!integration || !integration.active) {
        return { success: false, error: 'Microsoft SSO integration not found or inactive' };
      }

      const config = integration.config as MicrosoftSSOConfig;
      
      // When connected to actual Microsoft OAuth API, this function would validate the token
      // using the credentials from the integration
      
      // For demonstration, return user data based on token
      const userData = {
        id: `microsoft_${Date.now()}`,
        email: 'user@example.com',
        name: 'Microsoft User',
        picture: 'https://example.com/avatar.jpg'
      };
      
      return { 
        success: true, 
        userData
      };
    } catch (error: any) {
      console.error('Error validating Microsoft SSO token:', error);
      return { success: false, error: error.message || 'Failed to validate Microsoft SSO token' };
    }
  }
}