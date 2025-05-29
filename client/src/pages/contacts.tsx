import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSubAccount } from "@/context/sub-account-context";
import { Badge } from "@/components/ui/badge";
import { MailIcon, PhoneIcon, BuildingIcon, MapPinIcon } from "lucide-react";

export default function Contacts() {
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts", currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount?.id) return [];
      const response = await apiRequest("GET", `/api/contacts?subAccountId=${currentSubAccount.id}`);
      return response.json();
    },
    enabled: !!currentSubAccount?.id
  });

  // Filter contacts based on search term
  const filteredContacts = searchTerm && contacts ? 
    contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : contacts;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your business contacts and clients.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="w-full md:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Contact
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Contacts</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <div className="p-6">
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{contact.name}</h3>
                          {contact.title && (
                            <p className="text-muted-foreground text-sm">{contact.title}</p>
                          )}
                        </div>
                        {contact.type && (
                          <Badge variant={
                            contact.type === 'customer' ? 'default' : 
                            contact.type === 'vendor' ? 'secondary' : 
                            contact.type === 'partner' ? 'outline' : 'default'
                          }>
                            {contact.type}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <MailIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.company}</span>
                          </div>
                        )}
                        {contact.address && (
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{contact.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t p-4 flex justify-end space-x-2">
                      <Button size="sm" variant="ghost">Edit</Button>
                      <Button size="sm" variant="ghost">Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="font-semibold text-lg">No contacts found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first contact"}
              </p>
              {!searchTerm && (
                <Button className="mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Contact
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="customers" className="mt-0">
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-lg">Customer List View</h3>
            <p className="text-muted-foreground mt-1">This view is currently in development.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="vendors" className="mt-0">
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-lg">Vendor List View</h3>
            <p className="text-muted-foreground mt-1">This view is currently in development.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="partners" className="mt-0">
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-lg">Partner List View</h3>
            <p className="text-muted-foreground mt-1">This view is currently in development.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}