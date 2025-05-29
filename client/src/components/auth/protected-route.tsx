import React from "react";
import { useAuth } from "@/context/auth-context";
import { Redirect } from "wouter";
import NotFound from "@/pages/not-found";

type ProtectedRouteProps = {
  component: React.ComponentType<any>;
  allowedRoles?: string[];
  path?: string;
  children?: React.ReactNode;
};

/**
 * A wrapper component that protects routes by checking user authentication
 * and optionally restricting access based on user roles
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  allowedRoles,
  ...rest
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role - show unauthorized/not found
      return <NotFound />;
    }
  }

  // User is authenticated and has proper role (if specified)
  return <Component {...rest} />;
};

export default ProtectedRoute;