import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { useSubAccount } from "@/context/sub-account-context";
import { useAuth } from "@/context/auth-context";
import { Helmet } from "react-helmet";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AILeadInsights } from "@/components/leads/ai-lead-insights";
import { LeadSummary } from "@/components/leads/lead-summary";

import { formatPhoneNumber, getInitials, getStatusColor } from "@/lib/utils";

export default function LeadDetail() {
  const [location, navigate] = useLocation();
  const { id } = useParams();
  const { currentSubAccount } = useSubAccount();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpTime, setFollowUpTime] = useState("09:00");
  const [noteText, setNoteText] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPosition, setEditedPosition] = useState("");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  // Fetch lead details
  const { data: lead = {
    id: 0,
    name: "",
    email: "",
    phone: "",
    status: "new",
    source: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    value: 0,
    followUpCount: 0,
    lastFollowUpDate: null,
    customFields: {},
    assignedUser: null,
    assignedAt: null
  }, isLoading: isLeadLoading } = useQuery({
    queryKey: [`/api/leads/${id}`],
    enabled: !!id,
    refetchInterval: 2000, // Auto-refresh every 2 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  }) as { data: any, isLoading: boolean };
  
  // Fetch activities
  const { data: activities = [], isLoading: isActivitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: [`/api/leads/${id}/activities`],
    enabled: !!id,
    refetchInterval: 2000, // Auto-refresh activities every 2 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  // Fetch team members for lead reassignment
  const { data: teamMembers = [], isLoading: isTeamMembersLoading } = useQuery({
    queryKey: ['/api/team'],
    enabled: !!currentSubAccount?.id,
    staleTime: 60000 // Cache for 1 minute
  });
  
  // Add a note/activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      return apiRequest("POST", `/api/leads/${id}/activities`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      
      // Immediately refetch activities to ensure the UI is updated
      setTimeout(() => {
        refetchActivities();
      }, 300);
      
      // Only clear note text for notes, not for communication logs
      if (variables.type === "note") {
        setNoteText("");
        toast({
          title: "Success",
          description: "Note added successfully.",
        });
      } else if (variables.type === "call") {
        toast({
          title: "Call Logged",
          description: "Call activity has been recorded",
        });
      } else if (variables.type === "email") {
        toast({
          title: "Email Logged",
          description: "Email activity has been recorded",
        });
      } else if (variables.type === "whatsapp") {
        toast({
          title: "WhatsApp Logged",
          description: "WhatsApp activity has been recorded",
        });
      } else if (variables.type === "sms") {
        toast({
          title: "SMS Logged",
          description: "SMS activity has been recorded",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update lead status mutation with improved communication of changes
  const updateLeadStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      // Store old status before updating
      const oldStatus = lead.status;
      
      // Update the lead status
      const response = await apiRequest("PATCH", `/api/leads/${id}`, { status: newStatus });
      
      if (!response.ok) {
        throw new Error('Failed to update lead status');
      }
      
      // Add activity for status change
      const activityResponse = await apiRequest(
        'POST',
        `/api/leads/${id}/activities`,
        {
          type: 'status_change',
          content: `Status changed from ${oldStatus} to ${newStatus}`,
          userId: user?.id
        }
      );
      
      // Return both the updated lead and the old status
      const updatedLead = await response.json();
      return { updatedLead, oldStatus };
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries including activities
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}/activities`] });
      setSelectedStatus(null);
      
      // Force immediate full refresh of the leads list in the background
      // This ensures the data is fresh when user returns to the leads list
      queryClient.resetQueries({ queryKey: ["/api/leads"] });
      queryClient.resetQueries({ queryKey: ["/api/leads/counts"] });
      
      // Store the status change in local storage (for debugging purposes)
      localStorage.setItem('lastStatusChange', JSON.stringify({
        leadId: lead.id,
        oldStatus: data.oldStatus,
        newStatus: data.updatedLead.status,
        timestamp: Date.now()
      }));
      
      // Log the status change for debugging
      console.log(`Lead status changed: ${data.oldStatus} -> ${data.updatedLead.status}`);
            
      toast({
        title: "Status Updated",
        description: `Lead status changed to ${data.updatedLead.status.charAt(0).toUpperCase() + data.updatedLead.status.slice(1).replace('_', ' ')}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Reassign lead mutation
  const reassignLeadMutation = useMutation({
    mutationFn: async (assigneeId: number) => {
      return apiRequest("POST", `/api/leads/${id}/reassign`, { assigneeId });
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      
      // Close modal and reset selection
      setIsReassignModalOpen(false);
      setSelectedAssignee(null);
      
      toast({
        title: "Lead Reassigned",
        description: "Lead has been successfully reassigned to another team member.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reassign lead. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Edit contact mutation
  const editContactMutation = useMutation({
    mutationFn: async (contactData: { name: string; phone: string; email: string; position: string }) => {
      return apiRequest("PATCH", `/api/leads/${id}`, contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      setIsEditContactModalOpen(false);
      toast({
        title: "Contact Updated",
        description: "Contact information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact information.",
        variant: "destructive",
      });
    },
  });
  
  // Create task/follow-up mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      dueDate: Date; 
      leadId: number; 
      userId: number; 
      subAccountId: number;
      createdBy: number;
      priority: string;
      description: string | null;
    }) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      setFollowUpDate(undefined);
      // Refresh lead data to show updated status
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      // Also refresh lead list to show updated counts
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/counts'] });
      toast({
        title: "Success",
        description: "Follow-up reminder set successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set follow-up. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form when modal opens
  useEffect(() => {
    if (isEditContactModalOpen && lead && lead.id) {
      setEditedName(lead.name || "");
      setEditedPhone(lead.phone || "");
      setEditedEmail(lead.email || "");
      setEditedPosition(lead.position || "");
    }
  }, [isEditContactModalOpen, lead]);

  // Handle edit contact submission
  const handleEditContact = () => {
    editContactMutation.mutate({
      name: editedName,
      phone: editedPhone,
      email: editedEmail,
      position: editedPosition,
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    
    addActivityMutation.mutate({
      type: "note",
      content: noteText,
    });
  };
  
  const handleSetFollowUp = () => {
    if (!followUpDate) return;
    
    // Create a date object from the selected date and time
    const selectedDateTime = new Date(followUpDate);
    const [hours, minutes] = followUpTime.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // Only allow future dates/times
    const now = new Date();
    if (selectedDateTime <= now) {
      toast({
        title: "Invalid Date",
        description: "Please select a future date and time for the follow-up.",
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate({
      title: `Follow up with ${lead?.name || 'Lead'}`,
      dueDate: selectedDateTime,
      leadId: lead?.id || 0,
      userId: user?.id || 0,
      subAccountId: currentSubAccount?.id || 0,
      createdBy: user?.id || 0,
      priority: "medium",
      description: `Follow-up call with ${lead?.name || 'Lead'}`
    });
  };
  
  const handleReassignLead = () => {
    if (!selectedAssignee) {
      toast({
        title: "Error",
        description: "Please select a team member to reassign this lead to.",
        variant: "destructive",
      });
      return;
    }
    
    reassignLeadMutation.mutate(selectedAssignee);
  };
  
  const statusOptions = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "rnr", label: "RNR" },
    { value: "follow_up", label: "Follow-Up" },
    { value: "interested", label: "Interested" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

  // Early returns after all hooks are defined
  if (isLeadLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading lead details...</p>
        </div>
      </div>
    );
  }
  
  if (!lead || !lead.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Lead Not Found</h2>
          <p className="text-neutral-500 mb-4">The lead you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{`${lead.name} | Lead Details | LeadTrackPro`}</title>
        <meta name="description" content={`Manage and track details for lead: ${lead.name}`} />
      </Helmet>
      
      {/* Reassign Lead Modal */}
      <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Lead</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-neutral-600">
              Select a team member to reassign this lead to:
            </p>
            <Select value={selectedAssignee?.toString()} onValueChange={(value) => setSelectedAssignee(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member: any) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassignLead} disabled={!selectedAssignee || reassignLeadMutation.isPending}>
              {reassignLeadMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Reassigning...
                </>
              ) : "Reassign Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={isEditContactModalOpen} onOpenChange={setIsEditContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editedPhone}
                onChange={(e) => setEditedPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="editPosition">Position</Label>
              <Input
                id="editPosition"
                value={editedPosition}
                onChange={(e) => setEditedPosition(e.target.value)}
                placeholder="Enter position/title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditContactModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditContact} disabled={editContactMutation.isPending}>
              {editContactMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : "Update Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <>
        {/* Header */}
        <div className="p-4 border-b bg-white -m-4 md:-m-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/leads")}
                className="mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
                <span className="hidden xs:inline">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-heading font-semibold">Lead Details</h1>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-primary border-2 text-primary font-semibold text-sm flex-1 sm:flex-none">
                    <span className="hidden xs:inline">Change Status</span>
                    <span className="xs:hidden">Status</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="m6 9 6 6 6-6"/></svg>
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="grid divide-y">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      className={`justify-start py-2.5 ${lead.status === option.value ? 'bg-primary/10 font-medium' : ''}`}
                      onClick={() => {
                        updateLeadStatusMutation.mutate(option.value);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-neutral-100 min-h-screen -m-4 md:-m-6 p-4 lg:p-6">
          {/* AI-powered Lead Summary */}
          {lead && lead.id && (
            <LeadSummary leadId={lead.id} />
          )}
          
          {/* Lead Header Info */}
          <div className="flex items-start mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center mr-3 sm:mr-4 text-sm sm:text-lg flex-shrink-0">
              <span>{getInitials(lead.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="font-heading font-semibold text-lg sm:text-xl truncate">{lead.name}</h3>
              </div>
              <div className="mt-1 text-xs sm:text-sm text-neutral-500">
                <p className="truncate">Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
                <p className="truncate">Source: {lead.source || "Manual Entry"}</p>
              </div>
            </div>
          </div>
          
          {/* Status and Assignment Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h4 className="font-medium text-sm sm:text-base">Lead Status</h4>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-primary border-2 text-primary font-semibold h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <span className="sm:hidden">Status</span>
                      <span className="hidden sm:inline">Change Status</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="grid divide-y">
                      {statusOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          className={`justify-start py-2.5 ${lead.status === option.value ? 'bg-primary/10 font-medium' : ''}`}
                          onClick={() => {
                            updateLeadStatusMutation.mutate(option.value);
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Badge className={`${getStatusColor(lead.status)} text-sm py-1 px-3`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Last updated: {new Date(lead.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Assigned To Card */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h4 className="font-medium text-sm sm:text-base">Assigned To</h4>
                {user && (user.role === 'admin' || user.role === 'agency_admin' || user.role === 'client_admin' || user.role === 'super_admin') && (
                  <Button 
                    variant="outline" 
                    className="border-primary border-2 text-primary font-semibold h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                    onClick={() => setIsReassignModalOpen(true)}
                  >
                    Reassign
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-primary">
                        {lead.assignedUser ? getInitials(lead.assignedUser.username) : "NA"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{lead.assignedUser ? lead.assignedUser.username : "Unassigned"}</p>
                      {lead.assignedUser && lead.assignedAt && (
                        <p className="text-xs text-neutral-500">Assigned on {new Date(lead.assignedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Contact Information</h4>
              <Button 
                variant="outline" 
                className="border-primary border-2 text-primary font-semibold h-8 sm:h-9 text-xs sm:text-sm"
                onClick={() => setIsEditContactModalOpen(true)}
              >
                Edit Contact
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Phone</p>
                <p className="text-base font-medium">
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                      {formatPhoneNumber(lead.phone)}
                    </a>
                  ) : "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Email</p>
                <p className="text-base font-medium">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  ) : "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Position</p>
                <p className="text-base font-medium">{lead.position || "Not specified"}</p>
              </div>
            </div>
          </div>
          
          {/* AI-powered Lead Insights */}
          {lead && lead.id && (
            <AILeadInsights lead={lead} />
          )}
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="flex-1 h-auto py-2.5 flex-col items-center gap-1"
                onClick={() => addActivityMutation.mutate({ type: "call", content: "Call initiated" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span className="text-xs font-medium">Call</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-auto py-2.5 flex-col items-center gap-1"
                onClick={() => addActivityMutation.mutate({ type: "email", content: "Email sent" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span className="text-xs font-medium">Email</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-auto py-2.5 flex-col items-center gap-1"
                onClick={() => addActivityMutation.mutate({ type: "whatsapp", content: "WhatsApp message sent" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l1.664 1.664M21 21l-1.5-1.5"></path><path d="M8.5 14c1.5 1.5 2.5 2.5 4.5 0"></path><path d="M10.5 8.5c0-.964-.778-1.75-1.731-1.75-1.2 0-1.269 1.142-1.269 2.25 0 2.25.646 4.425 2.249 6.028 1.603 1.603 3.776 2.245 6.022 2.245 1.1 0 2.25-.066 2.25-1.275a1.74 1.74 0 0 0-1.75-1.723"></path><path d="M17.75 8.5C18 3.764 12.5 3 12.5 7.5"></path><path d="M14 13.5c.5.5 2 .5 2.5 0 .5-.5 0-2-1-3-1-1-4-.5-4 2 0 1.5 1 3 3 3s4-1 4-2.5c0-2-3-3-3-3"></path></svg>
                <span className="text-xs font-medium">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-auto py-2.5 flex-col items-center gap-1"
                onClick={() => addActivityMutation.mutate({ type: "sms", content: "SMS sent" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span className="text-xs font-medium">SMS</span>
              </Button>
            </div>
          </div>
          
          {/* Add Note & Set Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add Note */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-medium mb-3">Add Note</h4>
              <Textarea 
                placeholder="Type your note here..." 
                className="mb-2" 
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <Button 
                className="w-full"
                onClick={handleAddNote}
                disabled={addActivityMutation.isPending}
              >
                {addActivityMutation.isPending && noteText ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : null}
                Add Note
              </Button>
            </div>
            
            {/* Set Follow-up */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-medium mb-3">Set Follow-up</h4>
              <div className="flex items-center mb-3">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal h-10 ${!followUpDate ? 'text-neutral-500' : ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                      {followUpDate ? format(followUpDate, 'PPP') : 'Select Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center mb-3">
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2" 
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <Button 
                className="w-full"
                onClick={handleSetFollowUp}
                disabled={!followUpDate || createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : null}
                Set Follow-up
              </Button>
            </div>
          </div>
          
          {/* Quick Actions - Communication */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h4 className="font-medium mb-3">Quick Communication</h4>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setShowMessageDialog(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                <span className="w-4 h-4">💬</span>
                Send WhatsApp
              </button>
              <button 
                onClick={() => setShowEmailDialog(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <span className="w-4 h-4">📧</span>
                Send Email
              </button>
              <button 
                onClick={() => window.open(`tel:${lead.phone}`, '_self')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                <span className="w-4 h-4">📞</span>
                Make Call
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h4 className="font-medium mb-3">Conversation History</h4>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {(activities || []).filter((activity: any) => 
                ['whatsapp', 'sms', 'email'].includes(activity.type)
              ).map((activity: any) => (
                <div key={activity.id} className={`flex ${activity.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    activity.direction === 'incoming' 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    <div className="text-sm">{activity.content}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {activity.type === 'whatsapp' && '📱 WhatsApp'}
                      {activity.type === 'sms' && '💬 SMS'}
                      {activity.type === 'email' && '📧 Email'}
                      {activity.direction === 'incoming' ? ' • Received' : ' • Sent'}
                      {activity.createdAt && ` • ${format(new Date(activity.createdAt), 'MMM d, h:mm a')}`}
                    </div>
                  </div>
                </div>
              )) || []}
              
              {!(activities || []).some((activity: any) => 
                ['whatsapp', 'sms', 'email'].includes(activity.type)
              ) && (
                <div className="text-center py-8 text-neutral-500">
                  No conversations yet. Start by sending a message!
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h4 className="font-medium mb-3">Activity Timeline</h4>
            
            {isActivitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <span className="text-sm text-neutral-500 ml-2">Loading activities...</span>
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary"></div>
                    <div className="flex-1 w-px bg-neutral-200 absolute left-1.5 top-4 bottom-0"></div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {activity.type === 'note' && 'Note Added'}
                          {activity.type === 'call' && 'Call Logged'}
                          {activity.type === 'email' && 'Email Sent'}
                          {activity.type === 'whatsapp' && 'WhatsApp Message'}
                          {activity.type === 'sms' && 'SMS Sent'}
                          {activity.type === 'status_change' && 'Status Changed'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm">{activity.content}</div>
                      {activity.user && (
                        <div className="text-xs text-neutral-500">
                          By: {activity.user.username}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No activities recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send WhatsApp Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">To: {lead.name} ({lead.phone})</label>
              </div>
              <Textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!messageText.trim()) return;
                    try {
                      const response = await apiRequest("POST", "/api/whatsapp/send", {
                        leadId: lead.id,
                        to: lead.phone,
                        message: messageText,
                        subAccountId: currentSubAccount?.id || 1,
                        userId: user?.id || 1
                      });
                      
                      if (response.ok) {
                        setShowMessageDialog(false);
                        setMessageText("");
                        toast({
                          title: "Success",
                          description: "WhatsApp message sent successfully"
                        });
                        // Refresh activities
                        queryClient.invalidateQueries({ queryKey: ["/api/leads", id, "activities"] });
                      } else {
                        throw new Error("Failed to send message");
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to send WhatsApp message",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!messageText.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Send WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">To: {lead.name} ({lead.email})</label>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <input
                  type="text"
                  placeholder="Email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your email message..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!emailSubject.trim() || !emailBody.trim()) return;
                    try {
                      const response = await apiRequest("POST", "/api/communications/send-email", {
                        leadId: lead.id,
                        to: lead.email,
                        subject: emailSubject,
                        body: emailBody
                      });
                      
                      if (response.ok) {
                        setShowEmailDialog(false);
                        setEmailSubject("");
                        setEmailBody("");
                        toast({
                          title: "Success",
                          description: "Email sent successfully"
                        });
                        // Refresh activities
                        queryClient.invalidateQueries({ queryKey: ["/api/leads", id, "activities"] });
                      } else {
                        throw new Error("Failed to send email");
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to send email",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!emailSubject.trim() || !emailBody.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </>
  );
}