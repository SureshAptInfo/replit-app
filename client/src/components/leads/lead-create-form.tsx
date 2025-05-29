import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSubAccount } from '@/context/sub-account-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';



import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Create schema for the form
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  source: z.string().min(1, 'Source is required'),
  status: z.string().default('new'),
  assignedUserId: z.number().optional(),
  subAccountId: z.number(),
  notes: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LeadCreateForm: React.FC<LeadCreateFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentSubAccount } = useSubAccount();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sources, setSources] = useState<{id: string, name: string}[]>([]);
  const [teamMembers, setTeamMembers] = useState<{id: number, username: string}[]>([]);
  
  // Fetch lead sources when component mounts
  React.useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await apiRequest('GET', '/api/leads/sources');
        const data = await response.json();
        console.log('Lead sources data:', data);
        setSources(data || []);
      } catch (error) {
        console.error('Failed to fetch lead sources:', error);
      }
    };
    
    const fetchTeamMembers = async () => {
      try {
        const response = await apiRequest('GET', '/api/team');
        const data = await response.json();
        console.log('Team members data:', data);
        setTeamMembers(data || []);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      }
    };
    
    if (isOpen) {
      fetchSources();
      fetchTeamMembers();
    }
  }, [isOpen]);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      source: '',
      status: 'new',
      assignedUserId: user?.id,
      subAccountId: currentSubAccount?.id || 0,
      notes: '',
    },
  });
  
  // Submit handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure subAccountId is set
      if (!values.subAccountId && currentSubAccount?.id) {
        values.subAccountId = currentSubAccount.id;
      }
      
      // Create a simplified payload that matches what the server expects
      const leadData = {
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        source: values.source || 'Manual Entry',
        assignedTo: values.assignedUserId, 
        subAccountId: values.subAccountId,
        notes: values.notes || null
      };
      
      console.log('Submitting lead data:', leadData);
      
      const response = await apiRequest('POST', '/api/leads', leadData);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to create lead');
        } catch (e) {
          throw new Error('Invalid server response. Please try again.');
        }
      }
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Failed to parse server response');
      }
      
      // Log a note if notes were provided
      if (values.notes && result.id) {
        await apiRequest('POST', `/api/leads/${result.id}/activities`, {
          type: 'note',
          content: values.notes,
        });
      }
      
      // Reset form and close dialog
      form.reset();
      
      // Invalidate leads query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/counts'] });
      
      toast({
        title: 'Lead Created',
        description: 'The lead has been created successfully.',
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Lead creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while creating the lead.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any initial notes about this lead..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lead'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCreateForm;