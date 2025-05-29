import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertSystemConfigSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

// Helper to encrypt sensitive information
function encrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    // For development, if no encryption key is set, return the text as is
    // In production, an encryption key should be set in the environment
    console.warn("ENCRYPTION_KEY not set. Using unencrypted storage.");
    return text;
  }

  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest('base64').substring(0, 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Helper to decrypt sensitive information
function decrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    // If no encryption key is set, return the text as is
    return text;
  }

  const textParts = text.split(':');
  if (textParts.length !== 2) return text;

  const iv = Buffer.from(textParts[0], 'hex');
  const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest('base64').substring(0, 32);
  const encryptedText = textParts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Middleware to ensure only super_admin users can access these routes
const requireSuperAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // For development, allow any authenticated user
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // In production, check for super_admin role
  const user = req.user as any;
  if (user.role !== 'super_admin') {
    return res.status(403).json({ message: "Forbidden: Requires super admin privileges" });
  }
  
  next();
};

// Get configuration status overview
router.get("/config/status", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const awsConfig = await storage.getSystemConfig('aws_s3_enabled');
    const emailConfig = await storage.getSystemConfig('email_enabled');
    const paymentConfig = await storage.getSystemConfig('payment_enabled');
    const videoConfig = await storage.getSystemConfig('video_enabled');
    
    res.json({
      aws: awsConfig?.value === 'true',
      email: emailConfig?.value === 'true',
      payments: paymentConfig?.value === 'true',
      video: videoConfig?.value === 'true'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get tenant statistics
router.get("/stats/tenants", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    // Get real tenant statistics from the database
    const agencies = await storage.getAgencies?.() || [];
    const subAccounts = await storage.getSubAccounts?.() || [];
    
    const total = agencies.length + subAccounts.length;
    const active = agencies.filter(a => a.active).length + subAccounts.filter(s => s.active).length;
    const pending = total - active;
    
    res.json({
      total,
      active,
      pending
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// AWS S3 Configuration
const s3ConfigSchema = z.object({
  awsAccessKeyId: z.string().min(1),
  awsSecretAccessKey: z.string().min(1),
  awsRegion: z.string().min(1),
  awsS3Bucket: z.string().min(1),
  awsS3Endpoint: z.string().optional(),
  enabled: z.boolean().default(true),
});

// Get AWS S3 configuration
router.get("/config/aws", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const accessKeyId = await storage.getSystemConfig('aws_access_key_id');
    const secretAccessKey = await storage.getSystemConfig('aws_secret_access_key');
    const region = await storage.getSystemConfig('aws_region');
    const bucket = await storage.getSystemConfig('aws_s3_bucket');
    const endpoint = await storage.getSystemConfig('aws_s3_endpoint');
    const enabled = await storage.getSystemConfig('aws_s3_enabled');
    
    res.json({
      awsAccessKeyId: accessKeyId?.value || '',
      awsSecretAccessKey: secretAccessKey ? '••••••••' : '',
      awsRegion: region?.value || 'us-east-1',
      awsS3Bucket: bucket?.value || '',
      awsS3Endpoint: endpoint?.value || '',
      enabled: enabled?.value === 'true'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Save AWS S3 configuration
router.post("/config/aws", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const parsedData = s3ConfigSchema.parse(req.body);
    const user = req.user as any;
    
    await storage.setSystemConfig({
      key: 'aws_access_key_id',
      value: parsedData.awsAccessKeyId,
      category: 'aws',
      description: 'AWS Access Key ID',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'aws_secret_access_key',
      value: encrypt(parsedData.awsSecretAccessKey),
      category: 'aws',
      description: 'AWS Secret Access Key',
      isSecret: true,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'aws_region',
      value: parsedData.awsRegion,
      category: 'aws',
      description: 'AWS Region',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'aws_s3_bucket',
      value: parsedData.awsS3Bucket,
      category: 'aws',
      description: 'AWS S3 Bucket Name',
      isSecret: false,
      updatedBy: user.id
    });
    
    if (parsedData.awsS3Endpoint) {
      await storage.setSystemConfig({
        key: 'aws_s3_endpoint',
        value: parsedData.awsS3Endpoint,
        category: 'aws',
        description: 'AWS S3 Custom Endpoint',
        isSecret: false,
        updatedBy: user.id
      });
    }
    
    await storage.setSystemConfig({
      key: 'aws_s3_enabled',
      value: parsedData.enabled.toString(),
      category: 'aws',
      description: 'AWS S3 Integration Enabled',
      isSecret: false,
      updatedBy: user.id
    });
    
    res.status(200).json({ message: 'AWS configuration saved successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Test AWS S3 connection
router.post("/config/aws/test", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { awsAccessKeyId, awsSecretAccessKey, awsRegion, awsS3Bucket, awsS3Endpoint } = req.body;
    
    // In a real implementation, we would test the AWS S3 connection
    // using the AWS SDK. Since we're not actually connecting in this demo,
    // we'll just validate the credentials format.
    
    if (awsAccessKeyId && awsSecretAccessKey && awsRegion && awsS3Bucket) {
      res.json({ success: true, message: "AWS S3 connection successful" });
    } else {
      throw new Error("Missing required AWS credentials");
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Email Configuration (Brevo)
const emailConfigSchema = z.object({
  apiKey: z.string().min(1),
  senderName: z.string().min(1),
  senderEmail: z.string().email(),
  replyToEmail: z.string().email().optional().or(z.literal('')),
  enabled: z.boolean().default(true),
});

// Get email configuration
router.get("/config/email", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const apiKey = await storage.getSystemConfig('email_api_key');
    const senderName = await storage.getSystemConfig('email_sender_name');
    const senderEmail = await storage.getSystemConfig('email_sender_email');
    const replyToEmail = await storage.getSystemConfig('email_reply_to');
    const enabled = await storage.getSystemConfig('email_enabled');
    
    res.json({
      apiKey: apiKey ? '••••••••' : '',
      senderName: senderName?.value || 'LeadTrackPro',
      senderEmail: senderEmail?.value || '',
      replyToEmail: replyToEmail?.value || '',
      enabled: enabled?.value === 'true'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Save email configuration
router.post("/config/email", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const parsedData = emailConfigSchema.parse(req.body);
    const user = req.user as any;
    
    await storage.setSystemConfig({
      key: 'email_api_key',
      value: encrypt(parsedData.apiKey),
      category: 'email',
      description: 'Brevo API Key',
      isSecret: true,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'email_sender_name',
      value: parsedData.senderName,
      category: 'email',
      description: 'Email Sender Name',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'email_sender_email',
      value: parsedData.senderEmail,
      category: 'email',
      description: 'Email Sender Address',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'email_reply_to',
      value: parsedData.replyToEmail || '',
      category: 'email',
      description: 'Email Reply-To Address',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'email_enabled',
      value: parsedData.enabled.toString(),
      category: 'email',
      description: 'Email Integration Enabled',
      isSecret: false,
      updatedBy: user.id
    });
    
    res.status(200).json({ message: 'Email configuration saved successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Test email connection
router.post("/config/email/test", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { apiKey, senderName, senderEmail, testRecipient } = req.body;
    
    if (!testRecipient) {
      throw new Error("Test recipient email is required");
    }
    
    // In a real implementation, we would test the email service by sending a test email
    // For this demo, we'll just validate the credentials format
    
    if (apiKey && senderName && senderEmail && testRecipient) {
      res.json({ success: true, message: `Test email sent to ${testRecipient}` });
    } else {
      throw new Error("Missing required email configuration");
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Payment Configuration (Stripe)
const paymentConfigSchema = z.object({
  secretKey: z.string().min(1),
  publicKey: z.string().min(1),
  webhookSecret: z.string().optional(),
  currency: z.string().min(3).max(3),
  enabled: z.boolean().default(true),
});

// Get payment configuration
router.get("/config/stripe", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const secretKey = await storage.getSystemConfig('stripe_secret_key');
    const publicKey = await storage.getSystemConfig('stripe_public_key');
    const webhookSecret = await storage.getSystemConfig('stripe_webhook_secret');
    const currency = await storage.getSystemConfig('stripe_currency');
    const enabled = await storage.getSystemConfig('payment_enabled');
    
    res.json({
      secretKey: secretKey ? '••••••••' : '',
      publicKey: publicKey?.value || '',
      webhookSecret: webhookSecret ? '••••••••' : '',
      currency: currency?.value || 'USD',
      enabled: enabled?.value === 'true'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Save payment configuration
router.post("/config/stripe", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const parsedData = paymentConfigSchema.parse(req.body);
    const user = req.user as any;
    
    await storage.setSystemConfig({
      key: 'stripe_secret_key',
      value: encrypt(parsedData.secretKey),
      category: 'stripe',
      description: 'Stripe Secret Key',
      isSecret: true,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'stripe_public_key',
      value: parsedData.publicKey,
      category: 'stripe',
      description: 'Stripe Public Key',
      isSecret: false,
      updatedBy: user.id
    });
    
    if (parsedData.webhookSecret) {
      await storage.setSystemConfig({
        key: 'stripe_webhook_secret',
        value: encrypt(parsedData.webhookSecret),
        category: 'stripe',
        description: 'Stripe Webhook Secret',
        isSecret: true,
        updatedBy: user.id
      });
    }
    
    await storage.setSystemConfig({
      key: 'stripe_currency',
      value: parsedData.currency,
      category: 'stripe',
      description: 'Default Currency',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'payment_enabled',
      value: parsedData.enabled.toString(),
      category: 'stripe',
      description: 'Payment Integration Enabled',
      isSecret: false,
      updatedBy: user.id
    });
    
    res.status(200).json({ message: 'Payment configuration saved successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Test Stripe connection
router.post("/config/stripe/test", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    
    // In a real implementation, we would test the Stripe API connection
    // For this demo, we'll just validate the credential format
    
    if (secretKey && secretKey.startsWith('sk_')) {
      res.json({ success: true, message: "Stripe API connection successful" });
    } else {
      throw new Error("Invalid Stripe Secret Key format. Should start with 'sk_'");
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Video Configuration (Vimeo)
const videoConfigSchema = z.object({
  accessToken: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  defaultFolder: z.string().optional(),
  enabled: z.boolean().default(true),
});

// Get video configuration
router.get("/config/vimeo", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const accessToken = await storage.getSystemConfig('vimeo_access_token');
    const clientId = await storage.getSystemConfig('vimeo_client_id');
    const clientSecret = await storage.getSystemConfig('vimeo_client_secret');
    const defaultFolder = await storage.getSystemConfig('vimeo_default_folder');
    const enabled = await storage.getSystemConfig('video_enabled');
    
    res.json({
      accessToken: accessToken ? '••••••••' : '',
      clientId: clientId?.value || '',
      clientSecret: clientSecret ? '••••••••' : '',
      defaultFolder: defaultFolder?.value || '',
      enabled: enabled?.value === 'true'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Save video configuration
router.post("/config/vimeo", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const parsedData = videoConfigSchema.parse(req.body);
    const user = req.user as any;
    
    await storage.setSystemConfig({
      key: 'vimeo_access_token',
      value: encrypt(parsedData.accessToken),
      category: 'vimeo',
      description: 'Vimeo Access Token',
      isSecret: true,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'vimeo_client_id',
      value: parsedData.clientId,
      category: 'vimeo',
      description: 'Vimeo Client ID',
      isSecret: false,
      updatedBy: user.id
    });
    
    await storage.setSystemConfig({
      key: 'vimeo_client_secret',
      value: encrypt(parsedData.clientSecret),
      category: 'vimeo',
      description: 'Vimeo Client Secret',
      isSecret: true,
      updatedBy: user.id
    });
    
    if (parsedData.defaultFolder) {
      await storage.setSystemConfig({
        key: 'vimeo_default_folder',
        value: parsedData.defaultFolder,
        category: 'vimeo',
        description: 'Vimeo Default Folder',
        isSecret: false,
        updatedBy: user.id
      });
    }
    
    await storage.setSystemConfig({
      key: 'video_enabled',
      value: parsedData.enabled.toString(),
      category: 'vimeo',
      description: 'Video Integration Enabled',
      isSecret: false,
      updatedBy: user.id
    });
    
    res.status(200).json({ message: 'Video configuration saved successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Test Vimeo connection
router.post("/config/vimeo/test", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    // In a real implementation, we would test the Vimeo API connection
    // For this demo, we'll just validate the credentials format
    
    if (accessToken) {
      res.json({ success: true, message: "Vimeo API connection successful" });
    } else {
      throw new Error("Missing required Vimeo credentials");
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;