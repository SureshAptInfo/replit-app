import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { WhatsAppTemplatesSync } from '@/components/templates/whatsapp-templates-sync';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<number | null>(null);

  // Get user's subaccounts
  const { data: subAccounts, isLoading: isLoadingSubAccounts } = useQuery({
    queryKey: ['/api/subaccounts'],
    enabled: !!user,
  });

  // Get templates for the selected subaccount
  const { 
    data: templates, 
    isLoading, 
    refetch: refetchTemplates 
  } = useQuery({
    queryKey: ['/api/templates', selectedSubAccountId, activeTab],
    enabled: !!selectedSubAccountId,
  });

  // Set the first subaccount as default if available
  useEffect(() => {
    if (subAccounts && Array.isArray(subAccounts) && subAccounts.length > 0 && !selectedSubAccountId) {
      setSelectedSubAccountId(subAccounts[0].id);
    }
  }, [subAccounts, selectedSubAccountId]);

  // Filter templates based on active tab
  const filteredTemplates = templates?.filter(template => 
    template.type === activeTab
  ) || [];

  // Handle template sync completion
  const handleTemplateSyncComplete = () => {
    refetchTemplates();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Message Templates</h1>
      </div>

      {!selectedSubAccountId && !isLoadingSubAccounts && (
        <Alert variant="destructive" className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>No accounts available</AlertTitle>
          <AlertDescription>
            You need to create or join a subaccount to manage templates.
          </AlertDescription>
        </Alert>
      )}

      {selectedSubAccountId && (
        <>
          <WhatsAppTemplatesSync 
            subAccountId={selectedSubAccountId} 
            onSync={handleTemplateSyncComplete}
          />

          <Tabs defaultValue="whatsapp" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">WhatsApp Templates</h2>
              
              {isLoading ? (
                <p>Loading templates...</p>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant={template.active ? "default" : "outline"}>
                            {template.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.category}
                        </p>
                        <Separator className="my-2" />
                        <div className="mt-2">
                          <Button variant="outline" size="sm" className="w-full">
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No WhatsApp templates found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click the Sync Templates button to import templates from your WhatsApp Business Manager.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">SMS Templates</h2>
              {isLoading ? (
                <p>Loading templates...</p>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant={template.active ? "default" : "outline"}>
                            {template.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.category}
                        </p>
                        <Separator className="my-2" />
                        <div className="mt-2">
                          <Button variant="outline" size="sm" className="w-full">
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No SMS templates found.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
              {isLoading ? (
                <p>Loading templates...</p>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant={template.active ? "default" : "outline"}>
                            {template.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.category || 'No category'}
                        </p>
                        <Separator className="my-2" />
                        <div className="mt-2">
                          <Button variant="outline" size="sm" className="w-full">
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No email templates found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}