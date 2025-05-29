import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import SubAccountSwitcher from "@/components/shared/sub-account-switcher";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useSubAccount } from "@/context/sub-account-context";

// Define route type to properly handle badges
interface SidebarRoute {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currentSubAccount } = useSubAccount();
  
  // Fetch lead counts for the current user to show in the sidebar
  const { data: leadCountsData = { total: 0, new: 0 } } = useQuery({
    queryKey: ['/api/leads/counts', currentSubAccount?.id, Date.now()],
    queryFn: async () => {
      if (!currentSubAccount) return { total: 0, new: 0 };
      
      try {
        const timestamp = Date.now(); // Add timestamp to prevent caching
        const endpoint = `/api/leads/counts?subAccountId=${currentSubAccount.id}&timestamp=${timestamp}`;
        
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch lead counts');
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching lead counts:", error);
        return { total: 0, new: 0 };
      }
    },
    enabled: !!currentSubAccount,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0
  });
  
  // Define routes without the badge property
  const routes: SidebarRoute[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
          <path d="M3 9h18" />
          <path d="M9 22v-4" />
          <path d="M15 22v-4" />
        </svg>
      ),
    },
    {
      name: "Leads",
      path: "/leads",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },

    {
      name: "Messages",
      path: "/messages",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      name: "Tasks & Calendar",
      path: "/tasks",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      ),
    },
    {
      name: "Reports",
      path: "/reports",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  const settingsRoutes = [
    {
      name: "Integrations",
      path: "/integrations",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      name: "Team",
      path: "/team",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      name: "Templates",
      path: "/templates",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      ),
    },
  ];

  // Sidebar overlay for mobile
  const SidebarOverlay = () => {
    if (!isMobileOpen) return null;

    return (
      <div 
        className="fixed inset-0 bg-neutral-800 bg-opacity-50 z-20 md:hidden"
        onClick={() => setIsMobileOpen(false)}
      ></div>
    );
  };

  return (
    <>
      <SidebarOverlay />
      
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg md:relative md:translate-x-0 transform transition-transform duration-200 ease-in-out overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & App Name */}
          <div className="p-4 border-b">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-primary h-10 w-10 p-1 rounded mr-3"
              >
                <path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9Z" />
                <path d="m17 9-3-3H9" />
                <path d="M12 9v7" />
                <path d="m15 13-3 3-3-3" />
              </svg>
              <div>
                <h1 className="font-heading font-bold text-xl text-primary">LeadTrackPro</h1>
                <p className="text-xs text-neutral-400">Agency CRM</p>
              </div>
            </div>
          </div>

          {/* Sub Account Switcher */}
          <div className="p-4 border-b">
            <SubAccountSwitcher />
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {routes.map((route) => (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm rounded-lg", 
                      location === route.path
                        ? "bg-primary text-white"
                        : "text-neutral-500 hover:bg-neutral-100"
                    )}
                  >
                    <span className="w-5 text-center mr-3">{route.icon}</span>
                    <span className="flex-1">{route.name}</span>
                    {route.name === "Leads" && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full lead-count-badge">
                        501
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h3 className="px-4 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Settings
              </h3>
              <ul className="space-y-1 px-3">
                {settingsRoutes.map((route) => (
                  <li key={route.path}>
                    <Link
                      href={route.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm rounded-lg", 
                        location === route.path
                          ? "bg-primary text-white"
                          : "text-neutral-500 hover:bg-neutral-100"
                      )}
                    >
                      <span className="w-5 text-center mr-3">{route.icon}</span>
                      <span>{route.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t flex items-center">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-neutral-700">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-700 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-400 truncate">
                {user?.role.replace("_", " ").replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase())}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-neutral-400"
              onClick={() => logout()}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-5 w-5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header Toggle Button - rendered elsewhere */}
    </>
  );
}
