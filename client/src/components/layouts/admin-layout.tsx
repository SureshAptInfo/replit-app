import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import {
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Mail,
  Menu,
  Server,
  Settings,
  Users,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  isSubmenu?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, href, isActive, isSubmenu, onClick }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted",
          isSubmenu && "pl-10",
        )}
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  
  const handleLogout = async () => {
    await logout();
  };

  const configItems = [
    {
      icon: <Server className="h-4 w-4" />,
      label: "AWS Configuration",
      href: "/admin/aws-config",
    },
    {
      icon: <Mail className="h-4 w-4" />,
      label: "Email Configuration",
      href: "/admin/email-config",
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: "Payment Configuration",
      href: "/admin/payment-config",
    },
    {
      icon: <Video className="h-4 w-4" />,
      label: "Video Configuration",
      href: "/admin/video-config",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile top navigation */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex-1">
          <Link href="/admin">
            <a className="flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9Z" />
                <path d="m17 9-3-3H9" />
                <path d="M12 9v7" />
                <path d="m15 13-3 3-3-3" />
              </svg>
              {APP_NAME} Admin
            </a>
          </Link>
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          isSidebarOpen ? "block" : "hidden"
        )}
      >
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <nav className="fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs bg-background p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9Z" />
                  <path d="m17 9-3-3H9" />
                  <path d="M12 9v7" />
                  <path d="m15 13-3 3-3-3" />
                </svg>
                {APP_NAME} Admin
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-2 py-2">
              <SidebarItem
                icon={<Home className="h-4 w-4" />}
                label="Dashboard"
                href="/admin"
                isActive={location === "/admin"}
                onClick={closeSidebar}
              />
              <SidebarItem
                icon={<Users className="h-4 w-4" />}
                label="Tenants"
                href="/admin/tenants"
                isActive={location === "/admin/tenants"}
                onClick={closeSidebar}
              />
              <SidebarItem
                icon={<FileText className="h-4 w-4" />}
                label="Subscription Plans"
                href="/admin/plans"
                isActive={location === "/admin/plans"}
                onClick={closeSidebar}
              />
              {/* Configuration section header */}
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                  Configuration
                </h2>
                <div className="space-y-1">
                  {configItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      isActive={location === item.href}
                      onClick={closeSidebar}
                    />
                  ))}
                </div>
              </div>
              
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                  System
                </h2>
                <div className="space-y-1">
                  <SidebarItem
                    icon={<Settings className="h-4 w-4" />}
                    label="System Settings"
                    href="/admin/system-settings"
                    isActive={location === "/admin/system-settings"}
                    onClick={closeSidebar}
                  />
                </div>
              </div>
              
              {/* Logout button for mobile */}
              <div className="px-3 py-2 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </ScrollArea>
        </nav>
      </div>

      {/* Desktop layout */}
      <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="fixed top-0 hidden h-screen w-full border-r bg-background md:sticky md:block lg:py-6">
          <div className="h-full py-4 pl-8 pr-6 lg:pl-10">
            <Link href="/admin">
              <a className="flex h-14 items-center gap-2 font-semibold lg:h-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9Z" />
                  <path d="m17 9-3-3H9" />
                  <path d="M12 9v7" />
                  <path d="m15 13-3 3-3-3" />
                </svg>
                {APP_NAME} Admin
              </a>
            </Link>
            <ScrollArea className="h-[calc(100vh-8rem)] py-6">
              <div className="space-y-6">
                <div className="space-y-1">
                  <SidebarItem
                    icon={<Home className="h-4 w-4" />}
                    label="Dashboard"
                    href="/admin"
                    isActive={location === "/admin"}
                  />
                  <SidebarItem
                    icon={<Users className="h-4 w-4" />}
                    label="Tenants"
                    href="/admin/tenants"
                    isActive={location === "/admin/tenants"}
                  />
                  <SidebarItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Subscription Plans"
                    href="/admin/plans"
                    isActive={location === "/admin/plans"}
                  />
                  <SidebarItem
                    icon={<Settings className="h-4 w-4" />}
                    label="System Settings"
                    href="/admin/system-settings"
                    isActive={location === "/admin/system-settings"}
                  />
                </div>
                
                {/* Configuration section header */}
                <div>
                  <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                    Configuration
                  </h2>
                  <div className="space-y-1">
                    {configItems.map((item) => (
                      <SidebarItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        isActive={location === item.href}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Account section moved up to replace system section */}
                
                {/* Logout button */}
                <div className="mt-6">
                  <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                    Account
                  </h2>
                  <div className="space-y-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}