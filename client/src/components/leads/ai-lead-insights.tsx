import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Lead = {
  id: number;
  name: string;
  status: string;
  [key: string]: any;
};

interface AILeadInsightsProps {
  lead: Lead;
  onSelectMessage?: (message: string) => void;
}

export function AILeadInsights({ lead, onSelectMessage }: AILeadInsightsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("score");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("follow-up");
  
  // Fetch lead score
  const { 
    data: scoreData,
    isLoading: isScoreLoading,
    isError: isScoreError,
    refetch: refetchScore
  } = useQuery({
    queryKey: [`/api/ai/lead-score/${lead.id}`],
    enabled: activeTab === "score" && !!lead.id,
  });
  
  // Fetch message suggestions
  const { 
    data: messageSuggestions,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: [`/api/ai/message-suggestions/${lead.id}`, selectedPurpose],
    queryFn: async () => {
      const response = await apiRequest(
        "GET", 
        `/api/ai/message-suggestions/${lead.id}?purpose=${selectedPurpose}`
      );
      return response.json();
    },
    enabled: activeTab === "messages" && !!lead.id,
  });
  
  // Fetch follow-up recommendation
  const { 
    data: followUpData,
    isLoading: isFollowUpLoading,
    isError: isFollowUpError,
    refetch: refetchFollowUp
  } = useQuery({
    queryKey: [`/api/ai/follow-up-recommendation/${lead.id}`],
    enabled: activeTab === "follow-up" && !!lead.id,
  });
  
  // Helper function to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };
  
  // Select message and pass it to parent component
  const handleMessageSelect = (message: string) => {
    if (onSelectMessage) {
      onSelectMessage(message);
      toast({
        title: "Message selected",
        description: "The suggested message has been selected.",
      });
    }
  };
  
  // Message purpose options
  const purposeOptions = [
    { value: "follow-up", label: "Follow-up" },
    { value: "initial-contact", label: "Initial Contact" },
    { value: "meeting-request", label: "Meeting Request" },
    { value: "product-info", label: "Product Info" },
    { value: "closing", label: "Closing" },
  ];
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 1 1-4-4"/>
            <path d="M18 6a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4"/>
            <circle cx="12" cy="12" r="8"/>
          </svg>
          AI Lead Insights
        </CardTitle>
        <CardDescription>AI-powered analysis and suggestions for this lead</CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score">Lead Score</TabsTrigger>
            <TabsTrigger value="messages">Message Suggestions</TabsTrigger>
            <TabsTrigger value="follow-up">Follow-Up Advice</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          {/* Lead Score Content */}
          <TabsContent value="score" className="space-y-4">
            {isScoreLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : isScoreError ? (
              <div className="text-center py-6">
                <p className="text-neutral-500 mb-2">Error loading score</p>
                <Button size="sm" variant="outline" onClick={() => refetchScore()}>
                  Try Again
                </Button>
              </div>
            ) : scoreData ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-neutral-700">Lead Quality Score</h3>
                    <p className="text-sm text-neutral-500">Based on engagement and profile</p>
                  </div>
                  <Badge 
                    className={`text-lg py-1.5 px-3 ${getScoreColor(scoreData.score)}`}
                  >
                    {scoreData.score}/100
                  </Badge>
                </div>
                
                <div className="my-4">
                  <Progress value={scoreData.score} className="h-3" />
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-md mt-2">
                  <h4 className="font-medium mb-1 text-sm">Reasoning</h4>
                  <p className="text-sm text-neutral-700">{scoreData.reasoning}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="border rounded-md p-2">
                    <p className="text-xs text-neutral-500">Engagement</p>
                    <p className="font-medium">{scoreData.score >= 70 ? 'High' : scoreData.score >= 40 ? 'Medium' : 'Low'}</p>
                  </div>
                  <div className="border rounded-md p-2">
                    <p className="text-xs text-neutral-500">Likelihood to Convert</p>
                    <p className="font-medium">{scoreData.score >= 75 ? 'High' : scoreData.score >= 50 ? 'Medium' : 'Low'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500 mb-2">No score data available</p>
                <Button size="sm" variant="outline" onClick={() => refetchScore()}>
                  Generate Score
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Message Suggestions Content */}
          <TabsContent value="messages" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">Purpose:</span>
              <div className="flex flex-wrap gap-1">
                {purposeOptions.map((purpose) => (
                  <Badge
                    key={purpose.value}
                    className={`cursor-pointer hover:opacity-90 ${
                      selectedPurpose === purpose.value
                        ? "bg-primary"
                        : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                    }`}
                    onClick={() => setSelectedPurpose(purpose.value)}
                  >
                    {purpose.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            {isMessagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : isMessagesError ? (
              <div className="text-center py-6">
                <p className="text-neutral-500 mb-2">Error loading message suggestions</p>
                <Button size="sm" variant="outline" onClick={() => refetchMessages()}>
                  Try Again
                </Button>
              </div>
            ) : messageSuggestions?.suggestions ? (
              <div className="space-y-3">
                {Array.isArray(messageSuggestions.suggestions) && messageSuggestions.suggestions.map((message: string, index: number) => (
                  <div key={index} className="border rounded-md p-3 bg-white">
                    <p className="text-sm mb-2">{message}</p>
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs"
                        onClick={() => handleMessageSelect(message)}
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500 mb-2">No message suggestions available</p>
                <Button size="sm" variant="outline" onClick={() => refetchMessages()}>
                  Generate Suggestions
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Follow-Up Advice Content */}
          <TabsContent value="follow-up" className="space-y-4">
            {isFollowUpLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : isFollowUpError ? (
              <div className="text-center py-6">
                <p className="text-neutral-500 mb-2">Error loading follow-up advice</p>
                <Button size="sm" variant="outline" onClick={() => refetchFollowUp()}>
                  Try Again
                </Button>
              </div>
            ) : followUpData ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1">Optimal Timing</h4>
                    <p className="text-base">{followUpData.timing}</p>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1">Recommended Action</h4>
                    <p className="text-base">{followUpData.action}</p>
                  </div>
                </div>
                
                <div className="bg-white p-3 border rounded-md">
                  <h4 className="text-sm font-medium mb-1">Reasoning</h4>
                  <p className="text-sm text-neutral-700">{followUpData.reasoning}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500 mb-2">No follow-up recommendations available</p>
                <Button size="sm" variant="outline" onClick={() => refetchFollowUp()}>
                  Generate Recommendations
                </Button>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-0 pb-3 px-6">
        <p className="text-xs text-neutral-500">Powered by AI • Updated just now</p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => {
            if (activeTab === "score") refetchScore();
            if (activeTab === "messages") refetchMessages();
            if (activeTab === "follow-up") refetchFollowUp();
          }}
        >
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}