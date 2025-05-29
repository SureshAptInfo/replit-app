import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useSubAccount } from "@/context/sub-account-context";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Components
import Header from "@/components/layout/header";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { CreateLeadForm } from "@/components/leads/create-lead-form";
import StatusTabs from "@/components/leads/status-tabs";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Icons
import { AlertCircle, CheckCircle, Download, Eye, Loader2, MessageSquare, Phone, Plus, Search, Upload, UserPlus } from "lucide-react";

// Lead type definition
interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  source?: string;
  company?: string;
  position?: string;
  address?: string;
  createdAt: string;
  lastActivity?: string;
  lastFollowUpDate?: string;
  assignedTo?: number;
  assignedUser?: {
    id: number;
    name: string;
  };
}

export default function LeadsPage() {
  // Read URL parameters for tab selection
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  const freshParam = urlParams.get('fresh');
  
  // State management
  const [activeTab, setActiveTab] = useState(tabFromUrl || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [forceRefresh, setForceRefresh] = useState(freshParam === 'true');
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isImportLeadOpen, setIsImportLeadOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<{success?: boolean, message?: string}>({});
  const [previewData, setPreviewData] = useState<string[][]>([]);
  
  // Hooks
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const queryClient = useQueryClient();

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
  
  // Map API counts with fallback to empty counts
  const leadCounts = leadCountsData ? {
    all: leadCountsData.total || 0,
    unread: leadCountsData.new || 0, // Map 'new' from API to 'unread' for display
    contacted: leadCountsData.contacted || 0,
    rnr: leadCountsData.rnr || 0,
    follow_up: leadCountsData.follow_up || 0,
    interested: leadCountsData.interested || 0,
    converted: leadCountsData.converted || 0,
    lost: leadCountsData.lost || 0
  } : {
    all: 0,
    unread: 0,
    contacted: 0,
    rnr: 0,
    follow_up: 0,
    interested: 0,
    converted: 0,
    lost: 0
  };
  
  // Listen for import dialog trigger
  useEffect(() => {
    const handleOpenImport = () => setIsImportLeadOpen(true);
    window.addEventListener('open-import-dialog', handleOpenImport);
    return () => window.removeEventListener('open-import-dialog', handleOpenImport);
  }, []);

  // Generate API endpoint with filters
  const getEndpoint = () => {
    if (!currentSubAccount) return null;
    
    let endpoint = `/api/leads?subAccountId=${currentSubAccount.id}`;
    
    // Map frontend tab names to backend status values for filtering
    if (activeTab !== "all") {
      const tabToStatusMap = {
        'unread': 'new',
        'contacted': 'contacted',
        'rnr': 'rnr',
        'follow_up': 'follow_up',
        'interested': 'interested',
        'converted': 'converted', 
        'lost': 'lost'
      };
      
      // Add status filter
      const statusForTab = tabToStatusMap[activeTab];
      if (statusForTab) {
        endpoint += `&status=${statusForTab}`;
      }
    }
    
    if (sourceFilter) {
      endpoint += `&source=${sourceFilter}`;
    }
    
    // Add timestamp to force fresh data
    endpoint += `&_t=${Date.now()}`;
    
    console.log(`Generated endpoint: ${endpoint} for tab: ${activeTab}`);
    
    return endpoint;
  };

  // Fetch leads with filters
  const { data: allLeads = [], isLoading: isLeadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['/api/leads', currentSubAccount?.id, activeTab, sourceFilter, forceRefresh, refreshKey],
    queryFn: async () => {
      const endpoint = getEndpoint();
      if (!endpoint) return [];
      
      console.log(`Fetching leads from endpoint: ${endpoint}, forceRefresh: ${forceRefresh}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const leadData = await response.json();
      console.log(`Got ${leadData.length} leads from API`);
      
      // Reset forceRefresh after fetching
      if (forceRefresh) {
        setForceRefresh(false);
      }
      
      return leadData;
    },
    enabled: !!currentSubAccount,
    refetchOnWindowFocus: true,
    refetchInterval: 2000,
    staleTime: 0,
    refetchOnMount: true
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
  
  // Filter leads by search query
  const filteredLeads = searchQuery 
    ? allLeads.filter(lead => 
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allLeads;

  // Handle CSV file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      
      setImportFile(file);
      
      // Preview the CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const parsedData = lines.map(line => line.split(',').map(cell => cell.trim()));
        
        // Get the first 5 rows for preview
        setPreviewData(parsedData.slice(0, Math.min(5, parsedData.length)));
      };
      reader.readAsText(file);
    }
  };

  // Import mutation
  const importLeadsMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsImporting(true);
      setImportProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      if (currentSubAccount) {
        formData.append('subAccountId', currentSubAccount.id.toString());
      }
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      try {
        const response = await apiRequest('POST', '/api/leads/import', formData, true);
        
        clearInterval(progressInterval);
        setImportProgress(100);
        
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      setImportStatus({ success: true, message: `Successfully imported ${data.imported || 0} leads.` });
      setImportFile(null);
      setPreviewData([]);
      
      // Refresh data
      queryClient.invalidateQueries({queryKey: ['/api/leads']});
      queryClient.invalidateQueries({queryKey: ['/api/leads/counts']});
      
      setTimeout(() => {
        setIsImporting(false);
        setIsImportLeadOpen(false);
        
        toast({
          title: "Import Successful",
          description: `${data.imported || 0} leads were imported successfully.`,
        });
      }, 1000);
    },
    onError: (error: any) => {
      setImportStatus({ 
        success: false, 
        message: error.message || "Failed to import leads. Please try again."
      });
      setImportProgress(0);
      setIsImporting(false);
    }
  });

  // Handle import submit
  const handleImportSubmit = () => {
    if (!importFile) return;
    importLeadsMutation.mutate(importFile);
  };

  // Get source options for the filter
  const { data: sourceOptions = [] } = useQuery({
    queryKey: ['/api/leads/sources'],
    queryFn: async () => {
      const response = await fetch('/api/leads/sources');
      if (!response.ok) throw new Error('Failed to fetch lead sources');
      return response.json();
    }
  });

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format status for display
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "New", variant: "default" },
      contacted: { label: "Contacted", variant: "secondary" },
      rnr: { label: "RNR", variant: "outline" },
      follow_up: { label: "Follow-Up", variant: "secondary" },
      interested: { label: "Interested", variant: "default" },
      converted: { label: "Converted", variant: "default" },
      lost: { label: "Lost", variant: "destructive" }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    
    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>Leads | LeadTrackPro</title>
        <meta name="description" content="Manage and track your leads with LeadTrackPro's powerful lead management system." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen">
          <Header title="Leads" />
          
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="flex flex-col space-y-6">
              {/* Header with actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight mb-1">Leads</h1>
                  <p className="text-muted-foreground">
                    Manage all your leads in one place
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsImportLeadOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Leads
                  </Button>
                  
                  <Button onClick={() => setIsCreateLeadOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>
              
              {/* Main content area */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-white p-4 border-b">
                  <div className="flex flex-col space-y-4">
                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search leads..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                          <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="All Sources" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            {sourceOptions.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Status tabs */}
                    <StatusTabs
                      activeTab={activeTab}
                      counts={leadCounts}
                      onTabChange={setActiveTab}
                      isLoading={isCountsLoading}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {isLeadsLoading ? (
                    <div className="p-8">
                      <div className="flex flex-col space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 py-16">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <UserPlus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">No leads found</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-4">
                        {searchQuery || sourceFilter
                          ? "No leads match your current filters. Try adjusting your search criteria."
                          : "You don't have any leads yet. Create your first lead to get started."}
                      </p>
                      <Button onClick={() => setIsCreateLeadOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email / Phone</TableHead>
                            <TableHead className="hidden md:table-cell">Company</TableHead>
                            <TableHead className="hidden lg:table-cell">Source</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLeads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                              <TableCell className="font-medium">{lead.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {lead.email && <span className="text-sm">{lead.email}</span>}
                                  <span className="text-sm text-muted-foreground">{lead.phone}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{lead.company || '--'}</TableCell>
                              <TableCell className="hidden lg:table-cell">{lead.source || '--'}</TableCell>
                              <TableCell>{getStatusBadge(lead.status)}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {formatDate(lead.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={(e) => {
                                    e.stopPropagation();
                                    // Implement quick call action
                                    window.open(`tel:${lead.phone}`, '_blank');
                                  }}>
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={(e) => {
                                    e.stopPropagation();
                                    // Implement quick message action
                                    window.open(`sms:${lead.phone}`, '_blank');
                                  }}>
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/leads/${lead.id}`);
                                  }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <MobileNavigation />
        </main>
      </div>
      
      {/* Create Lead Modal */}
      <Dialog open={isCreateLeadOpen} onOpenChange={setIsCreateLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <CreateLeadForm onSuccess={() => {
            setIsCreateLeadOpen(false);
            // Refresh lead data
            queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
            queryClient.invalidateQueries({ queryKey: ['/api/leads/counts'] });
            setRefreshKey(Date.now());
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Import Leads Dialog */}
      <Dialog 
        open={isImportLeadOpen} 
        onOpenChange={(open) => {
          setIsImportLeadOpen(open);
          if (!open) {
            setImportFile(null);
            setImportStatus({});
            setPreviewData([]);
            setImportProgress(0);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import leads into your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {importStatus.message && (
              <Alert variant={importStatus.success ? "default" : "destructive"} className="mb-4">
                <AlertTitle>{importStatus.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{importStatus.message}</AlertDescription>
              </Alert>
            )}
            
            {isImporting ? (
              <div className="space-y-4 py-4">
                <p className="text-center font-medium">Importing leads...</p>
                <Progress value={importProgress} className="w-full" />
                <p className="text-center text-muted-foreground text-sm">{importProgress}% complete</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6">
                  <label htmlFor="csv-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                    <Download className="h-8 w-8 text-muted-foreground" />
                    <span className="font-medium">
                      {importFile ? importFile.name : "Drop your CSV file here or click to browse"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {importFile ? `${(importFile.size / 1024).toFixed(2)} KB` : "Supports CSV files"}
                    </span>
                    <Input 
                      id="csv-upload" 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                
                {previewData.length > 0 && (
                  <div className="mt-4 flex-1 overflow-hidden">
                    <h3 className="font-medium mb-2">Preview (first {previewData.length} rows):</h3>
                    <div className="overflow-auto max-h-[300px] border rounded-lg">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-muted/60 sticky top-0">
                          <tr>
                            {previewData[0].map((header, i) => (
                              <th key={i} className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider min-w-[120px]">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-gray-200">
                          {previewData.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-muted/30">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-2 sm:px-3 py-2 text-sm border-r last:border-r-0 max-w-[150px] truncate" title={cell}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsImportLeadOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleImportSubmit}
              disabled={!importFile || isImporting}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}