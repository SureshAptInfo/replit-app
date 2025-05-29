import { useLocation } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { getInitials, getStatusColor, getSourceColor } from '@/lib/utils';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  source?: string;
  createdAt: string;
  assignedTo?: number;
  assignedUser?: {
    id: number;
    name: string;
    username: string;
  };
}

interface RecentLeadsProps {
  leads: Lead[];
  isLoading?: boolean;
}

export default function RecentLeads({ leads, isLoading = false }: RecentLeadsProps) {
  const [, navigate] = useLocation();

  const handleViewLead = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-medium">Recent Leads</h3>
          <Skeleton className="h-5 w-16" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Created</th>
                <th className="pb-2 font-medium">Assigned To</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-3">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <Skeleton className="h-6 w-16" />
                  </td>
                  <td className="py-3">
                    <Skeleton className="h-6 w-16" />
                  </td>
                  <td className="py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <Skeleton className="h-6 w-6 rounded-full mr-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </td>
                  <td className="py-3">
                    <Skeleton className="h-6 w-6" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-medium">Recent Leads</h3>
          <Button variant="link" onClick={() => navigate('/leads')}>View All</Button>
        </div>
        
        <div className="py-8 text-center">
          <p className="text-neutral-500">No leads available yet.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/leads')}
          >
            Add Your First Lead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-medium">Recent Leads</h3>
        <Button variant="link" onClick={() => navigate('/leads')}>View All</Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-neutral-500 border-b">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Source</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Created</th>
              <th className="pb-2 font-medium">Assigned To</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center mr-3 text-xs">
                      {getInitials(lead.name)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-neutral-400">{lead.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  {lead.source && (
                    <Badge variant={lead.source.toLowerCase() as any}>
                      {lead.source}
                    </Badge>
                  )}
                </td>
                <td className="py-3">
                  <Badge variant={lead.status as any}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                  </Badge>
                </td>
                <td className="py-3 text-sm text-neutral-500">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </td>
                <td className="py-3">
                  {lead.assignedUser ? (
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center mr-2 text-xs">
                        {getInitials(lead.assignedUser.name)}
                      </div>
                      <span className="text-sm">{lead.assignedUser.name.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-400">Unassigned</span>
                  )}
                </td>
                <td className="py-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-primary hover:text-primary-dark"
                    onClick={() => handleViewLead(lead.id)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
