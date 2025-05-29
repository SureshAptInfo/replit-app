import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSubAccount } from "@/context/sub-account-context";
import { useAuth } from "@/context/auth-context";

import {
  BarChart3,
  Calendar,
  ClipboardList,
  Contact,
  FolderKanban,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  PieChart,
  Settings,
  Sliders,
  SquareStack,
  Users2,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, href, isActive, onClick }: NavItemProps) => (
  <Link href={href}>
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent cursor-pointer",
        isActive ? "bg-accent text-primary font-medium" : "text-muted-foreground"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground"),
      })}
      <span>
        {label}
        {label === "Leads" && " (1)"}
        {label === "Tasks" && " (0)"}
        {label === "Messages" && " (3)"}
      </span>
    </div>
  </Link>
);

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const { currentSubAccount } = useSubAccount();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed on mobile
  
  const handleLogout = async () => {
    await logout();
  };

  // Common nav items for all users
  const commonNavItems = [
    { icon: <LayoutDashboard />, label: "Dashboard", href: "/" },
    { icon: <Contact />, label: "Leads", href: "/leads" },
    { icon: <ClipboardList />, label: "Calendar & Tasks", href: "/tasks" },
    { icon: <MessageSquare />, label: "Messages", href: "/messages" },
    { icon: <Mail />, label: "Templates", href: "/templates" },
    { icon: <FolderKanban />, label: "Workflows", href: "/workflows" },
    { icon: <PieChart />, label: "Reports", href: "/reports" },
    { icon: <Settings />, label: "Settings", href: "/settings" },
  ];

  // Nav items only for admin-level users
  const adminOnlyNavItems = [
    { icon: <Sliders />, label: "Integrations", href: "/integrations" },
    { icon: <SquareStack />, label: "Team", href: "/team" },
  ];

  // Combine nav items based on user role
  const navItems = user && ["super_admin", "agency_owner", "agency_admin", "client_admin"].includes(user.role)
    ? [...commonNavItems, ...adminOnlyNavItems]
    : commonNavItems;

  // Admin routes if user has admin role
  const adminItems = [
    { icon: <BarChart3 />, label: "Admin Dashboard", href: "/admin" },
    { icon: <FolderKanban />, label: "AWS Configuration", href: "/admin/aws-config" },
    { icon: <Mail />, label: "Email Configuration", href: "/admin/email-config" },
    { icon: <BarChart3 />, label: "Payment Configuration", href: "/admin/payment-config" },
    { icon: <BarChart3 />, label: "Video Configuration", href: "/admin/video-config" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />
      
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-background border-r border-border transition-all duration-300 z-50 shrink-0",
          "fixed md:relative h-full",
          collapsed 
            ? "w-0 md:w-[70px] -translate-x-full md:translate-x-0" 
            : "w-[250px] translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Home className="h-6 w-6 text-primary" />
              {!collapsed && <span className="font-bold text-xl">LeadTrackPro</span>}
            </div>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-2 rounded-md hover:bg-accent text-muted-foreground"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            )}
          </button>
        </div>

        {/* Account Selector */}
        {!collapsed && currentSubAccount && (
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 rounded-md p-2 bg-accent/50">
              {currentSubAccount.logo ? (
                <img
                  src={currentSubAccount.logo}
                  alt={currentSubAccount.name}
                  className="h-6 w-6 rounded"
                />
              ) : (
                <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {currentSubAccount.name.substring(0, 1)}
                </div>
              )}
              <span className="font-medium text-sm truncate">
                {currentSubAccount.name}
              </span>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              // For the dashboard route, check if location is exactly "/"
              const isActive = 
                item.href === "/" 
                  ? location === "/"
                  : location.startsWith(item.href);
                  
              return (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={collapsed ? "" : item.label}
                  href={item.href}
                  isActive={isActive}
                />
              );
            })}
          </div>

          {/* Admin Navigation - Only show for admin roles */}
          {user && ["super_admin", "agency_owner", "agency_admin"].includes(user.role) && (
            <>
              {!collapsed && (
                <div className="mt-6 mb-2 px-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </h3>
                </div>
              )}
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <NavItem
                    key={item.href}
                    icon={item.icon}
                    label={collapsed ? "" : item.label}
                    href={item.href}
                    isActive={location.startsWith(item.href)}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User Profile and Logout */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {user?.name?.substring(0, 1) || 'U'}
              </div>
              {!collapsed && (
                <div>
                  <div className="font-medium text-sm">{user?.name || 'User'}</div>
                  <div className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</div>
                </div>
              )}
            </div>
            
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Logout button when sidebar is collapsed */}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex justify-center p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden bg-accent/5 h-screen flex flex-col">
        {/* Mobile header with menu toggle */}
        <div className="md:hidden p-4 flex items-center border-b border-border bg-white flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-accent text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
          <div className="ml-3">
            <h1 className="font-bold text-lg text-primary">LeadTrackPro</h1>
          </div>
        </div>
        
        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}