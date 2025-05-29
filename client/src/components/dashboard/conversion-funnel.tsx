import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";

// Define funnel stage type
interface FunnelStage {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// Sample data for when real data is loading or unavailable
const sampleFunnelData: FunnelStage[] = [
  { name: 'New Leads', value: 842, color: '#757de8', percentage: 100 },
  { name: 'Contacted', value: 562, color: '#3f51b5', percentage: 66.7 },
  { name: 'Interested', value: 182, color: '#3f51b5', percentage: 32.4 },
  { name: 'Meetings', value: 138, color: '#3f51b5', percentage: 24.6 },
  { name: 'Converted', value: 128, color: '#002984', percentage: 22.8 },
];

interface ConversionFunnelProps {
  subAccountId?: number;
}

export default function ConversionFunnel({ subAccountId }: ConversionFunnelProps) {
  // In a real app, we'd fetch this data from the backend
  const { data: funnelData, isLoading } = useQuery({
    queryKey: [subAccountId ? `/api/analytics/conversion-funnel?subAccountId=${subAccountId}` : null],
    enabled: !!subAccountId,
    placeholderData: sampleFunnelData,
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-medium">Conversion Funnel</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          {[100, 85, 60, 45, 30].map((width, i) => (
            <Skeleton key={i} className={`h-10 w-[${width}%]`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-medium">Conversion Funnel</h3>
      </div>
      
      <div className="h-64 flex flex-col items-center justify-center space-y-3">
        {funnelData.map((stage, index) => (
          <div 
            key={stage.name}
            className={`w-[${stage.percentage}%] h-10 bg-${stage.color} rounded-sm flex items-center justify-center text-white text-xs`}
            style={{ 
              width: `${stage.percentage}%`, 
              backgroundColor: stage.color 
            }}
          >
            <span>{stage.name} ({stage.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
