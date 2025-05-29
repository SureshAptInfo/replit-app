import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Send, Phone, Mail, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone: string;
  status: string;
  lastActivity?: string;
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  isIncoming: boolean;
  status: string;
  contactId: number;
  channel: string;
}

interface Template {
  id: number;
  name: string;
  content: string;
  type: string;
  category: string;
}

export default function Messages() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("sms");
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current sub account
  const { data: subAccounts = [] } = useQuery({
    queryKey: ["/api/subaccounts"],
  });
  const currentSubAccount = subAccounts[0];

  // Fetch contacts (leads)
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/leads");
      if (!response.ok) return [];
      return await response.json();
    },
  });

  // Fetch messages (activities) for selected contact
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/leads", selectedContact?.id, "activities"],
    queryFn: async () => {
      if (!selectedContact) return [];
      
      const response = await apiRequest("GET", `/api/leads/${selectedContact.id}/activities`);
      if (!response.ok) return [];
      
      const activities = await response.json();
      
      // Convert activities to message format and filter for communication activities
      return activities
        .filter((activity: any) => ['whatsapp', 'sms', 'email'].includes(activity.type))
        .map((activity: any) => ({
          id: activity.id,
          content: activity.content,
          timestamp: activity.timestamp,
          isIncoming: activity.direction === 'inbound',
          status: 'read',
          contactId: selectedContact.id,
          channel: activity.type
        }))
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },
    enabled: !!selectedContact?.id
  });

  // Fetch WhatsApp templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates", currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount?.id) return [];
      
      const response = await apiRequest("GET", `/api/templates?subAccountId=${currentSubAccount.id}`);
      if (!response.ok) return [];
      
      return await response.json();
    },
    enabled: !!currentSubAccount?.id
  });

  // Check WhatsApp 24-hour window
  const isWhatsAppWindowOpen = selectedContact && messages.length > 0 ? (() => {
    const lastIncomingWhatsApp = messages
      .filter((msg: Message) => msg.isIncoming && msg.channel === 'whatsapp')
      .sort((a: Message, b: Message) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!lastIncomingWhatsApp) return false;
    
    const timeDiff = Date.now() - new Date(lastIncomingWhatsApp.timestamp).getTime();
    return timeDiff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  })() : false;

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact: Contact) => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    contact.phone.includes(searchTerm)
  );

  // Send a message
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;
    
    try {
      // Check if it's WhatsApp template message
      const isTemplate = messageText.startsWith('[TEMPLATE:');
      
      if (selectedChannel === 'whatsapp') {
        if (!isWhatsAppWindowOpen && !isTemplate) {
          toast({
            title: "WhatsApp Restriction",
            description: "You can only send approved templates outside the 24-hour window. Please select a template.",
            variant: "destructive",
          });
          return;
        }
        
        if (isTemplate) {
          // Extract template name and send as WhatsApp template
          const templateMatch = messageText.match(/\[TEMPLATE:([^\]]+)\]/);
          const templateName = templateMatch ? templateMatch[1] : '';
          
          const response = await apiRequest("POST", "/api/whatsapp/send-template", {
            leadId: selectedContact.id,
            templateName: templateName,
            subAccountId: currentSubAccount?.id || 1,
            userId: 6
          });
          
          if (!response.ok) {
            throw new Error('Failed to send WhatsApp template');
          }
        } else {
          // Send regular WhatsApp message (within 24-hour window)
          const response = await apiRequest("POST", "/api/whatsapp/send", {
            leadId: selectedContact.id,
            message: messageText,
            subAccountId: currentSubAccount?.id || 1,
            userId: 6
          });
          
          if (!response.ok) {
            throw new Error('Failed to send WhatsApp message');
          }
        }
      } else {
        // Create activity for SMS/Email messages
        const response = await apiRequest("POST", `/api/leads/${selectedContact.id}/activities`, {
          type: selectedChannel,
          content: messageText,
          direction: "outbound",
          userId: 6
        });
        
        if (!response.ok) {
          throw new Error(`Failed to send ${selectedChannel} message`);
        }
      }
      
      toast({
        title: "Message Sent",
        description: `${selectedChannel.toUpperCase()} ${isTemplate ? 'template' : 'message'} sent to ${selectedContact.name}`,
      });
      
      setMessageText("");
      
      // Refresh activities to show the sent message
      queryClient.invalidateQueries({ queryKey: ["/api/leads", selectedContact.id, "activities"] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectTemplate = (template: Template) => {
    if (selectedChannel === 'whatsapp') {
      setMessageText(`[TEMPLATE:${template.name}] ${template.content}`);
    } else {
      setMessageText(template.content);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Contacts Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredContacts.map((contact: Contact) => (
              <Card
                key={contact.id}
                className={`mb-2 cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{contact.phone}</p>
                      {contact.email && (
                        <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {contact.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h3>
                  <p className="text-sm text-gray-500">{selectedContact.phone}</p>
                </div>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* WhatsApp 24-hour window notification */}
              {selectedChannel === 'whatsapp' && !isWhatsAppWindowOpen && (
                <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription className="text-yellow-800">
                    WhatsApp 24-hour window closed. You can only send approved templates.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isIncoming
                          ? 'bg-white border border-gray-200'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getChannelIcon(message.channel)}
                        <span className="text-xs opacity-70">
                          {message.channel.toUpperCase()}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={
                      selectedChannel === 'whatsapp' && !isWhatsAppWindowOpen
                        ? "Select a WhatsApp template to send..."
                        : `Type your ${selectedChannel} message...`
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={selectedChannel === 'whatsapp' && !isWhatsAppWindowOpen && !messageText.startsWith('[TEMPLATE:')}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Templates</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle>Message Templates</DialogTitle>
                      <DialogDescription>
                        Select a template to use in your message.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
                      {templates
                        .filter((t: Template) => t.type === selectedChannel)
                        .map((template: Template) => (
                          <div key={template.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{template.name}</h3>
                              <Badge variant="outline">
                                {template.category?.replace("_", " ") || 'general'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{template.content}</p>
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() => selectTemplate(template)}
                            >
                              Use Template
                            </Button>
                          </div>
                        ))}
                      
                      {templates.filter((t: Template) => t.type === selectedChannel).length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No templates available for {selectedChannel.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={sendMessage} 
                  disabled={!messageText.trim() || (selectedChannel === 'whatsapp' && !isWhatsAppWindowOpen && !messageText.startsWith('[TEMPLATE:'))}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a contact from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}