import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, PhoneCall, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

// Form schema for WhatsApp connection
const formSchema = z.object({
  apiKey: z.string().min(1, "System User Token is required"),
  businessPhoneNumber: z.string().min(1, "Phone Number ID is required"),
  verifyToken: z.string().min(1, "Verify token is required"),
});

export interface WhatsAppConnectProps {
  currentConfig?: {
    apiKey?: string;
    businessPhoneNumber?: string;
    verifyToken?: string;
    connected: boolean;
    lastVerified?: string;
  };
  subAccountId: number;
  onConnect?: () => void;
}

export function WhatsAppConnect({ currentConfig, subAccountId, onConnect }: WhatsAppConnectProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(currentConfig?.connected || false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>(
    currentConfig?.connected ? 'connected' : 'disconnected'
  );

  // Initialize form with current config values if available
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: currentConfig?.apiKey || "",
      businessPhoneNumber: currentConfig?.businessPhoneNumber || "",
      verifyToken: currentConfig?.verifyToken || "",
    },
  });

  // Connect to WhatsApp Business API
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsConnecting(true);
    setConnectionSuccess(false);
    setConnectionError(null);
    
    try {
      // Add a timestamp to track when this configuration was added/updated
      const timestamp = new Date().toISOString();
      
      const response = await apiRequest("POST", "/api/whatsapp/connect", {
        ...values,
        subAccountId,
        lastVerified: timestamp,  // Track when this configuration was set up
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionSuccess(true);
        toast({
          title: "Connection Successful",
          description: "WhatsApp Business API connected successfully",
        });
        
        // Call the onConnect callback if provided
        if (onConnect) {
          onConnect();
        }
      } else {
        setConnectionError(data.message || "Failed to connect to WhatsApp Business API");
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to WhatsApp Business API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("WhatsApp connection error:", error);
      setConnectionError("An unexpected error occurred");
      toast({
        title: "Connection Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Verify WhatsApp connection
  const handleVerify = async () => {
    setIsVerifying(true);
    
    try {
      const response = await apiRequest("GET", `/api/whatsapp/verify?subAccountId=${subAccountId}`);
      const data = await response.json();

      if (response.ok && data.connected) {
        toast({
          title: "Verification Successful",
          description: "WhatsApp Business API connection verified",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Failed to verify WhatsApp connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("WhatsApp verification error:", error);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Check connection status on component load and periodically
  useEffect(() => {
    const checkStatus = async () => {
      if (subAccountId) {
        setConnectionStatus('checking');
        try {
          const response = await apiRequest('GET', `/api/whatsapp/status?subAccountId=${subAccountId}`);
          const data = await response.json();
          
          // Check for the connected status (more specific than just 'available')
          if (data.connected) {
            setConnectionStatus('connected');
            setConnectionSuccess(true);
          } else if (data.configured) {
            // It's configured but not connected (inactive)
            setConnectionStatus('disconnected');
            setConnectionSuccess(false);
          } else {
            // Not even configured
            setConnectionStatus('disconnected');
            setConnectionSuccess(false);
          }
        } catch (error) {
          console.error('Error checking WhatsApp status:', error);
          setConnectionStatus('disconnected');
          setConnectionSuccess(false);
        }
      }
    };
    
    // Check immediately
    checkStatus();
    
    // And then check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [subAccountId]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <PhoneCall className="mr-2 h-5 w-5" />
            WhatsApp Business API
          </CardTitle>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <Badge className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            )}
            {connectionStatus === 'disconnected' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
            {connectionStatus === 'checking' && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking...
              </Badge>
            )}
            
            {currentConfig?.lastVerified && (
              <span className="text-xs text-muted-foreground">
                Last verified: {new Date(currentConfig.lastVerified).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <CardDescription>
          Connect your WhatsApp Business API to send and receive messages with your leads.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System User Token</FormLabel>
                  <FormDescription>
                    Use a System User Token from Meta Business Manager for better stability and permissions
                  </FormDescription>
                  <FormControl>
                    <Input 
                      placeholder="Enter your System User Token (EAAxxxxx...)" 
                      {...field} 
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessPhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number ID</FormLabel>
                  <FormDescription>
                    Enter the Phone Number ID from your WhatsApp Business API dashboard (not the actual phone number)
                  </FormDescription>
                  <FormControl>
                    <Input 
                      placeholder="Enter Phone Number ID (e.g., 123456789012345)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verifyToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verify Token</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your WhatsApp Verify Token" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <Button 
                type="submit" 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : connectionSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Connected
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>
          </form>
        </Form>

        {connectionError && (
          <div className="mt-4 text-sm text-red-500">
            {connectionError}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {currentConfig?.connected && (
          <Button 
            variant="outline" 
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Connection"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}