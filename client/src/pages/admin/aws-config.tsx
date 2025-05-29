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
import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for AWS S3 configuration
const awsConfigSchema = z.object({
  awsAccessKeyId: z.string().min(1, "Access Key ID is required"),
  awsSecretAccessKey: z.string().min(1, "Secret Access Key is required"),
  awsRegion: z.string().min(1, "Region is required"),
  awsS3Bucket: z.string().min(1, "Bucket name is required"),
  awsS3Endpoint: z.string().optional(),
  enabled: z.boolean().default(true),
});

type AwsConfigFormValues = z.infer<typeof awsConfigSchema>;

export default function AwsConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load current AWS configuration
  const { data: awsConfig, isLoading, error } = useQuery({
    queryKey: ["/api/admin/config/aws"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/config/aws");
      if (!res.ok) throw new Error("Failed to load AWS configuration");
      return res.json();
    }
  });
  
  // Form setup
  const form = useForm<AwsConfigFormValues>({
    resolver: zodResolver(awsConfigSchema),
    defaultValues: {
      awsAccessKeyId: "",
      awsSecretAccessKey: "",
      awsRegion: "us-east-1",
      awsS3Bucket: "",
      awsS3Endpoint: "",
      enabled: true,
    },
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (awsConfig) {
      form.reset({
        awsAccessKeyId: awsConfig.awsAccessKeyId || "",
        // Don't populate the secret access key from the API (it returns masked value)
        awsSecretAccessKey: awsConfig.awsSecretAccessKey === "••••••••" ? "" : awsConfig.awsSecretAccessKey || "",
        awsRegion: awsConfig.awsRegion || "us-east-1",
        awsS3Bucket: awsConfig.awsS3Bucket || "",
        awsS3Endpoint: awsConfig.awsS3Endpoint || "",
        enabled: awsConfig.enabled,
      });
    }
  }, [awsConfig, form]);
  
  // Save AWS configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (data: AwsConfigFormValues) => {
      const res = await apiRequest("POST", "/api/admin/config/aws", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save AWS configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "AWS Configuration Saved",
        description: "The AWS S3 configuration has been successfully saved.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/aws"] });
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
  
  // Test AWS S3 connection
  const testConnectionMutation = useMutation({
    mutationFn: async (data: AwsConfigFormValues) => {
      const res = await apiRequest("POST", "/api/admin/config/aws/test", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: data.message || "AWS S3 connection test was successful.",
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
  async function onSubmit(data: AwsConfigFormValues) {
    saveConfigMutation.mutate(data);
  }
  
  // Test connection handler
  async function onTestConnection() {
    const data = form.getValues();
    if (!data.awsAccessKeyId || !data.awsSecretAccessKey || !data.awsRegion || !data.awsS3Bucket) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required AWS S3 configuration fields.",
        variant: "destructive",
      });
      return;
    }
    
    testConnectionMutation.mutate(data);
  }
  
  return (
    <>
      <Helmet>
        <title>AWS Configuration | {APP_NAME}</title>
        <meta name="description" content="Configure Amazon S3 storage for document and file management" />
      </Helmet>
      
      <div className="container py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AWS Configuration</h1>
            <p className="text-muted-foreground">
              Configure Amazon S3 storage for document and file management
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
              Failed to load AWS configuration. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>AWS S3 Storage Configuration</CardTitle>
              <CardDescription>
                Configure Amazon S3 credentials to enable document and file storage.
                All sensitive information is encrypted before storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Your AWS credentials should have permissions to read, write, and delete objects
                  from the specified S3 bucket. For security, we recommend creating an IAM user
                  with restricted permissions specifically for this application.
                </AlertDescription>
              </Alert>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="awsAccessKeyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AWS Access Key ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="AKIAIOSFODNN7EXAMPLE" />
                          </FormControl>
                          <FormDescription>
                            The access key ID from your AWS credentials
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="awsSecretAccessKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AWS Secret Access Key</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" 
                            />
                          </FormControl>
                          <FormDescription>
                            {awsConfig?.awsSecretAccessKey === "••••••••" 
                              ? "Leave blank to keep the existing secret key" 
                              : "The secret access key from your AWS credentials"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="awsRegion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AWS Region</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="us-east-1" />
                            </FormControl>
                            <FormDescription>
                              The AWS region where your S3 bucket is located
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="awsS3Bucket"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>S3 Bucket Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="my-app-files" />
                            </FormControl>
                            <FormDescription>
                              The name of your S3 bucket for storing files
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="awsS3Endpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom S3 Endpoint (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://s3.custom-provider.com" />
                          </FormControl>
                          <FormDescription>
                            Custom endpoint URL for S3-compatible storage (MinIO, etc.). Leave blank for AWS S3.
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
                            <FormLabel>Enable AWS S3 Storage</FormLabel>
                            <FormDescription>
                              When enabled, document and file storage will use AWS S3. 
                              When disabled, file uploads will be rejected.
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
              <p>The AWS S3 configuration allows the system to store and manage files and documents securely in the cloud.</p>
              <p>This integration is used for storing lead documents, email attachments, and other files uploaded by users.</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}