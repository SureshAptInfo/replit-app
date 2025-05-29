import { useQuery } from '@tanstack/react-query';
import { useSubAccount } from '@/context/sub-account-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// This component handles the search, source filter, and create lead button functionality

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  onCreateLead: () => void;
}

export default function LeadFilters({
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  onCreateLead
}: LeadFiltersProps) {
  const { currentSubAccount } = useSubAccount();
  const { user } = useAuth();

  // Fetch sources for the dropdown
  // In a real app, we would fetch the unique sources from the API
  const { data: sources = [], isLoading: isSourcesLoading } = useQuery({
    queryKey: [currentSubAccount ? `/api/leads/sources?subAccountId=${currentSubAccount.id}` : null],
    enabled: !!currentSubAccount,
    placeholderData: ['Facebook', 'Google', 'Website', 'Referral', 'Manual'],
  });

  return (
    <div className="flex space-x-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search leads..."
          className="w-full md:w-64 pl-9"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-neutral-400 text-sm w-4 h-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
      
      <div className="relative">
        {isSourcesLoading ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <select
            className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={sourceFilter}
            onChange={(e) => onSourceFilterChange(e.target.value)}
          >
            <option value="">All Sources</option>
            {sources.map((source: any) => (
              <option key={source.id || source} value={source.id || source}>
                {source.name || source}
              </option>
            ))}
          </select>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-xs w-4 h-4"
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onCreateLead} className="bg-primary hover:bg-primary-dark text-white rounded-lg">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="mr-2 w-4 h-4"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
        
        {/* Only show import button for admin roles or client_admin */}
        {user && ["super_admin", "agency_owner", "agency_admin", "client_admin"].includes(user.role) && (
          <Button 
            variant="outline" 
            className="text-primary border-primary hover:bg-primary/10 rounded-lg" 
            id="import-leads-button"
            onClick={() => window.location.href = '/csv-import'}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-2 w-4 h-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="hidden sm:inline">Import Leads</span>
          </Button>
        )}
      </div>
    </div>
  );
}
