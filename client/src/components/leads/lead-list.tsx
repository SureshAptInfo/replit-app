import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import LeadItem from './lead-item';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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

interface LeadListProps {
  leads: Lead[];
  isLoading?: boolean;
}

export default function LeadList({ leads, isLoading = false }: LeadListProps) {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const leadsPerPage = 10;

  const startIndex = (page - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const paginatedLeads = leads.slice(startIndex, endIndex);
  const totalPages = Math.ceil(leads.length / leadsPerPage);

  // Reset page when leads change
  useEffect(() => {
    setPage(1);
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-neutral-100">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex justify-between">
                <div className="flex items-start">
                  <Skeleton className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-36 mb-2" />
                    <div className="flex mt-2">
                      <Skeleton className="h-5 w-16 mr-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="h-12 w-12 mx-auto mb-4 text-neutral-300"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">No leads found</h3>
          <p className="text-neutral-500 mb-4">No leads match your current filters</p>
          <Button onClick={() => navigate('/leads')}>Clear Filters</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="divide-y divide-neutral-100 flex-1">
        {paginatedLeads.map((lead) => (
          <LeadItem key={lead.id} lead={lead} />
        ))}
      </div>

      {/* Pagination for larger datasets */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
