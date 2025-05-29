import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  iconColor: string;
  isNegative?: boolean;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  iconColor,
  isNegative = false,
  isLoading = false,
}: StatsCardProps) {
  return (
    <div className="stats-card bg-white p-4 rounded-xl shadow-sm transition-transform hover:translate-y-[-3px] hover:shadow-md">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-neutral-400">{title}</span>
        <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </>
      ) : (
        <>
          <div className="text-2xl font-semibold">{value}</div>
          <div className={`text-xs ${isNegative ? 'text-status-warning' : 'text-status-success'} flex items-center mt-1`}>
            {isNegative ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="M18 15l-6 6-6-6"/>
                <path d="M12 3v18"/>
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="M18 9l-6-6-6 6"/>
                <path d="M12 3v18"/>
              </svg>
            )}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        </>
      )}
    </div>
  );
}
