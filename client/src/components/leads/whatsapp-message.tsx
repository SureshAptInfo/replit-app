import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Send, Loader2, AlertCircle, MessageSquare, PhoneCall } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lead, LeadActivity } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

interface WhatsAppMessageProps {
  lead: Lead;
  onMessageSent?: () => void;
}

const WhatsAppMessage: React.FC<WhatsAppMessageProps> = ({ lead, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Query WhatsApp status to see if it's configured, using the lead's subAccountId
  const whatsAppQuery = useQuery({
    queryKey: ['/api/whatsapp/status', lead.subAccountId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/whatsapp/status?subAccountId=${lead.subAccountId}`);
      return response.json();
    },
    enabled: !!lead.subAccountId,
    refetchInterval: 30000 // Refresh every 30 seconds to ensure status is current
  });

  // Query lead activities to show message history
  const activitiesQuery = useQuery({
    queryKey: ['/api/leads/activities', lead.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leads/${lead.id}/activities`);
      return response.json();
    },
    enabled: !!lead.id
  });

  // Filter for only WhatsApp messages
  const whatsAppMessages = activitiesQuery.data?.filter(
    (activity: LeadActivity) => activity.type === 'whatsapp'
  ) || [];

  // Fetch logged in user data directly from the server
  const userQuery = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/user');
      return response.json();
    }
  });
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      // Check if we're authenticated with the auth context
      if (!isAuthenticated || !user) {
        throw new Error("You need to be logged in to send messages. Please refresh the page and log in again.");
      }
      
      // Get required fields with strong validation
      const subAccountId = Number(lead.subAccountId);
      const userId = user.id ? Number(user.id) : null;
      
      // Log our debug info
      console.log("User session info:", {
        userId,
        userSource: "Auth Context",
        subAccountId
      });
      
      // Validate all required fields with clear error messages
      if (!lead.id) {
        throw new Error("Lead ID is missing");
      }
      if (!subAccountId) {
        throw new Error("SubAccount ID is missing");
      }
      if (!userId) {
        throw new Error("User ID is missing. Please refresh the page and log in again.");
      }
      
      // Make sure lead ID is properly formatted and converted
      // Check if lead.id is a string or a number and convert appropriately
      const leadId = typeof lead.id === 'string' ? parseInt(lead.id, 10) : Number(lead.id);
      
      console.log('Sending message with:', {
        leadId: leadId,
        leadIdType: typeof leadId,
        rawLeadId: lead.id,
        rawLeadIdType: typeof lead.id,
        message,
        subAccountId,
        userId,
        phone: lead.phone
      });
      
      // Check if WhatsApp integration is available and connected
      const statusResponse = await apiRequest('GET', `/api/whatsapp/status?subAccountId=${subAccountId}`);
      const statusData = await statusResponse.json();
      
      if (!statusData.connected) {
        if (statusData.configured) {
          throw new Error("WhatsApp service is configured but not active. Please check your integration status.");
        } else {
          throw new Error(statusData.message || "WhatsApp service is not available. Please check your integration settings.");
        }
      }
      
      // Use the authenticated user ID from the auth context
      const validUserId = user.id ? Number(user.id) : null;
      
      // Make the API request with clearly typed data
      // Ensure the lead ID is passed as a number and is valid
      if (!leadId || isNaN(leadId)) {
        throw new Error(`Invalid lead ID: ${leadId}`);
      }
      
      const response = await apiRequest('POST', '/api/whatsapp/send', {
        leadId: leadId,
        message: message,
        subAccountId: subAccountId,
        userId: validUserId,
        // Include phone number explicitly for additional validation
        phone: lead.phone
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Message Sent',
          description: 'WhatsApp message has been sent successfully.',
        });
        
        setMessage('');
        if (onMessageSent) onMessageSent();
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      toast({
        title: 'Error Sending Message',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Show the appropriate UI based on WhatsApp configuration
  if (whatsAppQuery.isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Checking WhatsApp status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (whatsAppQuery.isError) {
    return (
      <Card className="mt-4 border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center text-destructive p-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <div>
              <h4 className="font-medium">WhatsApp Service Unavailable</h4>
              <p className="text-sm text-muted-foreground">
                Could not connect to WhatsApp service. Please check your configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const whatsAppStatus = whatsAppQuery.data;
  const isConfigured = whatsAppStatus?.configured || false;
  const isConnected = whatsAppStatus?.connected || false;
  const statusMessage = whatsAppStatus?.message || "WhatsApp service status unknown";

  // If WhatsApp is configured but not connected
  if (isConfigured && !isConnected) {
    return (
      <Card className="mt-4 border-yellow-300">
        <CardContent className="pt-6">
          <div className="flex items-center text-yellow-600 p-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <div>
              <h4 className="font-medium">WhatsApp Not Active</h4>
              <p className="text-sm text-muted-foreground">
                WhatsApp is configured but not currently active. Contact your administrator to activate the integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If WhatsApp is not configured at all
  if (!isConfigured) {
    return (
      <Card className="mt-4 border-orange-300">
        <CardContent className="pt-6">
          <div className="flex items-center text-orange-600 p-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <div>
              <h4 className="font-medium">WhatsApp Not Configured</h4>
              <p className="text-sm text-muted-foreground">
                {statusMessage}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lead has no phone number
  if (!lead.phone) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center text-muted-foreground p-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <div>
              <h4 className="font-medium">No Phone Number</h4>
              <p className="text-sm">
                This lead does not have a phone number. Add a phone number to enable WhatsApp messaging.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium">WhatsApp</h3>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <PhoneCall className="h-4 w-4 mr-1" />
                  {lead.phone}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Lead's WhatsApp number</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Message History */}
        <div className="mb-4 max-h-80 overflow-y-auto border rounded-md p-2 bg-muted/30">
          {activitiesQuery.isLoading ? (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading messages...</span>
            </div>
          ) : whatsAppMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No WhatsApp messages yet</p>
              <p className="text-sm">Send your first message below</p>
            </div>
          ) : (
            <div className="space-y-2">
              {whatsAppMessages.map((activity: LeadActivity) => {
                const isIncoming = activity.content.startsWith('Incoming:');
                const messageContent = isIncoming 
                  ? activity.content.replace('Incoming:', '').trim()
                  : activity.content;
                
                return (
                  <div 
                    key={activity.id} 
                    className={`p-2 rounded-lg max-w-[85%] ${
                      isIncoming 
                        ? 'bg-muted ml-0 mr-auto' 
                        : 'bg-primary text-primary-foreground ml-auto mr-0'
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-1">
                      {isIncoming ? 'Lead' : 'You'} • {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                    <p>{messageContent}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your WhatsApp message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px]"
            disabled={sending}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || sending}
            className="mt-auto"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppMessage;