import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lead } from '@shared/schema';
import WhatsAppMessage from './whatsapp-message';
import { MessageSquare, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface LeadCommunicationProps {
  lead: Lead;
}

const LeadCommunication: React.FC<LeadCommunicationProps> = ({ lead }) => {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle successful message send to refresh activities
  const handleMessageSent = () => {
    // Invalidate the activities query to refresh the messages
    queryClient.invalidateQueries({ queryKey: ['/api/leads/activities', lead.id] });
    
    // Show success toast
    toast({
      title: 'Message Sent',
      description: 'Your message has been sent successfully.',
    });
  };
  
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Communication</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="whatsapp" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-blue-600" />
            Email
          </TabsTrigger>
          <TabsTrigger value="call" className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-orange-600" />
            Call
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="whatsapp">
          <WhatsAppMessage lead={lead} onMessageSent={handleMessageSent} />
        </TabsContent>
        
        <TabsContent value="email">
          <div className="p-8 text-center text-muted-foreground border rounded-md">
            <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Email Communication</h3>
            <p>Email messaging will be implemented in the next phase.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="call">
          <div className="p-8 text-center text-muted-foreground border rounded-md">
            <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Call Tracking</h3>
            <p>Call tracking and logging will be implemented in the next phase.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadCommunication;