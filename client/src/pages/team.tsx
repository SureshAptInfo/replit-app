import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSubAccount } from "@/context/sub-account-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

// Sidebar is already provided by SidebarLayout, no need to import it here
import Header from "@/components/layout/header";
import MobileNavigation from "@/components/shared/mobile-navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

// Create schema for user form validation
const userFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  role: z.string({
    required_error: "Please select a role",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Define permission categories and specific permissions
const permissionCategories = [
  {
    name: "Leads",
    permissions: [
      { id: "leads.view", label: "View Leads" },
      { id: "leads.create", label: "Create Leads" },
      { id: "leads.edit", label: "Edit Leads" },
      { id: "leads.delete", label: "Delete Leads" },
      { id: "leads.export", label: "Export Leads" },
      { id: "leads.import", label: "Import Leads" },
    ]
  },
  {
    name: "Tasks",
    permissions: [
      { id: "tasks.view", label: "View Tasks" },
      { id: "tasks.create", label: "Create Tasks" },
      { id: "tasks.edit", label: "Edit Tasks" },
      { id: "tasks.delete", label: "Delete Tasks" },
    ]
  },
  {
    name: "Communication",
    permissions: [
      { id: "email.send", label: "Send Emails" },
      { id: "sms.send", label: "Send SMS" },
      { id: "whatsapp.send", label: "Send WhatsApp" },
      { id: "templates.view", label: "View Templates" },
    ]
  },
  {
    name: "Documents",
    permissions: [
      { id: "documents.view", label: "View Documents" },
      { id: "documents.upload", label: "Upload Documents" },
      { id: "documents.download", label: "Download Documents" },
      { id: "documents.delete", label: "Delete Documents" },
    ]
  },
  {
    name: "Analytics",
    permissions: [
      { id: "analytics.view", label: "View Analytics" },
      { id: "reports.generate", label: "Generate Reports" },
      { id: "reports.export", label: "Export Reports" },
    ]
  },
  {
    name: "Settings",
    permissions: [
      { id: "settings.view", label: "View Settings" },
      { id: "settings.edit", label: "Edit Settings" },
      { id: "team.view", label: "View Team" },
      { id: "team.manage", label: "Manage Team" },
      { id: "integrations.view", label: "View Integrations" },
      { id: "integrations.manage", label: "Manage Integrations" },
    ]
  },
];

export default function TeamPage() {
  const { currentSubAccount } = useSubAccount();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  // Check if current user has permission to manage team
  const canManageTeam = currentUser?.role === "agency_owner" || 
                         currentUser?.role === "agency_admin" || 
                         currentUser?.role === "client_admin" ||
                         currentUser?.role === "super_admin";

  // Fetch team members from our real API endpoint
  const { data: teamMembers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/team"],
    enabled: !!currentSubAccount,
  });
  
  // Fetch available permissions
  const { data: availablePermissions = permissionCategories, isLoading: isLoadingPermissions } = useQuery<any[]>({
    queryKey: ["/api/available-permissions"],
    enabled: isAccessDialogOpen,
  });

  // Form for adding new user
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "client_user",
    },
  });

  // Fetch user permissions
  const fetchUserPermissions = async (userId: number) => {
    try {
      console.log(`Fetching permissions for user ${userId}`);
      const response = await apiRequest("GET", `/api/user-permissions/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log("Permissions received:", data);
        // Ensure we get an array, even if empty
        const permissionsArray = Array.isArray(data.permissions) ? data.permissions : [];
        setUserPermissions(permissionsArray);
      } else {
        console.error("Permission fetch error response:", data);
        toast({
          title: "Error",
          description: "Failed to fetch user permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive",
      });
    }
  };

  // Handle opening the access management dialog
  const handleManageAccess = (member: any) => {
    setSelectedMember(member);
    fetchUserPermissions(member.id);
    setIsAccessDialogOpen(true);
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string) => {
    setUserPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Handle saving permissions
  const savePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: number, permissions: string[] }) => {
      try {
        const response = await apiRequest("POST", `/api/user-permissions/${data.userId}`, { permissions: data.permissions });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update permissions");
        }
        return await response.json();
      } catch (error) {
        console.error("Error saving permissions:", error);
        throw new Error("Failed to update permissions. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setIsAccessDialogOpen(false);
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Save permissions
  const handleSavePermissions = () => {
    if (!selectedMember) return;
    
    // Make sure we have a valid array of string permissions
    const validPermissions = userPermissions.filter(perm => typeof perm === 'string');
    
    // Log what we're about to save
    console.log("Saving permissions for user:", selectedMember.id, "Permissions:", validPermissions);
    
    try {
      savePermissionsMutation.mutate({
        userId: selectedMember.id,
        permissions: validPermissions
      });
    } catch (error) {
      console.error("Error in handleSavePermissions:", error);
      toast({
        title: "Error",
        description: "Failed to save permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormValues & { subAccountId: number }) => {
      const response = await apiRequest("POST", "/api/team", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add team member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setIsAddUserOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  // Submit handler for add user form
  function onSubmit(data: UserFormValues) {
    console.log('Current sub-account:', currentSubAccount);
    console.log('Current user:', currentUser);
    
    if (!currentSubAccount) {
      // Try to use user's subAccountId as fallback
      const fallbackSubAccountId = currentUser?.subAccountId || 1;
      console.log('Using fallback subAccountId:', fallbackSubAccountId);
      
      addUserMutation.mutate({
        ...data,
        subAccountId: fallbackSubAccountId,
      });
      return;
    }

    addUserMutation.mutate({
      ...data,
      subAccountId: currentSubAccount.id,
    });
  }

  return (
    <>
      <Helmet>
        <title>Team Management | LeadTrackPro</title>
        <meta name="description" content="Manage your team members and assign roles with LeadTrackPro's team management system." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        {/* Sidebar is provided by SidebarLayout */}
        <main className="flex-1 min-h-screen md:ml-0">
          <Header title="Team Management" />
          
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl md:text-2xl font-heading font-semibold">Team Management</h1>
              
              {canManageTeam && (
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Add Team Member
                </Button>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <Card className="border border-dashed p-8 text-center">
                <CardContent>
                  <div className="flex flex-col items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="48" 
                      height="48" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="text-neutral-300 mb-4"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">No Team Members</h3>
                    <p className="text-neutral-500 mb-4">
                      {canManageTeam
                        ? "You haven't added any team members yet. Click the button above to add your first team member."
                        : "There are no team members in your account yet."}
                    </p>
                    {canManageTeam && (
                      <Button onClick={() => setIsAddUserOpen(true)}>Add Team Member</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member: any) => (
                  <Card key={member.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <CardTitle>{member.name}</CardTitle>
                          <CardDescription>{member.role.replace("_", " ")}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-neutral-500">
                        <p>
                          <span className="font-medium">Email: </span>
                          {member.email}
                        </p>
                        <p>
                          <span className="font-medium">Username: </span>
                          {member.username}
                        </p>
                      </div>
                    </CardContent>
                    {canManageTeam && member.id !== currentUser?.id && (
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleManageAccess(member)}
                        >
                          Manage Access
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <MobileNavigation />
        </main>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new user to your team and assign them a role.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      defaultValue="client_user"
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ROLES.filter(role => 
                          // Filter roles based on current user's role
                          (currentUser?.role === "super_admin") || // Super admin can create any role
                          (currentUser?.role === "agency_owner") || // Agency owner can create any role
                          (currentUser?.role === "agency_admin" && role.value !== "agency_owner") || // Agency admin can't create agency owners
                          (currentUser?.role === "client_admin" && role.value === "client_user") // Client admin can only create client users
                        ).map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines what permissions the user will have.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending ? "Adding..." : "Add User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* User Permissions Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? `Manage Access for ${selectedMember.name}` : 'Manage User Access'}
            </DialogTitle>
            <DialogDescription>
              Control what this user can access by checking the appropriate permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Tabs defaultValue="leads" className="w-full">
              <TabsList className="flex flex-wrap gap-1 mb-4 overflow-x-auto">
                {permissionCategories.map(category => (
                  <TabsTrigger key={category.name} value={category.name.toLowerCase()}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {permissionCategories.map(category => (
                <TabsContent key={category.name} value={category.name.toLowerCase()}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{category.name} Permissions</CardTitle>
                      <CardDescription>Control what actions this user can perform with {category.name.toLowerCase()}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.permissions.map(permission => (
                          <div key={permission.id} className="flex items-start space-x-3 space-y-0">
                            <Checkbox 
                              id={permission.id} 
                              checked={userPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)} 
                            />
                            <div className="space-y-1 leading-none">
                              <label
                                htmlFor={permission.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {permission.label}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePermissions}
              disabled={savePermissionsMutation.isPending}
            >
              {savePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
