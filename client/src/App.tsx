import React, { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/auth-context";
import { SubAccountProvider } from "@/context/sub-account-context";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import ProtectedRoute from "@/components/auth/protected-route";

// Pages
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import LeadDetail from "@/pages/lead-detail-new";
import Integrations from "@/pages/integrations";
import Team from "@/pages/team";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Reports from "@/pages/reports";
import TasksUnified from "@/pages/tasks-unified";
import Messages from "@/pages/messages";
import Templates from "@/pages/templates";
import Settings from "@/pages/settings";
import UserSettings from "@/pages/user-settings";
import LeadImportEnhanced from "@/pages/lead-import-enhanced";
import CSVImport from "@/pages/csv-import";
import CSVImportSimple from "@/pages/csv-import-simple";
import AddLead from "@/pages/add-lead";
import Workflows from "@/pages/workflows";

// Admin Pages
import AdminDashboard from "@/pages/admin/index";
import Tenants from "@/pages/admin/tenants";
import Plans from "@/pages/admin/plans";
import SystemSettings from "@/pages/admin/system-settings";
import AwsConfig from "@/pages/admin/aws-config";
import EmailConfig from "@/pages/admin/email-config";
import PaymentConfig from "@/pages/admin/payment-config";
import VideoConfig from "@/pages/admin/video-config";

// Import layouts
import SidebarLayout from "@/components/layouts/sidebar-layout";
import AdminLayout from "@/components/layouts/admin-layout-clean";

function Router() {
  const [location] = useLocation();

  // Check if the current path is an auth route
  const isAuthRoute = location === "/login" || location === "/register";

  // Layouts
  const withSidebar = (Component: React.ComponentType<any>) => (props: any) => (
    <SidebarLayout>
      <Component {...props} />
    </SidebarLayout>
  );
  
  const withAdminLayout = (Component: React.ComponentType<any>) => (props: any) => (
    <AdminLayout>
      <Component {...props} />
    </AdminLayout>
  );

  // Admin roles for role-based access control
  const adminRoles = ["super_admin", "agency_owner", "agency_admin"];
  const superAdminRoles = ["super_admin"];
  const agencyRoles = ["super_admin", "agency_owner"];

  return (
    <Switch>
      {/* Auth Routes - No sidebar */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes - With sidebar */}
      <Route path="/">
        {(params) => <ProtectedRoute component={withSidebar(Dashboard)} {...params} />}
      </Route>
      <Route path="/leads">
        {(params) => <ProtectedRoute component={withSidebar(Leads)} {...params} />}
      </Route>
      <Route path="/leads/import">
        {(params) => <ProtectedRoute component={withSidebar(LeadImportEnhanced)} {...params} />}
      </Route>
      <Route path="/csv-import">
        {(params) => <ProtectedRoute component={withSidebar(CSVImportSimple)} {...params} />}
      </Route>
      <Route path="/add-lead">
        {(params) => <ProtectedRoute component={withSidebar(AddLead)} {...params} />}
      </Route>
      <Route path="/leads/:id">
        {(params) => <ProtectedRoute component={withSidebar(LeadDetail)} {...params} />}
      </Route>
      
      <Route path="/integrations">
        {(params) => <ProtectedRoute component={withSidebar(Integrations)} {...params} />}
      </Route>
      <Route path="/team">
        {(params) => <ProtectedRoute component={withSidebar(Team)} {...params} />}
      </Route>
      <Route path="/messages">
        {(params) => <ProtectedRoute component={withSidebar(Messages)} {...params} />}
      </Route>
      <Route path="/tasks">
        {(params) => <ProtectedRoute component={withSidebar(TasksUnified)} {...params} />}
      </Route>
      {/* Calendar route redirects to Tasks & Calendar */}
      <Route path="/calendar">
        {() => {
          window.location.href = "/tasks";
          return null;
        }}
      </Route>
      <Route path="/contacts">
        {(params) => <ProtectedRoute component={withSidebar(require('@/pages/contacts').default)} {...params} />}
      </Route>
      <Route path="/reports">
        {(params) => <ProtectedRoute component={withSidebar(Reports)} {...params} />}
      </Route>
      <Route path="/templates">
        {(params) => <ProtectedRoute component={withSidebar(Templates)} {...params} />}
      </Route>
      <Route path="/workflows">
        {(params) => <ProtectedRoute component={withSidebar(Workflows)} {...params} />}
      </Route>
      <Route path="/settings">
        {(params) => <ProtectedRoute component={withSidebar(Settings)} {...params} />}
      </Route>
      <Route path="/settings/notifications">
        {(params) => <ProtectedRoute component={withSidebar(require('@/pages/settings/notifications').default)} {...params} />}
      </Route>
      <Route path="/user-settings">
        {(params) => <ProtectedRoute component={withSidebar(UserSettings)} {...params} />}
      </Route>
      
      {/* Admin Routes with role-based access control */}
      <Route path="/admin">
        {(params) => <ProtectedRoute component={withAdminLayout(AdminDashboard)} allowedRoles={adminRoles} {...params} />}
      </Route>
      <Route path="/admin/tenants">
        {(params) => <ProtectedRoute component={withAdminLayout(Tenants)} allowedRoles={agencyRoles} {...params} />}
      </Route>
      <Route path="/admin/plans">
        {(params) => <ProtectedRoute component={withAdminLayout(Plans)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      <Route path="/admin/system-settings">
        {(params) => <ProtectedRoute component={withAdminLayout(SystemSettings)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      <Route path="/admin/settings">
        {(params) => <ProtectedRoute component={withAdminLayout(SystemSettings)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      <Route path="/admin/aws-config">
        {(params) => <ProtectedRoute component={withAdminLayout(AwsConfig)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      <Route path="/admin/email-config">
        {(params) => <ProtectedRoute component={withAdminLayout(EmailConfig)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      <Route path="/admin/payment-config">
        {(params) => <ProtectedRoute component={withAdminLayout(PaymentConfig)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      <Route path="/admin/video-config">
        {(params) => <ProtectedRoute component={withAdminLayout(VideoConfig)} allowedRoles={superAdminRoles} {...params} />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <SubAccountProvider>
              <NotificationProvider>
                <Toaster />
                <Router />
              </NotificationProvider>
            </SubAccountProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
