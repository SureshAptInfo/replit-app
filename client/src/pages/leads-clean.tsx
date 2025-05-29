import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { Search, Plus, Filter, SortAsc, SortDesc, ChevronDown, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSubAccount } from "@/hooks/use-subaccount";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { LeadFilters } from "@/components/leads/lead-filters";
import { CreateLeadForm } from "@/components/forms/create-lead-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  status: string;
  assignedTo?: number;
  createdAt: string;
  lastActivity?: string;
  notes?: string;
  score?: number;
}

interface LeadCounts {
  all: number;
  unread: number;
  contacted: number;
  rnr: number;
  follow_up: number;
  interested: number;
  converted: number;
  lost: number;
}

export default function Leads() {
  // Read URL parameters for tab selection
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  const freshParam = urlParams.get('fresh');
  
  // State management
  const [activeTab, setActiveTab] = useState(tabFromUrl || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
  const [forceRefresh, setForceRefresh] = useState(freshParam === 'true');
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  
  // Hooks
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const { user } = useAuth();

  // Fetch lead counts for status tabs
  const { data: leadCountsData, isLoading: isCountsLoading } = useQuery({
    queryKey: ['/api/leads/counts', currentSubAccount?.id, refreshKey],
    queryFn: async () => {
      if (!currentSubAccount) return null;
      const endpoint = `/api/leads/counts?subAccountId=${currentSubAccount.id}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch lead counts');
      return response.json();
    },
    enabled: !!currentSubAccount,
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refresh data every 3 seconds
    staleTime: 0
  });
  
  const leadCounts: LeadCounts = leadCountsData || {
    all: 0,
    unread: 0,
    contacted: 0,
    rnr: 0,
    follow_up: 0,
    interested: 0,
    converted: 0,
    lost: 0
  };

  // Lead Sources query
  const { data: leadSources = [] } = useQuery({
    queryKey: ['/api/leads/sources'],
    staleTime: 300000, // Cache for 5 minutes
  });
  
  const queryClient = useQueryClient();

  // Build API endpoint based on current filters
  const getEndpoint = () => {
    if (!currentSubAccount) return null;
    
    let endpoint = `/api/leads?subAccountId=${currentSubAccount.id}`;
    
    // Status filter (from tabs)
    const statusMapping: Record<string, string> = {
      "all": "",
      "unread": "new",
      "contacted": "contacted",
      "rnr": "rnr",
      "follow_up": "follow_up",
      "interested": "interested",
      "converted": "converted",
      "lost": "lost"
    };
    
    const mappedStatus = statusMapping[activeTab];
    if (mappedStatus) {
      endpoint += `&status=${mappedStatus}`;
    } else {
      endpoint += "&status=none";
    }
    
    // Source filter
    if (sourceFilter) {
      endpoint += `&source=${encodeURIComponent(sourceFilter)}`;
    } else {
      endpoint += "&source=none";
    }
    
    // Add timestamp to force fresh data
    endpoint += `&_t=${Date.now()}`;
    
    return endpoint;
  };

  // Fetch leads with filters
  const { data: allLeads = [], isLoading: isLeadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['/api/leads', currentSubAccount?.id, activeTab, sourceFilter, forceRefresh, refreshKey],
    queryFn: async () => {
      const endpoint = getEndpoint();
      if (!endpoint) return [];
      
      // Add timestamp to avoid caching
      const timestampedEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}timestamp=${Date.now()}`;
      console.log(`GET ${timestampedEndpoint}`);
      
      const response = await fetch(timestampedEndpoint);
      
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const leadData = await response.json();
      
      // Reset forceRefresh after fetching
      if (forceRefresh) {
        setForceRefresh(false);
      }
      
      return leadData;
    },
    enabled: !!currentSubAccount,
    refetchOnWindowFocus: true,
    refetchInterval: 1000, // Check more frequently for changes
    staleTime: 0,
    refetchOnMount: true,
    gcTime: 0 // Don't cache the results (using gcTime instead of deprecated cacheTime)
  });
  
  // Handle lead status changes
  const [leadStatusLastChanged, setLeadStatusLastChanged] = useState<number | null>(null);
  
  // Listen for URL changes that might indicate return from lead detail page
  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.pathname === '/leads') {
        // Trigger refresh when returning to leads page
        setLeadStatusLastChanged(Date.now());
        queryClient.invalidateQueries({queryKey: ['/api/leads']});
      }
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('pushstate'));
      return result;
    };
    window.addEventListener('pushstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('pushstate', handleUrlChange);
    };
  }, []);
  
  // Refresh data when returning from lead detail page
  useEffect(() => {
    if (leadStatusLastChanged) {
      refetchLeads();
    }
  }, [leadStatusLastChanged, refetchLeads]);
  
  // Fetch team members data for displaying assignees
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team', currentSubAccount?.id],
    enabled: !!currentSubAccount?.id,
    staleTime: 60000, // Cache for 1 minute
  }) as { data: Array<{ id: number, username: string, name: string }> };

  // Handle sorting change
  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Define status mapping for tabs
  const statusMapping: Record<string, string> = {
    "all": "",
    "unread": "new",
    "contacted": "contacted",
    "rnr": "rnr",
    "follow_up": "follow_up",
    "interested": "interested",
    "converted": "converted",
    "lost": "lost"
  };

  // Filter leads by search query and all active filters
  const filteredLeads = allLeads.filter((lead: Lead) => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Source filter
    const matchesSource = !sourceFilter || lead.source === sourceFilter;
    
    // Status filter (via tab)
    const matchesStatus = activeTab === "all" || 
      (statusMapping[activeTab] && lead.status === statusMapping[activeTab]);
    
    // Assignee filter
    const matchesAssignee = !assigneeFilter || lead.assignedTo === assigneeFilter;
    
    return matchesSearch && matchesSource && matchesStatus && matchesAssignee;
  });
  
  // Sort the filtered leads
  const sortedLeads = [...filteredLeads].sort((a: Lead, b: Lead) => {
    let aValue: any = a[sortColumn as keyof Lead];
    let bValue: any = b[sortColumn as keyof Lead];
    
    // Handle nulls/undefined values
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    // Handle dates (convert strings to Date objects)
    if (sortColumn === 'createdAt' || sortColumn === 'lastActivity') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } 
    // Handle strings (case-insensitive)
    else if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    // Sort based on direction
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <>
      <Helmet>
        <title>Leads | LeadTrackPro</title>
        <meta name="description" content="Manage and track your leads with LeadTrackPro's powerful lead management system." />
      </Helmet>
      
      <div className="min-h-screen bg-neutral-100">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                <p className="text-gray-600">Manage all your leads in one place</p>
              </div>
              
              <div className="flex items-center gap-3">
                {user && ["super_admin", "agency_owner", "agency_admin", "client_admin"].includes(user.role) && (
                  <Button 
                    onClick={() => setIsCreateLeadOpen(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lead Filters */}
          <LeadFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeFilterChange={setAssigneeFilter}
            teamMembers={teamMembers}
            leadSources={leadSources}
            onSourceManagerOpen={() => setIsSourceManagerOpen(true)}
          />

          {/* Status Tabs */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="all" className="text-xs">
                  All ({leadCounts.all})
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  New ({leadCounts.unread})
                </TabsTrigger>
                <TabsTrigger value="contacted" className="text-xs">
                  Contacted ({leadCounts.contacted})
                </TabsTrigger>
                <TabsTrigger value="rnr" className="text-xs">
                  RNR ({leadCounts.rnr})
                </TabsTrigger>
                <TabsTrigger value="follow_up" className="text-xs">
                  Follow Up ({leadCounts.follow_up})
                </TabsTrigger>
                <TabsTrigger value="interested" className="text-xs">
                  Interested ({leadCounts.interested})
                </TabsTrigger>
                <TabsTrigger value="converted" className="text-xs">
                  Converted ({leadCounts.converted})
                </TabsTrigger>
                <TabsTrigger value="lost" className="text-xs">
                  Lost ({leadCounts.lost})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Leads Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('name')}
                      >
                        <div className="flex items-center">
                          Name
                          {sortColumn === 'name' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('email')}
                      >
                        <div className="flex items-center">
                          Email
                          {sortColumn === 'email' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('phone')}
                      >
                        <div className="flex items-center">
                          Phone
                          {sortColumn === 'phone' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('createdAt')}
                      >
                        <div className="flex items-center">
                          Created
                          {sortColumn === 'createdAt' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLeadsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading leads...
                        </TableCell>
                      </TableRow>
                    ) : sortedLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedLeads.map((lead) => {
                        const assignedMember = teamMembers.find(member => member.id === lead.assignedTo);
                        return (
                          <TableRow 
                            key={lead.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            <TableCell className="font-medium">
                              {lead.name}
                            </TableCell>
                            <TableCell>{lead.email || 'N/A'}</TableCell>
                            <TableCell>{lead.phone || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {lead.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  lead.status === 'converted' ? 'default' :
                                  lead.status === 'lost' ? 'destructive' :
                                  lead.status === 'interested' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {lead.status === 'new' ? 'New' :
                                 lead.status === 'contacted' ? 'Contacted' :
                                 lead.status === 'rnr' ? 'RNR' :
                                 lead.status === 'follow_up' ? 'Follow Up' :
                                 lead.status === 'interested' ? 'Interested' :
                                 lead.status === 'converted' ? 'Converted' :
                                 lead.status === 'lost' ? 'Lost' : 
                                 lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assignedMember ? assignedMember.name : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <MobileNavigation />
      </div>

      {/* Create Lead Modal */}
      <CreateLeadForm
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onSuccess={() => {
          // Refresh lead data
          setRefreshKey(Date.now());
          queryClient.invalidateQueries({queryKey: ['/api/leads']});
          queryClient.invalidateQueries({queryKey: ['/api/leads/counts']});
          toast({
            title: "Lead Created",
            description: "New lead has been created successfully",
          });
        }}
      />
    </>
  );
}