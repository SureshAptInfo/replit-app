import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { seedInitialData } from "./seed-data";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session with proper deployment configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'leadtrackpro-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on each request
  cookie: { 
    secure: false, // Set to false for development/Replit deployment
    httpOnly: true, // Security: prevent XSS attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days instead of 24 hours
    sameSite: 'lax' // Allow cross-site requests for deployment
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Direct WhatsApp webhook routes (before any middleware or auth)
app.get('/api/whatsapp/webhook', (req, res) => {
  try {
    console.log('WhatsApp webhook verification attempt');
    console.log('Query params:', req.query);
    
    // Get the verification details
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;
    
    // Accept any verification during testing phase
    if (mode && challenge) {
      console.log('WhatsApp webhook verification successful');
      return res.status(200).send(challenge);
    }
    
    console.log('WhatsApp webhook verification failed');
    return res.sendStatus(403);
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error);
    return res.sendStatus(500);
  }
});

// Handle incoming WhatsApp messages (POST webhook)
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    console.log('WhatsApp incoming message webhook received');
    console.log('Webhook body:', JSON.stringify(req.body, null, 2));
    
    // Import the WhatsApp service function
    const { processWhatsAppWebhook } = await import('./services/whatsapp-service');
    
    // Process the webhook payload
    await processWhatsAppWebhook(req.body);
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp incoming message webhook error:', error);
    res.status(200).send('OK'); // Still respond with 200 to prevent retries
  }
});

// Configure Passport local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      // In a real app, would use bcrypt to compare password hashes
      // For this demo, simple comparison (replace with proper hashing in production)
      if (password !== 'password' && password !== 'admin123') { // Default password for demo
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize/deserialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed data for team members and settings
  await seedInitialData();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
