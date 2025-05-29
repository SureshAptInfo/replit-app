import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { IntegrationService } from '../services/integration-service';
import { z } from 'zod';
import multer from 'multer';

// Initialize multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Initialize the integration service
const integrationService = new IntegrationService(storage);

// Input validation schemas
const sendWhatsAppSchema = z.object({
  to: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
  subAccountId: z.number().optional(),
});

const sendSMSSchema = z.object({
  to: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
  subAccountId: z.number().optional(),
});

const sendEmailSchema = z.object({
  to: z.array(z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().optional(),
  })).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  from: z.object({
    email: z.string().email("Valid sender email is required"),
    name: z.string().optional(),
  }).optional(),
  subAccountId: z.number().optional(),
});

const createPaymentSchema = z.object({
  amount: z.number().min(0.5, "Amount must be at least 0.5"),
  currency: z.string().min(3, "Currency code is required (e.g., USD)"),
  description: z.string().optional(),
  customerEmail: z.string().email("Valid customer email is required").optional(),
  subAccountId: z.number().optional(),
});

const ssoTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  provider: z.enum(["google", "microsoft"]),
  subAccountId: z.number().optional(),
});

// Helper function to handle validation errors
function handleValidationErrors<T>(schema: z.ZodType<T>, data: any, res: Response): T | null {
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.issues.map(issue => issue.message).join(", ")
      });
      return null;
    }
    return result.data;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Validation error"
    });
    return null;
  }
}

// Create router
export const integrationRouter = Router();

// Define routes

/**
 * Send WhatsApp message
 */
integrationRouter.post('/whatsapp/send', async (req: Request, res: Response) => {
  const data = handleValidationErrors(sendWhatsAppSchema, req.body, res);
  if (!data) return;

  const { to, message, subAccountId } = data;
  
  const result = await integrationService.sendWhatsAppMessage(to, message, subAccountId);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

/**
 * Send SMS via Twilio
 */
integrationRouter.post('/sms/send', async (req: Request, res: Response) => {
  const data = handleValidationErrors(sendSMSSchema, req.body, res);
  if (!data) return;

  const { to, message, subAccountId } = data;
  
  const result = await integrationService.sendSMS(to, message, subAccountId);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

/**
 * Send email via BREVO
 */
integrationRouter.post('/email/send', async (req: Request, res: Response) => {
  const data = handleValidationErrors(sendEmailSchema, req.body, res);
  if (!data) return;

  const { to, subject, htmlContent, textContent, from, subAccountId } = data;
  
  const result = await integrationService.sendEmail(to, subject, htmlContent, textContent, from, subAccountId);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

/**
 * Upload file to S3
 */
integrationRouter.post('/s3/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  const fileName = req.body.fileName || req.file.originalname;
  const contentType = req.file.mimetype;
  const subAccountId = req.body.subAccountId ? parseInt(req.body.subAccountId) : undefined;
  
  const result = await integrationService.uploadFileToS3(
    fileName,
    req.file.buffer,
    contentType,
    subAccountId
  );
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

/**
 * Upload video to Vimeo
 */
integrationRouter.post('/vimeo/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  const { title, description } = req.body;
  const subAccountId = req.body.subAccountId ? parseInt(req.body.subAccountId) : undefined;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }
  
  const result = await integrationService.uploadVideoToVimeo(
    title,
    description || '',
    req.file.buffer,
    subAccountId
  );
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

/**
 * Create Stripe payment
 */
integrationRouter.post('/stripe/payment', async (req: Request, res: Response) => {
  const validationResult = createPaymentSchema.safeParse(req.body);
  const validationError = handleValidationErrors(validationResult, res);
  if (validationError) return validationError;

  const { amount, currency, description, customerEmail, subAccountId } = validationResult.data;
  
  const result = await integrationService.createPayment(
    amount,
    currency,
    description || '',
    customerEmail,
    subAccountId
  );
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

/**
 * Validate SSO token (Google/Microsoft)
 */
integrationRouter.post('/sso/validate', async (req: Request, res: Response) => {
  const validationResult = ssoTokenSchema.safeParse(req.body);
  const validationError = handleValidationErrors(validationResult, res);
  if (validationError) return validationError;

  const { token, provider, subAccountId } = validationResult.data;
  
  let result;
  if (provider === 'google') {
    result = await integrationService.validateGoogleSSOToken(token, subAccountId);
  } else if (provider === 'microsoft') {
    result = await integrationService.validateMicrosoftSSOToken(token, subAccountId);
  } else {
    return res.status(400).json({
      success: false,
      error: 'Unsupported SSO provider'
    });
  }
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return res.json(result);
});

export default integrationRouter;