import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LightbulbIcon, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface LeadSummaryProps {
  leadId: number;
}

interface LeadSummaryData {
  summary: string;
  suggestedActions: string[];
}

export function LeadSummary({ leadId }: LeadSummaryProps) {
  // Fetch the summary data
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/ai/lead-summary", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const response = await apiRequest("GET", `/api/ai/lead-summary/${leadId}`);
      const data = await response.json();
      return data as LeadSummaryData;
    },
    enabled: !!leadId
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <LightbulbIcon className="h-5 w-5 mr-2 text-amber-500" />
            <CardTitle className="text-lg">AI-Powered Lead Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Suggested Actions:</p>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="mb-6 border-amber-200">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <LightbulbIcon className="h-5 w-5 mr-2 text-amber-500" />
            <CardTitle className="text-lg">Lead Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to generate lead summary at this time. Please check again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Make sure data has the expected properties to prevent errors
  const summary = data?.summary || "No summary available";
  const suggestedActions = Array.isArray(data?.suggestedActions) ? data.suggestedActions : [];

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <LightbulbIcon className="h-5 w-5 mr-2 text-amber-500" />
          <CardTitle className="text-lg">AI-Powered Lead Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-800">{summary}</p>
        
        {suggestedActions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Suggested Next Steps:</p>
            <div className="space-y-2">
              {suggestedActions.map((action, index) => (
                <div 
                  key={index} 
                  className="flex items-start p-2 rounded-md bg-white border border-amber-200"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}