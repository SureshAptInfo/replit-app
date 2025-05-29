import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Chart data types
type ChartData = {
  name: string;
  value: number;
  color: string;
}[];

// Sample data to use when real data is loading or unavailable
const sampleData: ChartData = [
  { name: 'Facebook', value: 120, color: '#3f51b5' },
  { name: 'Google', value: 180, color: '#3f51b5' },
  { name: 'Website', value: 80, color: '#3f51b5' },
  { name: 'Referral', value: 150, color: '#3f51b5' },
  { name: 'Email', value: 50, color: '#3f51b5' },
  { name: 'Other', value: 90, color: '#3f51b5' },
];

interface LeadSourceChartProps {
  dateFilter: string;
  subAccountId?: number;
}

export default function LeadSourceChart({ dateFilter, subAccountId }: LeadSourceChartProps) {
  const [timeRange, setTimeRange] = useState('30days');
  
  // In a real app, we'd fetch this data from the backend based on the filters
  // For now, we'll simulate a loading state and then use sample data
  const { data: chartData, isLoading } = useQuery({
    queryKey: [subAccountId ? `/api/analytics/lead-sources?subAccountId=${subAccountId}&dateFilter=${dateFilter}&timeRange=${timeRange}` : null],
    enabled: !!subAccountId,
    placeholderData: sampleData,
  });
  
  // Calculate the maximum value for the Y-axis
  const maxValue = chartData ? Math.max(...chartData.map((item) => item.value)) : 0;
  const yAxisMax = Math.ceil(maxValue * 1.2 / 25) * 25; // Round up to nearest 25
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <Skeleton className="h-8 w-28" />
          </div>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="text-neutral-400">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-medium">Leads by Source</h3>
        <select 
          className="text-xs border border-neutral-200 rounded-lg px-2 py-1"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="30days">Last 30 Days</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              domain={[0, yAxisMax]}
              tickCount={5}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#3f51b5" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
