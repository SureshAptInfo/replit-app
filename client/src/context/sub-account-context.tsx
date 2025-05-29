import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";

type SubAccount = {
  id: number;
  name: string;
  logo?: string;
  domain?: string;
  senderId?: string;
  agencyId: number;
  active: boolean;
  createdAt: string;
};

type SubAccountContextType = {
  subAccounts: SubAccount[];
  currentSubAccount: SubAccount | null;
  isLoading: boolean;
  switchSubAccount: (id: number) => void;
};

const SubAccountContext = createContext<SubAccountContextType | undefined>(undefined);

export function SubAccountProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentSubAccount, setCurrentSubAccount] = useState<SubAccount | null>(null);

  // Fetch subaccounts
  const { data: subAccounts = [], isLoading, error } = useQuery({
    queryKey: [isAuthenticated ? "/api/subaccounts" : null],
    enabled: !!isAuthenticated,
  });

  // Set initial sub-account when data is loaded
  useEffect(() => {
    if (!isLoading && subAccounts.length > 0 && !currentSubAccount) {
      // If user has a subAccountId, use that one
      if (user?.subAccountId) {
        const userSubAccount = subAccounts.find((sa: SubAccount) => sa.id === user.subAccountId);
        if (userSubAccount) {
          setCurrentSubAccount(userSubAccount);
          return;
        }
      }
      
      // Otherwise use the first active one
      const activeSubAccount = subAccounts.find((sa: SubAccount) => sa.active);
      if (activeSubAccount) {
        setCurrentSubAccount(activeSubAccount);
      } else if (subAccounts.length > 0) {
        // Or just the first one if none are active
        setCurrentSubAccount(subAccounts[0]);
      }
    }
  }, [subAccounts, isLoading, currentSubAccount, user]);

  // Switch sub-account function
  const switchSubAccount = (id: number) => {
    const newSubAccount = subAccounts.find((sa: SubAccount) => sa.id === id);
    if (newSubAccount) {
      setCurrentSubAccount(newSubAccount);
      toast({
        title: "Sub-Account Switched",
        description: `You are now viewing ${newSubAccount.name}`,
      });
    }
  };

  const value = {
    subAccounts,
    currentSubAccount,
    isLoading,
    switchSubAccount,
  };

  return <SubAccountContext.Provider value={value}>{children}</SubAccountContext.Provider>;
}

export function useSubAccount() {
  const context = useContext(SubAccountContext);
  if (context === undefined) {
    throw new Error("useSubAccount must be used within a SubAccountProvider");
  }
  return context;
}
