import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { formatDistanceToNow, format } from "date-fns";
import { Search, Plus, Send, MessageSquare, MessageCircle } from "lucide-react";
import { useSubAccount } from "@/context/sub-account-context";
import { APP_NAME } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  status?: string;
  source?: string;
}

export default function Messages() {
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);

  // WhatsApp send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ leadId, message, phone }: { leadId: number; message: string; phone: string }) => {
      const response = await apiRequest("POST", "/api/whatsapp/send", {
        leadId,
        to: phone,
        message,
        subAccountId: currentSubAccount?.id || 1,
        userId: 1 // This should come from auth context
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Your WhatsApp message has been delivered successfully.",
      });
      setMessageText("");
      // Refresh conversation messages immediately
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${selectedContact?.id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "There was an error sending your message.",
        variant: "destructive",
      });
    }
  });

  // Fetch real leads data for conversations
  const { data: leads = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ["/api/leads", currentSubAccount?.id],
    enabled: !!currentSubAccount,
    staleTime: 60000
  });

  // Convert leads to contacts format for messaging
  const contacts: Contact[] = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    
    return leads.map((lead: any) => {
      const isNew = lead.status === 'new';
      
      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        lastMessage: isNew ? `New lead from ${lead.source || 'Unknown source'}` : `Status: ${lead.status}`,
        lastMessageTime: lead.lastActivity || lead.createdAt,
        unreadCount: isNew ? 1 : 0,
        status: lead.status,
        source: lead.source
      };
    }).sort((a, b) => {
      return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
    });
  }, [leads]);

  // Fetch conversation history for selected contact
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/leads/${selectedContact?.id}/activities`],
    enabled: !!selectedContact?.id,
    staleTime: 5000, // Refresh more frequently to catch incoming messages
    refetchInterval: 10000 // Auto-refresh every 10 seconds
  });

  // Filter messages to show only WhatsApp and SMS communications
  const conversationMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    
    return messages
      .filter((activity: any) => 
        activity.type === 'whatsapp' || 
        activity.type === 'sms' || 
        activity.type === 'email'
      )
      .map((activity: any) => ({
        id: activity.id,
        content: activity.content,
        timestamp: activity.createdAt,
        isIncoming: activity.direction === 'incoming',
        type: activity.type,
        status: 'delivered' // Default status
      }))
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [contacts, searchTerm]);

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Messages | {APP_NAME}</title>
        <meta name="description" content="Manage your SMS and WhatsApp messages with leads and clients" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with leads and clients via SMS, WhatsApp, and email
            </p>
          </div>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Contact List */}
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              <Tabs defaultValue="all">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="m-0">
                  {isLoadingContacts ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center gap-3 p-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No contacts found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredContacts.map((contact: Contact) => (
                        <div
                          key={contact.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedContact?.id === contact.id ? "bg-primary/10" : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedContact(contact)}
                        >
                          <Avatar>
                            <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{contact.name}</h3>
                              {contact.lastMessageTime && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatMessageTime(contact.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            
                            {contact.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.lastMessage}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-1">
                              {contact.source && (
                                <Badge variant="outline" className="text-xs">
                                  {contact.source}
                                </Badge>
                              )}
                              {contact.status && (
                                <Badge variant={contact.status === 'new' ? 'default' : 'secondary'} className="text-xs">
                                  {contact.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {(contact.unreadCount && contact.unreadCount > 0) && (
                            <Badge className="ml-auto">{contact.unreadCount}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="unread" className="m-0">
                  {filteredContacts.filter((c: Contact) => c.unreadCount && c.unreadCount > 0).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No unread messages</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredContacts
                        .filter((c: Contact) => c.unreadCount && c.unreadCount > 0)
                        .map((contact: Contact) => (
                          <div
                            key={contact.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedContact?.id === contact.id ? "bg-primary/10" : "hover:bg-muted"
                            }`}
                            onClick={() => setSelectedContact(contact)}
                          >
                            <Avatar>
                              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium truncate">{contact.name}</h3>
                                {contact.lastMessageTime && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatMessageTime(contact.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              
                              {contact.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {contact.lastMessage}
                                </p>
                              )}
                            </div>
                            
                            <Badge className="ml-auto">{contact.unreadCount}</Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedContact.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow flex flex-col py-4">
                  <div className="flex-grow overflow-y-auto mb-4 space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : conversationMessages.length > 0 ? (
                      conversationMessages.map((message: any) => (
                        <div key={message.id} className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}>
                          <div className={`px-3 py-2 rounded-lg max-w-xs ${
                            message.isIncoming 
                              ? 'bg-muted' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${
                                message.isIncoming 
                                  ? 'text-muted-foreground' 
                                  : 'opacity-70'
                              }`}>
                                {format(new Date(message.timestamp), 'h:mm a')}
                              </p>
                              {!message.isIncoming && (
                                <span className={`text-xs ml-2 ${
                                  message.status === 'delivered' ? 'text-green-500' : 
                                  message.status === 'read' ? 'text-blue-500' : 
                                  'opacity-70'
                                }`}>
                                  {message.type === 'whatsapp' ? '✓✓' : 
                                   message.type === 'sms' ? '✓' : '📧'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                        <p className="text-muted-foreground mb-4">
                          Send your first message to {selectedContact.name}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Send a message to ${selectedContact.name}...`}
                        className="flex-grow"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && messageText.trim() && !sendMessageMutation.isPending) {
                            sendMessageMutation.mutate({
                              leadId: selectedContact.id,
                              message: messageText.trim(),
                              phone: selectedContact.phone
                            });
                          }
                        }}
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (messageText.trim() && !sendMessageMutation.isPending) {
                            sendMessageMutation.mutate({
                              leadId: selectedContact.id,
                              message: messageText.trim(),
                              phone: selectedContact.phone
                            });
                          }
                        }}
                        disabled={sendMessageMutation.isPending || !messageText.trim()}
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send via WhatsApp • Phone: {selectedContact.phone}
                    </p>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Choose a contact from the list to view your conversation history and send messages
                </p>
                <Button onClick={() => setShowNewConversationDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}