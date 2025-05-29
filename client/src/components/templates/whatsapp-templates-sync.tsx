import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Check, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WhatsAppTemplatesSyncProps {
  subAccountId: number;
  onSync?: () => void;
}

export function WhatsAppTemplatesSync({ subAccountId, onSync }: WhatsAppTemplatesSyncProps) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedTemplates, setSyncedTemplates] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Check WhatsApp connection status before attempting to sync
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (subAccountId) {
        setConnectionStatus('checking');
        try {
          const response = await apiRequest('GET', `/api/whatsapp/status?subAccountId=${subAccountId}`);
          const data = await response.json();
          
          // Use connected status specifically, not just available
          if (data.connected) {
            setConnectionStatus('connected');
            setSyncError(null);
          } else if (data.configured) {
            // If it's configured but not connected
            setConnectionStatus('disconnected');
            setSyncError("WhatsApp service is configured but not active. Please check your connection settings.");
          } else {
            // Not even configured
            setConnectionStatus('disconnected');
            setSyncError("WhatsApp service is not configured. Please complete your WhatsApp integration setup.");
          }
        } catch (error) {
          console.error('Error checking WhatsApp status:', error);
          setConnectionStatus('disconnected');
          setSyncError("Could not verify WhatsApp connection. Please check your integration settings.");
        }
      }
    };
    
    checkConnectionStatus();
    
    // Periodically check status
    const interval = setInterval(checkConnectionStatus, 30000);
    
    return () => clearInterval(interval);
  }, [subAccountId]);

  // Function to sync WhatsApp templates
  const syncTemplates = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    setSyncedTemplates([]);

    try {
      const response = await apiRequest("POST", `/api/whatsapp/sync-templates`, {
        subAccountId
      });

      const data = await response.json();

      if (response.ok) {
        setSyncSuccess(true);
        if (Array.isArray(data.templates)) {
          setSyncedTemplates(data.templates);
        }
        
        // Call the onSync callback if provided
        if (onSync) {
          onSync();
        }
        
        toast({
          title: "Templates Synced",
          description: `Successfully synced ${data.templates?.length || 0} WhatsApp templates`,
        });
      } else {
        setSyncError(data.message || "Failed to sync WhatsApp templates");
        toast({
          title: "Sync Failed",
          description: data.message || "Failed to sync WhatsApp templates",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("WhatsApp template sync error:", error);
      setSyncError("An unexpected error occurred. Please try again.");
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-lg">WhatsApp Templates</h3>
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
        </div>
      </div>
      
      {syncSuccess && (
        <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
          <Check className="h-4 w-4" />
          <AlertTitle>Templates Synced Successfully</AlertTitle>
          <AlertDescription>
            {syncedTemplates.length > 0
              ? `Successfully synced ${syncedTemplates.length} WhatsApp templates from your business account.`
              : "No new templates found to sync."}
          </AlertDescription>
        </Alert>
      )}

      {syncError && (
        <Alert className="mb-4 bg-red-50 text-red-700 border-red-200" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">
            Sync your approved WhatsApp templates from Meta Business Manager
          </p>
        </div>
        <Button 
          onClick={syncTemplates} 
          disabled={isSyncing}
          className="gap-2"
          variant="outline"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync Templates
            </>
          )}
        </Button>
      </div>

      {syncedTemplates.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Recently Synced Templates</h4>
          <div className="grid gap-2">
            {syncedTemplates.map((template, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500 truncate max-w-md">
                    {template.content}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={template.updated ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}
                >
                  {template.updated ? "Updated" : "New"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 mt-2">
        <p>
          Templates must be approved in the Meta Business Manager before they can be synced.
          You can create and manage your templates in the{" "}
          <a 
            href="https://business.facebook.com/" 
            target="_blank" 
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            Meta Business Manager
          </a>.
        </p>
      </div>
    </div>
  );
}