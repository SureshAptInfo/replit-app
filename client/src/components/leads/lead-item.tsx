import { useLocation } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';

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
  };
}

interface LeadItemProps {
  lead: Lead;
}

export default function LeadItem({ lead }: LeadItemProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    navigate(`/leads/${lead.id}`);
  };

  // Map backend status values to proper display labels
  const statusMap: Record<string, string> = {
    'new': 'Unread',
    'contacted': 'Contacted',
    'rnr': 'RNR',
    'follow_up': 'Follow-Up',
    'interested': 'Interested',
    'converted': 'Converted',
    'lost': 'Lost'
  };
  
  // Use the mapped status or fallback to capitalized format
  const statusDisplay = statusMap[lead.status] || 
    lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ');

  return (
    <div 
      onClick={handleClick} 
      className="p-4 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
    >
      <div className="flex justify-between">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center mr-3 text-sm">
            {getInitials(lead.name)}
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium">{lead.name}</h3>
              <Badge className="ml-2" variant={lead.status as any}>
                {statusDisplay}
              </Badge>
            </div>
            <div className="flex items-center mt-1 text-sm text-neutral-500">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2 text-xs w-3 h-3"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center mt-1 text-sm text-neutral-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2 text-xs w-3 h-3"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>{lead.email}</span>
              </div>
            )}
            <div className="flex items-center mt-2">
              {lead.source && (
                <Badge variant={lead.source.toLowerCase() as any} className="mr-2">
                  {lead.source}
                </Badge>
              )}
              <div className="text-xs text-neutral-400">
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-neutral-400 mb-2">Assigned to</div>
          {lead.assignedUser ? (
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center mr-2 text-xs">
                {getInitials(lead.assignedUser.name)}
              </div>
              <span className="text-sm">{lead.assignedUser.name}</span>
            </div>
          ) : (
            <span className="text-sm text-neutral-400">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}
