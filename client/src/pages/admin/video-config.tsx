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
import { AlertCircle, CheckCircle, Info, Loader2, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for Video (Vimeo) configuration
const vimeoSchema = z.object({
  accessToken: z.string().min(1, "Access Token is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  defaultFolder: z.string().optional(),
  enabled: z.boolean().default(true),
});

type VimeoFormValues = z.infer<typeof vimeoSchema>;

export default function VideoConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load current Vimeo configuration
  const { data: vimeoConfig, isLoading, error } = useQuery({
    queryKey: ["/api/admin/config/vimeo"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/config/vimeo");
      if (!res.ok) throw new Error("Failed to load video configuration");
      return res.json();
    }
  });
  
  // Form setup
  const form = useForm<VimeoFormValues>({
    resolver: zodResolver(vimeoSchema),
    defaultValues: {
      accessToken: "",
      clientId: "",
      clientSecret: "",
      defaultFolder: "",
      enabled: true,
    },
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (vimeoConfig) {
      form.reset({
        accessToken: vimeoConfig.accessToken === "••••••••" ? "" : vimeoConfig.accessToken || "",
        clientId: vimeoConfig.clientId || "",
        clientSecret: vimeoConfig.clientSecret === "••••••••" ? "" : vimeoConfig.clientSecret || "",
        defaultFolder: vimeoConfig.defaultFolder || "",
        enabled: vimeoConfig.enabled,
      });
    }
  }, [vimeoConfig, form]);
  
  // Save Vimeo configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (data: VimeoFormValues) => {
      const res = await apiRequest("POST", "/api/admin/config/vimeo", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save video configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Video Configuration Saved",
        description: "The Vimeo video configuration has been successfully saved.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/vimeo"] });
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
  
  // Test Vimeo connection
  const testConnectionMutation = useMutation({
    mutationFn: async (data: VimeoFormValues) => {
      const res = await apiRequest("POST", "/api/admin/config/vimeo/test", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: data.message || "Vimeo API connection test was successful.",
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
  async function onSubmit(data: VimeoFormValues) {
    saveConfigMutation.mutate(data);
  }
  
  // Test connection handler
  async function onTestConnection() {
    const data = form.getValues();
    if (!data.accessToken || !data.clientId || !data.clientSecret) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required Vimeo API credentials.",
        variant: "destructive",
      });
      return;
    }
    
    testConnectionMutation.mutate(data);
  }
  
  return (
    <>
      <Helmet>
        <title>Video Configuration | {APP_NAME}</title>
        <meta name="description" content="Configure Vimeo for video storage and management" />
      </Helmet>
      
      <div className="container py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Configuration</h1>
            <p className="text-muted-foreground">
              Configure Vimeo for video storage and management
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
              Failed to load video configuration. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Vimeo Video Service Configuration</CardTitle>
              <CardDescription>
                Configure Vimeo API credentials to enable video upload and management.
                All sensitive information is encrypted before storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <p>
                    You'll need a Vimeo account with API access to configure video functionality.
                    Vimeo provides reliable video hosting with privacy controls and customization options.
                  </p>
                  <p className="mt-2">
                    <a 
                      href="https://developer.vimeo.com/apps" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Get your Vimeo API credentials →
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vimeo Access Token</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                            />
                          </FormControl>
                          <FormDescription>
                            {vimeoConfig?.accessToken === "••••••••" 
                              ? "Leave blank to keep the existing access token" 
                              : "The access token from your Vimeo API app"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                            </FormControl>
                            <FormDescription>
                              The client ID from your Vimeo API app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="clientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Secret</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                              />
                            </FormControl>
                            <FormDescription>
                              {vimeoConfig?.clientSecret === "••••••••" 
                                ? "Leave blank to keep the existing client secret" 
                                : "The client secret from your Vimeo API app"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="defaultFolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Folder (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="leadtrackpro-videos" />
                          </FormControl>
                          <FormDescription>
                            A default folder name for organizing uploaded videos in your Vimeo account
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
                            <FormLabel>Enable Vimeo Integration</FormLabel>
                            <FormDescription>
                              When enabled, the system will use Vimeo for video storage and management.
                              When disabled, video uploads will be unavailable.
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
              <p>The video configuration allows the system to store and manage marketing videos, tutorials, and lead engagement content.</p>
              <p>This integration enables users to upload, organize, and embed videos throughout the platform for better lead engagement.</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}