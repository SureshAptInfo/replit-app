import { useState } from 'react';
import { useLocation } from 'wouter';
import { Skeleton } from "@/components/ui/skeleton";

interface LeadStatusCardsProps {
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
  isLoading?: boolean;
}

export default function LeadStatusCards({ counts, isLoading = false }: LeadStatusCardsProps) {
  const [, navigate] = useLocation();

  const statuses = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'unread', label: 'Unread', count: counts.unread },
    { key: 'contacted', label: 'Contacted', count: counts.contacted },
    { key: 'rnr', label: 'RNR', count: counts.rnr },
    { key: 'follow_up', label: 'Follow-Up', count: counts.follow_up },
    { key: 'interested', label: 'Interested', count: counts.interested },
    { key: 'converted', label: 'Converted', count: counts.converted },
    { key: 'lost', label: 'Lost', count: counts.lost },
  ];

  const handleCardClick = (status: string) => {
    // Use tab parameter instead of status to align with how the leads page expects parameters
    navigate(`/leads?tab=${status}`);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto pb-2 mb-6">
        <div className="flex space-x-3 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex-1 min-w-[110px] bg-white px-4 py-3 rounded-xl shadow-sm">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2 mb-6">
      <div className="flex space-x-3 min-w-max">
        {statuses.map((status) => (
          <button
            key={status.key}
            onClick={() => handleCardClick(status.key)}
            className="stats-card flex-1 min-w-[110px] bg-white px-4 py-3 rounded-xl shadow-sm flex flex-col hover:bg-neutral-50 transition-colors text-left"
          >
            <span className="text-sm text-neutral-400 mb-1">{status.label}</span>
            <span className="text-xl font-semibold">{status.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
