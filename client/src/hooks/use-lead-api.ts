import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useSubAccount } from '@/context/sub-account-context';

// Interface for lead data
export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  status: string;
  source?: string;
  notes?: string;
  subAccountId: number;
  assignedTo?: number;
}

// Hook for lead-related API operations
export function useLeadApi() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();

  // Create a new lead
  const createLead = useMutation({
    mutationFn: async (leadData: LeadData) => {
      const response = await apiRequest('POST', '/api/leads', leadData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/counts'] });
      toast({
        title: 'Success',
        description: 'Lead created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lead',
        variant: 'destructive',
      });
    },
  });

  // Update an existing lead
  const updateLead = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LeadData> }) => {
      const response = await apiRequest('PATCH', `/api/leads/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/counts'] });
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead',
        variant: 'destructive',
      });
    },
  });

  // Add an activity to a lead
  const addLeadActivity = useMutation({
    mutationFn: async ({ leadId, data }: { leadId: number; data: { type: string; content: string } }) => {
      const response = await apiRequest('POST', `/api/leads/${leadId}/activities`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.leadId}/activities`] });
      toast({
        title: 'Success',
        description: 'Activity added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add activity',
        variant: 'destructive',
      });
    },
  });

  // Get lead counts by status
  const useLeadCounts = () => {
    return useQuery({
      queryKey: [currentSubAccount ? `/api/leads/counts?subAccountId=${currentSubAccount.id}` : null],
      enabled: !!currentSubAccount,
    });
  };

  // Get leads with optional filters
  const useLeads = (filters?: { status?: string; source?: string }) => {
    let endpoint = currentSubAccount ? `/api/leads?subAccountId=${currentSubAccount.id}` : null;
    
    if (endpoint && filters) {
      if (filters.status) {
        endpoint += `&status=${filters.status}`;
      }
      if (filters.source) {
        endpoint += `&source=${filters.source}`;
      }
    }

    return useQuery({
      queryKey: [endpoint],
      enabled: !!endpoint,
    });
  };

  // Get a single lead by ID
  const useLead = (id?: number) => {
    return useQuery({
      queryKey: [id ? `/api/leads/${id}` : null],
      enabled: !!id,
    });
  };

  // Get lead activities
  const useLeadActivities = (leadId?: number) => {
    return useQuery({
      queryKey: [leadId ? `/api/leads/${leadId}/activities` : null],
      enabled: !!leadId,
    });
  };

  return {
    createLead,
    updateLead,
    addLeadActivity,
    useLeadCounts,
    useLeads,
    useLead,
    useLeadActivities,
  };
}
