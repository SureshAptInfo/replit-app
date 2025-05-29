import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Interface for sub-account data
export interface SubAccountData {
  name: string;
  logo?: string;
  domain?: string;
  senderId?: string;
  agencyId: number;
  active: boolean;
}

// Hook for sub-account-related API operations
export function useSubAccountApi() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create a new sub-account
  const createSubAccount = useMutation({
    mutationFn: async (data: SubAccountData) => {
      const response = await apiRequest('POST', '/api/subaccounts', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subaccounts'] });
      toast({
        title: 'Success',
        description: 'Sub-account created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create sub-account',
        variant: 'destructive',
      });
    },
  });

  // Update an existing sub-account
  const updateSubAccount = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SubAccountData> }) => {
      const response = await apiRequest('PATCH', `/api/subaccounts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subaccounts'] });
      toast({
        title: 'Success',
        description: 'Sub-account updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update sub-account',
        variant: 'destructive',
      });
    },
  });

  // Get all sub-accounts
  const useSubAccounts = () => {
    return useQuery({
      queryKey: ['/api/subaccounts'],
    });
  };

  // Get a single sub-account by ID
  const useSubAccount = (id?: number) => {
    return useQuery({
      queryKey: [id ? `/api/subaccounts/${id}` : null],
      enabled: !!id,
    });
  };

  return {
    createSubAccount,
    updateSubAccount,
    useSubAccounts,
    useSubAccount,
  };
}
