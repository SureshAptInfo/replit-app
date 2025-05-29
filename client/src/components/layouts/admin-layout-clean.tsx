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
  isActive: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, href, isActive, onClick }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted"
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
              <Home className="h-6 w-6" />
              {APP_NAME} Admin
            </a>
          </Link>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          <nav className="fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs bg-background p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Link href="/admin" className="flex items-center gap-2 font-semibold">
                <Home className="h-6 w-6" />
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
                <SidebarItem
                  icon={<Settings className="h-4 w-4" />}
                  label="System Settings"
                  href="/admin/system-settings"
                  isActive={location === "/admin/system-settings"}
                  onClick={closeSidebar}
                />
              </div>
            </ScrollArea>
          </nav>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex-1 lg:grid lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden border-r bg-background lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/admin" className="flex items-center gap-2 font-semibold">
                <Home className="h-6 w-6" />
                <span className="">{APP_NAME} Admin</span>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
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
                
                <div className="my-4">
                  <h4 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                    Configuration
                  </h4>
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
                
                <div className="mt-auto pt-4">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}