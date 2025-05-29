import { useState } from "react";
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

export default function LeadDetailFixed() {
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
  
  // Fetch lead details
  const { data: lead = {
    id: 0,
    name: "",
    email: "",
    phone: "",
    status: "new",
    source: "manual",
    created: new Date().toISOString(),
    lastActivity: null,
    notes: "",
    assignedTo: null,
    followUpDate: null,
    value: 0,
    position: "",
    company: ""
  }, isLoading } = useQuery({
    queryKey: ['/api/leads', id],
    enabled: !!id
  });

  // Fetch activities for this lead
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/leads', id, 'activities'],
    enabled: !!id
  });

  // Fetch team members for reassignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team'],
    enabled: !!currentSubAccount?.id
  }) as { data: Array<{ id: number; name: string; role: string }> };

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, {
        status: newStatus
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads', id, 'activities'] });
      toast({
        title: "Status Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await apiRequest("POST", `/api/leads/${id}/activities`, {
        type: "note",
        note: note,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', id, 'activities'] });
      setNoteText("");
      toast({
        title: "Note Added",
        description: "Note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    }
  });

  // Schedule follow-up mutation
  const scheduleFollowUpMutation = useMutation({
    mutationFn: async () => {
      if (!followUpDate) return;
      
      const followUpDateTime = new Date(followUpDate);
      const [hours, minutes] = followUpTime.split(':');
      followUpDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const response = await apiRequest("PATCH", `/api/leads/${id}`, {
        followUpDate: followUpDateTime.toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', id] });
      setFollowUpDate(undefined);
      setIsCalendarOpen(false);
      toast({
        title: "Follow-up Scheduled",
        description: "Follow-up has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule follow-up.",
        variant: "destructive",
      });
    }
  });

  // Reassign lead mutation
  const reassignMutation = useMutation({
    mutationFn: async (newAssigneeId: number) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, {
        assignedTo: newAssigneeId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', id] });
      setIsReassignModalOpen(false);
      setSelectedAssignee(null);
      toast({
        title: "Lead Reassigned",
        description: "Lead has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign lead.",
        variant: "destructive",
      });
    }
  });

  const handleStatusUpdate = (status: string) => {
    setSelectedStatus(status);
    statusMutation.mutate(status);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate(noteText);
  };

  const handleScheduleFollowUp = () => {
    scheduleFollowUpMutation.mutate();
  };

  const handleReassign = () => {
    if (!selectedAssignee) return;
    reassignMutation.mutate(selectedAssignee);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusOptions = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "rnr", label: "Ring No Response" },
    { value: "follow_up", label: "Follow Up" },
    { value: "interested", label: "Interested" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

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
            <label className="block text-sm font-medium mb-2">Select Team Member</label>
            <Select 
              value={selectedAssignee?.toString() || ""} 
              onValueChange={(value) => setSelectedAssignee(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(teamMembers) && teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReassign}
              disabled={!selectedAssignee || reassignMutation.isPending}
            >
              {reassignMutation.isPending ? "Reassigning..." : "Reassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Fixed Layout Structure */}
      <div className="min-h-screen bg-neutral-100">
        {/* Header */}
        <div className="bg-white border-b p-4">
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
                        className="justify-start rounded-none h-auto p-3"
                        onClick={() => handleStatusUpdate(option.value)}
                        disabled={statusMutation.isPending}
                      >
                        <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(option.value)}`} />
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
        <div className="p-4 lg:p-6">
          {/* AI-powered Lead Summary */}
          {lead && lead.id && (
            <LeadSummary leadId={lead.id} />
          )}

          {/* Lead Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Lead Details Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{lead.name}</h2>
                  <Badge variant="secondary" className={`${getStatusColor(lead.status)} text-white font-medium`}>
                    {lead.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  Created: {lead.created ? format(new Date(lead.created), 'PPp') : 'Unknown'}
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Source: {lead.source}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span className="text-sm">{lead.email || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span className="text-sm">{formatPhoneNumber(lead.phone) || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Professional Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span className="text-sm">{lead.position || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
                        <span className="text-sm">{lead.company || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              {lead && lead.id && (
                <AILeadInsights lead={lead} />
              )}

              {/* Activities */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Activities</h2>
                
                {/* Add Note */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                      {getInitials(user?.name || 'User')}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="mb-3"
                      />
                      <Button 
                        onClick={handleAddNote} 
                        disabled={!noteText.trim() || addNoteMutation.isPending}
                        size="sm"
                      >
                        {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Activity List */}
                {Array.isArray(activities) && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
                          {getInitials(activity.userName || 'User')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{activity.userName || 'System'}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {activity.created ? format(new Date(activity.created), 'PPp') : 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{activity.note || activity.description}</p>
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Assignment */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={() => document.querySelector('[data-radix-popper-content-wrapper]')?.querySelector('button')?.click()}
                    >
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(lead.status)}`} />
                        {lead.status}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Assigned To</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsReassignModalOpen(true)}
                      >
                        Reassign
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                        {lead.assignedTo ? getInitials('Assigned User') : 'U'}
                      </div>
                      <span className="text-sm text-gray-600">
                        {lead.assignedTo ? 'Unassigned' : 'Unassigned'}
                      </span>
                      <span className="text-xs text-gray-400">
                        Last activity 5/26/2025
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow-up Scheduling */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-medium mb-4">Schedule Follow-up</h3>
                <div className="space-y-3">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        {followUpDate ? format(followUpDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        onSelect={setFollowUpDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Select value={followUpTime} onValueChange={setFollowUpTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleScheduleFollowUp}
                    disabled={!followUpDate || scheduleFollowUpMutation.isPending}
                    className="w-full"
                  >
                    {scheduleFollowUpMutation.isPending ? "Scheduling..." : "Schedule Follow-up"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}