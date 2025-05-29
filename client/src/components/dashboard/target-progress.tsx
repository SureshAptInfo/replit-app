import { useQuery } from '@tanstack/react-query';
import { useSubAccount } from '@/context/sub-account-context';
import { Skeleton } from "@/components/ui/skeleton";

// Sample data structure
type TargetData = {
  name: string;
  current: number;
  target: number;
  percentage: number;
  color: string;
};

// Sample data
const sampleTargets: TargetData[] = [
  { name: 'New Leads', current: 375, target: 500, percentage: 75, color: 'bg-primary' },
  { name: 'Contacts Made', current: 240, target: 400, percentage: 60, color: 'bg-status-info' },
  { name: 'Conversions', current: 85, target: 100, percentage: 85, color: 'bg-status-success' },
];

export default function TargetProgress() {
  const { currentSubAccount } = useSubAccount();

  // In a real app, we'd fetch this data from the backend
  const { data: targets, isLoading } = useQuery({
    queryKey: [currentSubAccount ? `/api/analytics/targets?subAccountId=${currentSubAccount.id}` : null],
    enabled: !!currentSubAccount,
    placeholderData: sampleTargets,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex items-center">
                <Skeleton className="h-2.5 flex-1 mr-4" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-medium">Monthly Targets</h3>
        <select className="text-xs border border-neutral-200 rounded-lg px-2 py-1">
          <option>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
          <option>{new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {targets.map((target) => (
          <div key={target.name}>
            <p className="text-sm text-neutral-500 mb-2">{target.name}</p>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${target.color} rounded-full`} 
                    style={{ width: `${target.percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm ml-4 font-medium">{target.current}/{target.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
