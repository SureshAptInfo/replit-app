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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Info, Loader2, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for Payment (Stripe) configuration
const paymentConfigSchema = z.object({
  secretKey: z.string().min(1, "Secret Key is required"),
  publicKey: z.string().min(1, "Public Key is required"),
  webhookSecret: z.string().optional(),
  currency: z.string().min(3).max(3),
  enabled: z.boolean().default(true),
});

type PaymentConfigFormValues = z.infer<typeof paymentConfigSchema>;

// Currency options
const currencies = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "BRL", label: "Brazilian Real (BRL)" },
  { code: "MXN", label: "Mexican Peso (MXN)" },
];

export default function PaymentConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load current payment configuration
  const { data: paymentConfig, isLoading, error } = useQuery({
    queryKey: ["/api/admin/config/stripe"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/config/stripe");
      if (!res.ok) throw new Error("Failed to load payment configuration");
      return res.json();
    }
  });
  
  // Form setup
  const form = useForm<PaymentConfigFormValues>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      secretKey: "",
      publicKey: "",
      webhookSecret: "",
      currency: "USD",
      enabled: true,
    },
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (paymentConfig) {
      form.reset({
        secretKey: paymentConfig.secretKey === "••••••••" ? "" : paymentConfig.secretKey || "",
        publicKey: paymentConfig.publicKey || "",
        webhookSecret: paymentConfig.webhookSecret === "••••••••" ? "" : paymentConfig.webhookSecret || "",
        currency: paymentConfig.currency || "USD",
        enabled: paymentConfig.enabled,
      });
    }
  }, [paymentConfig, form]);
  
  // Save payment configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (data: PaymentConfigFormValues) => {
      const res = await apiRequest("POST", "/api/admin/config/stripe", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save payment configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Configuration Saved",
        description: "The Stripe payment configuration has been successfully saved.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/stripe"] });
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
  
  // Test Stripe connection
  const testConnectionMutation = useMutation({
    mutationFn: async (secretKey: string) => {
      const res = await apiRequest("POST", "/api/admin/config/stripe/test", { secretKey });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: data.message || "Stripe API connection test was successful.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  async function onSubmit(data: PaymentConfigFormValues) {
    saveConfigMutation.mutate(data);
  }
  
  // Test connection handler
  async function onTestConnection() {
    const secretKey = form.getValues("secretKey");
    
    if (!secretKey) {
      toast({
        title: "Missing Secret Key",
        description: "Please enter a Stripe Secret Key to test the connection.",
        variant: "destructive",
      });
      return;
    }
    
    testConnectionMutation.mutate(secretKey);
  }
  
  return (
    <>
      <Helmet>
        <title>Payment Configuration | {APP_NAME}</title>
        <meta name="description" content="Configure Stripe payment gateway for subscription billing" />
      </Helmet>
      
      <div className="container py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Configuration</h1>
            <p className="text-muted-foreground">
              Configure Stripe payment gateway for subscription billing
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onTestConnection}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Info className="mr-2 h-4 w-4" />
                  Test Connection
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
              Failed to load payment configuration. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Stripe Payment Gateway Configuration</CardTitle>
              <CardDescription>
                Configure Stripe API credentials to enable payment processing and subscription billing.
                All sensitive information is encrypted before storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <p>
                    You'll need an active Stripe account and API keys to configure payment functionality.
                    Stripe is a secure payment processor for subscription billing, one-time payments, and more.
                  </p>
                  <p className="mt-2">
                    <a 
                      href="https://dashboard.stripe.com/apikeys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Get your Stripe API keys →
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stripe Secret Key</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="sk_test_..." 
                            />
                          </FormControl>
                          <FormDescription>
                            {paymentConfig?.secretKey === "••••••••" 
                              ? "Leave blank to keep the existing secret key" 
                              : "The secret key from your Stripe account (starts with 'sk_')"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="publicKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stripe Public Key</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="pk_test_..." 
                            />
                          </FormControl>
                          <FormDescription>
                            The publishable key from your Stripe account (starts with 'pk_')
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook Secret (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="whsec_..." 
                            />
                          </FormControl>
                          <FormDescription>
                            {paymentConfig?.webhookSecret === "••••••••" 
                              ? "Leave blank to keep the existing webhook secret" 
                              : "The webhook signing secret for verifying webhook events"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The default currency for payments and subscriptions
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
                            <FormLabel>Enable Payment Processing</FormLabel>
                            <FormDescription>
                              When enabled, the system will process payments and subscription billing through Stripe.
                              When disabled, payment features will be unavailable.
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
              <p>The payment configuration allows the system to process subscription payments and handle billing for your agency and client accounts.</p>
              <p>This integration is used for subscription management, invoicing, and payment processing across the platform.</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}