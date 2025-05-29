import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { APP_NAME } from "@/lib/constants";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { CheckCircle, CloudOff, Database, FileText, Info, Mail, Server, Settings, ShieldAlert, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Configuration status summary interface
interface ConfigStatus {
  id: string;
  title: string;
  description: string;
  status: "configured" | "not_configured" | "error";
  icon: React.ReactNode;
  href: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  // Fetch configuration status for all integrations
  const { data: configStatus, isLoading } = useQuery({
    queryKey: ["/api/admin/config/status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/config/status");
        if (!res.ok) throw new Error("Failed to fetch configuration status");
        return res.json();
      } catch (error) {
        // For development, return mock data
        console.warn("Using fallback configuration status data");
        return {
          aws: false,
          email: false, 
          payments: false,
          video: false
        };
      }
    }
  });

  const tenantStats = useQuery({
    queryKey: ["/api/admin/stats/tenants"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/stats/tenants");
        if (!res.ok) throw new Error("Failed to fetch tenant statistics");
        return res.json();
      } catch (error) {
        // For development, return mock data
        console.warn("Using fallback tenant statistics data");
        return {
          total: 0,
          active: 0,
          pending: 0
        };
      }
    }
  });

  // Prepare configuration item cards
  const configItems: ConfigStatus[] = [
    {
      id: "aws",
      title: "AWS S3 Storage",
      description: "Configure Amazon S3 storage for documents and files",
      status: configStatus?.aws ? "configured" : "not_configured",
      icon: <Server className="h-5 w-5" />,
      href: "/admin/aws-config",
    },
    {
      id: "email",
      title: "Email Service",
      description: "Configure Brevo for sending emails and notifications",
      status: configStatus?.email ? "configured" : "not_configured",
      icon: <Mail className="h-5 w-5" />,
      href: "/admin/email-config",
    },
    {
      id: "payments",
      title: "Payment Gateway",
      description: "Configure Stripe for processing payments and subscriptions",
      status: configStatus?.payments ? "configured" : "not_configured",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/payment-config",
    },
    {
      id: "video",
      title: "Video Storage",
      description: "Configure Vimeo for video hosting and management",
      status: configStatus?.video ? "configured" : "not_configured",
      icon: <Video className="h-5 w-5" />,
      href: "/admin/video-config",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "configured":
        return "bg-green-50 text-green-700 border-green-200";
      case "not_configured":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "configured":
        return <CheckCircle className="h-5 w-5" />;
      case "not_configured":
        return <Info className="h-5 w-5" />;
      case "error":
        return <ShieldAlert className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "configured":
        return "Configured";
      case "not_configured":
        return "Not Configured";
      case "error":
        return "Configuration Error";
      default:
        return "Unknown";
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | {APP_NAME}</title>
        <meta name="description" content="System administration and configuration for LeadTrackPro" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System configuration and management for {APP_NAME}
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2">
            <Button variant="default" asChild>
              <Link href="/admin/tenants">
                <Users className="h-4 w-4 mr-2" />
                Manage Tenants
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/settings">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {tenantStats.isLoading ? "—" : tenantStats.data?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Businesses using the platform
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {tenantStats.isLoading ? "—" : tenantStats.data?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently active subscriptions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0 GB</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total storage used by all tenants
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">System Configuration</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {configItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <a className="block h-full">
                  <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {item.icon}
                        </div>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            <span>{getStatusText(item.status)}</span>
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="ghost" size="sm" className="w-full justify-start pl-0 text-primary">
                        Configure
                      </Button>
                    </CardFooter>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <Card>
            <CardHeader>
              <CardTitle>Service Health</CardTitle>
              <CardDescription>Current status of system services and components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100">
                      <Database className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Database</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100">
                      <Server className="h-4 w-4 text-green-600" />
                    </div>
                    <span>API Server</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                
                {!configStatus?.aws && (
                  <div className="flex justify-between items-center p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-amber-100">
                        <CloudOff className="h-4 w-4 text-amber-600" />
                      </div>
                      <span>S3 Storage</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Info className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  </div>
                )}
                
                {!configStatus?.email && (
                  <div className="flex justify-between items-center p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-amber-100">
                        <Mail className="h-4 w-4 text-amber-600" />
                      </div>
                      <span>Email Service</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Info className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}