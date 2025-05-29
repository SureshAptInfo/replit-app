import React from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { APP_NAME } from "@/lib/constants";


import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Info, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for Email (Brevo) configuration
const emailConfigSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid email address"),
  replyToEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  enabled: z.boolean().default(true),
});

type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

export default function EmailConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = React.useState("");

  // Load current email configuration
  const { data: emailConfig, isLoading, error } = useQuery({
    queryKey: ["/api/admin/config/email"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/config/email");
      if (!res.ok) throw new Error("Failed to load email configuration");
      return res.json();
    }
  });

  // Form setup
  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      apiKey: "",
      senderName: "LeadTrackPro",
      senderEmail: "",
      replyToEmail: "",
      enabled: true,
    },
  });

  // Update form when data is loaded
  React.useEffect(() => {
    if (emailConfig) {
      form.reset({
        apiKey: emailConfig.apiKey === "••••••••" ? "" : emailConfig.apiKey || "",
        senderName: emailConfig.senderName || "LeadTrackPro",
        senderEmail: emailConfig.senderEmail || "",
        replyToEmail: emailConfig.replyToEmail || "",
        enabled: emailConfig.enabled,
      });
    }
  }, [emailConfig, form]);

  // Save email configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (data: EmailConfigFormValues) => {
      const res = await apiRequest("POST", "/api/admin/config/email", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save email configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Configuration Saved",
        description: "The email service configuration has been successfully saved.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/email"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test email connection
  const testConnectionMutation = useMutation({
    mutationFn: async (data: { apiKey: string; senderName: string; senderEmail: string; testRecipient: string }) => {
      const res = await apiRequest("POST", "/api/admin/config/email/test", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message || "Test email sent successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  async function onSubmit(data: EmailConfigFormValues) {
    saveConfigMutation.mutate(data);
  }

  // Test connection handler
  async function onTestConnection() {
    const formData = form.getValues();
    
    if (!testEmail) {
      toast({
        title: "Missing Test Email",
        description: "Please enter a test recipient email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.apiKey || !formData.senderName || !formData.senderEmail) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required email configuration fields.",
        variant: "destructive",
      });
      return;
    }
    
    testConnectionMutation.mutate({
      apiKey: formData.apiKey,
      senderName: formData.senderName,
      senderEmail: formData.senderEmail,
      testRecipient: testEmail
    });
  }

  return (
    <>
      <Helmet>
        <title>Email Configuration | {APP_NAME}</title>
        <meta name="description" content="Configure email service for notifications and communications" />
      </Helmet>
      
      <div className="container py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Configuration</h1>
            <p className="text-muted-foreground">
              Configure Brevo email service for notifications and communications
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2">
            <Input
              className="w-full xs:w-48 md:w-64"
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={onTestConnection}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load email configuration. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Brevo Email Service Configuration</CardTitle>
              <CardDescription>
                Configure Brevo API credentials to enable email sending functionality.
                All sensitive information is encrypted before storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <p>
                    You'll need an active Brevo account and API key to configure email functionality.
                    Brevo (formerly Sendinblue) provides reliable email delivery for transactional emails and marketing communications.
                  </p>
                  <p className="mt-2">
                    <a 
                      href="https://www.brevo.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Visit Brevo website →
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brevo API Key</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                          </FormControl>
                          <FormDescription>
                            {emailConfig?.apiKey === "••••••••" 
                              ? "Leave blank to keep the existing API key" 
                              : "The API key from your Brevo account"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="senderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="LeadTrackPro" />
                            </FormControl>
                            <FormDescription>
                              Name displayed as the email sender
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="senderEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Email</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="no-reply@yourdomain.com" />
                            </FormControl>
                            <FormDescription>
                              Email address used as the sender
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="replyToEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reply-To Email (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="support@yourdomain.com" />
                          </FormControl>
                          <FormDescription>
                            Email address for recipients to reply to, if different from sender
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator className="my-4" />
                    
                    <FormField
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Email Service</FormLabel>
                            <FormDescription>
                              When enabled, the system will send emails for notifications and communications.
                              When disabled, no emails will be sent.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={saveConfigMutation.isPending}
                  >
                    {saveConfigMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 flex flex-col items-start gap-2 text-sm text-muted-foreground">
              <p>The email configuration allows the system to send various types of notifications and communications to users and leads.</p>
              <p>This integration is used for sending welcome emails, lead notifications, task reminders, and marketing communications.</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}