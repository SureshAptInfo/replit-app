import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface StatusTabsProps {
  activeTab: string;
  counts: {
    all: number;
    unread: number;
    contacted: number;
    rnr: number;
    follow_up: number;
    interested: number;
    converted: number;
    lost: number;
  };
  onTabChange: (tab: string) => void;
  isLoading?: boolean;
}

export default function StatusTabs({ 
  activeTab, 
  counts, 
  onTabChange,
  isLoading = false 
}: StatusTabsProps) {
  // Use actual counts from the API instead of hardcoded values
  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unread', label: 'Unread', count: counts.unread },
    { id: 'contacted', label: 'Contacted', count: counts.contacted },
    { id: 'rnr', label: 'RNR', count: counts.rnr },
    { id: 'follow_up', label: 'Follow-Up', count: counts.follow_up },
    { id: 'interested', label: 'Interested', count: counts.interested },
    { id: 'converted', label: 'Converted', count: counts.converted },
    { id: 'lost', label: 'Lost', count: counts.lost },
  ];

  if (isLoading) {
    return (
      <div className="mt-4 border-b border-neutral-200">
        <div className="flex overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <div key={tab.id} className="px-4 py-2">
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Handle tab click by updating URL and calling the change handler
  const handleTabClick = (tabId: string) => {
    // Update the URL to include the tab parameter
    // This also allows for bookmarking and sharing specific tab views
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
    
    // Call the parent component's tab change handler
    onTabChange(tabId);
  };

  return (
    <div className="mt-4 border-b border-neutral-200">
      <div className="flex overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            )}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="inline sm:hidden">{tab.label.substring(0, 3)}</span>
            <span className="ml-1">({tab.count || 0})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
