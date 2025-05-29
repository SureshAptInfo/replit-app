import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { WhatsAppConnect } from "@/components/integrations/whatsapp-connect";
import { 
  MessageSquare, 
  Mail, 
  CreditCard, 
  FileText, 
  Video, 
  CloudUpload, 
  MessageCircle 
} from "lucide-react";
import { WhatsAppTemplatesSync } from "@/components/templates/whatsapp-templates-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubAccount, setSelectedSubAccount] = useState<number>(1); // Default to first subaccount
  const [activeTab, setActiveTab] = useState("whatsapp");

  // Get available subaccounts
  const { data: subaccounts = [] } = useQuery({
    queryKey: ['/api/subaccounts'],
    enabled: !!user,
  });

  // Get integrations for the selected subaccount
  const { 
    data: integrations = [], 
    isLoading: isLoadingIntegrations,
    refetch: refetchIntegrations 
  } = useQuery({
    queryKey: ['/api/integrations', selectedSubAccount],
    enabled: !!selectedSubAccount,
  });

  useEffect(() => {
    if (subaccounts.length > 0 && !selectedSubAccount) {
      setSelectedSubAccount(subaccounts[0].id);
    }
  }, [subaccounts, selectedSubAccount]);

  // Get WhatsApp configuration if exists
  const whatsappIntegration = integrations.find((i: any) => i.type === 'whatsapp');
  const whatsappConfig = whatsappIntegration?.config || { connected: false };
  
  // Get other integrations
  const emailIntegration = integrations.find((i: any) => i.type === 'brevo' || i.type === 'sendgrid');
  const smsIntegration = integrations.find((i: any) => i.type === 'twilio');
  const stripeIntegration = integrations.find((i: any) => i.type === 'stripe');
  const s3Integration = integrations.find((i: any) => i.type === 'aws_s3');
  const vimeoIntegration = integrations.find((i: any) => i.type === 'vimeo');
  
  // Refresh integrations after a connection is made
  const handleIntegrationUpdate = () => {
    refetchIntegrations();
    toast({
      title: "Integration Updated",
      description: "Your integration settings have been updated successfully.",
    });
  };

  // Get templates after WhatsApp is connected
  const handleWhatsAppConnect = () => {
    handleIntegrationUpdate();
    
    // You may want to sync templates automatically here
    if (activeTab === "whatsapp") {
      setTimeout(() => {
        toast({
          title: "WhatsApp Connected",
          description: "You can now sync your WhatsApp templates from the Templates tab.",
        });
      }, 1000);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-500 mt-1">
            Connect your accounts to enhance your lead management capabilities.
          </p>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
            {whatsappIntegration && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                Connected
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
            {emailIntegration && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                Connected
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            SMS
            {smsIntegration && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                Connected
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
            {stripeIntegration && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                Connected
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
            {s3Integration && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                Connected
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video
            {vimeoIntegration && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                Connected
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Integration */}
        <TabsContent value="whatsapp">
          <div className="grid gap-6">
            <WhatsAppConnect 
              currentConfig={whatsappConfig}
              subAccountId={selectedSubAccount}
              onConnect={handleWhatsAppConnect}
            />
            
            {whatsappIntegration && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">WhatsApp Templates</CardTitle>
                  <CardDescription>
                    Sync and manage your WhatsApp message templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WhatsAppTemplatesSync subAccountId={selectedSubAccount} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Email Integration */}
        <TabsContent value="email">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>
                Connect your email service to send automated emails to your leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Email integration will be available in the next update. You'll be able to connect your preferred email service provider.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Integration */}
        <TabsContent value="sms">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>SMS Integration</CardTitle>
              <CardDescription>
                Connect your SMS provider to send text messages to your leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  SMS integration will be available in the next update. You'll be able to connect your preferred SMS service provider.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Integration */}
        <TabsContent value="payments">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payments Integration</CardTitle>
              <CardDescription>
                Connect your payment gateway to process payments from your leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Payments integration will be available in the next update. You'll be able to connect Stripe for payment processing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Storage Integration */}
        <TabsContent value="documents">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Document Storage Integration</CardTitle>
              <CardDescription>
                Connect to a cloud storage provider for document management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Document storage integration will be available in the next update. You'll be able to connect Amazon S3 for secure document storage.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Integration */}
        <TabsContent value="video">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Video Integration</CardTitle>
              <CardDescription>
                Connect to a video hosting provider for your video content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Video integration will be available in the next update. You'll be able to connect Vimeo for video hosting and management.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}