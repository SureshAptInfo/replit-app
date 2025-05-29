import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useSubAccount } from "@/context/sub-account-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, User, Building, HardDrive, Brush, PanelLeft, Mail, CreditCard, Bell, Upload } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSettings {
  name: string;
  email: string;
  role: string;
  phone: string;
  avatarUrl: string | null;
  notifications: {
    email: boolean;
    browser: boolean;
    sms: boolean;
    leads: boolean;
    marketing: boolean;
    system: boolean;
  };
}

interface AccountSettings {
  name: string;
  email: string;
  logo: string | null;
  domain: string | null;
  favicon: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const [activeTab, setActiveTab] = useState("profile");
  
  // User settings form
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: "",
    email: "",
    role: "",
    phone: "",
    avatarUrl: null,
    notifications: {
      email: true,
      browser: true,
      sms: false,
      leads: true,
      marketing: false,
      system: true
    }
  });
  
  // Account settings form
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    name: "",
    email: "",
    logo: null,
    domain: null,
    favicon: null,
    colorPrimary: "#6366F1",
    colorSecondary: "#4F46E5",
    address: null,
    city: null,
    state: null,
    zip: null,
    country: null,
    phone: null,
    website: null
  });
  
  // Fetch user settings
  const { data: user = {}, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/settings/user"],
  });
  
  // Fetch account settings
  const { data: account = {}, isLoading: isLoadingAccount } = useQuery<any>({
    queryKey: ["/api/settings/account"],
  });
  
  // Update forms when data is loaded
  useEffect(() => {
    if (user) {
      setUserSettings({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        avatarUrl: user.avatarUrl,
        notifications: user.notifications
      });
    }
  }, [user]);
  
  useEffect(() => {
    if (account) {
      setAccountSettings({
        name: account.name,
        email: account.email || "",
        logo: account.logo,
        domain: account.domain,
        favicon: account.favicon,
        colorPrimary: account.colorPrimary || "#6366F1",
        colorSecondary: account.colorSecondary || "#4F46E5",
        address: account.address,
        city: account.city,
        state: account.state,
        zip: account.zip,
        country: account.country,
        phone: account.phone,
        website: account.website
      });
    }
  }, [account]);
  
  // Save user profile settings
  const userSettingsMutation = useMutation({
    mutationFn: async (data: UserSettings) => {
      const response = await apiRequest("PATCH", "/api/settings/user", data);
      if (!response.ok) {
        throw new Error("Failed to update user settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your profile has been updated successfully."
      });
      
      // Invalidate the user settings query
      queryClient.invalidateQueries({ queryKey: ['/api/settings/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle saving user profile
  const handleSaveUserProfile = () => {
    // Validation
    if (!userSettings.name.trim()) {
      toast({
        title: "Name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!userSettings.email.trim()) {
      toast({
        title: "Email is required",
        variant: "destructive"
      });
      return;
    }
    
    userSettingsMutation.mutate(userSettings);
  };
  
  // Save account settings
  const accountSettingsMutation = useMutation({
    mutationFn: async (data: AccountSettings) => {
      const response = await apiRequest("PATCH", "/api/settings/account", data);
      if (!response.ok) {
        throw new Error("Failed to update account settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account settings have been updated successfully."
      });
      
      // Invalidate the account settings query
      queryClient.invalidateQueries({ queryKey: ['/api/settings/account'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update account settings: " + error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle saving account settings
  const handleSaveAccountSettings = () => {
    // Validation
    if (!accountSettings.name.trim()) {
      toast({
        title: "Account name is required",
        variant: "destructive"
      });
      return;
    }
    
    accountSettingsMutation.mutate(accountSettings);
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return ""; // Safety check for undefined name
    
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Settings | {APP_NAME}</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <TabsTrigger value="profile" className="flex gap-2 items-center">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex gap-2 items-center">
              <Building className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex gap-2 items-center">
              <Brush className="h-4 w-4" />
              <span>Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex gap-2 items-center">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex gap-2 items-center">
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how you appear in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      {userSettings.avatarUrl ? (
                        <AvatarImage src={userSettings.avatarUrl} alt={userSettings.name} />
                      ) : (
                        <AvatarFallback className="text-xl">
                          {getInitials(userSettings.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={userSettings.name}
                          onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userSettings.email}
                          onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                          placeholder="Your email address"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={userSettings.phone}
                          onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
                          placeholder="Your phone number"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={userSettings.role}
                          readOnly
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your role cannot be changed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveUserProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Your current password"
                    />
                  </div>
                  
                  <div className="md:col-span-2 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="New password"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      {accountSettings.logo ? (
                        <AvatarImage src={accountSettings.logo} alt={accountSettings.name} />
                      ) : (
                        <AvatarFallback className="text-xl">
                          {getInitials(accountSettings.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account-name">Account Name</Label>
                        <Input
                          id="account-name"
                          value={accountSettings.name}
                          onChange={(e) => setAccountSettings({...accountSettings, name: e.target.value})}
                          placeholder="Account name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-email">Contact Email</Label>
                        <Input
                          id="account-email"
                          type="email"
                          value={accountSettings.email}
                          onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                          placeholder="Contact email"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-phone">Phone Number</Label>
                        <Input
                          id="account-phone"
                          value={accountSettings.phone || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, phone: e.target.value})}
                          placeholder="Phone number"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-website">Website</Label>
                        <Input
                          id="account-website"
                          value={accountSettings.website || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, website: e.target.value})}
                          placeholder="Website URL"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Separator className="my-4" />
                        <h3 className="text-lg font-medium mb-3">Address Information</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="account-address">Street Address</Label>
                        <Input
                          id="account-address"
                          value={accountSettings.address || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, address: e.target.value})}
                          placeholder="Street address"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-city">City</Label>
                        <Input
                          id="account-city"
                          value={accountSettings.city || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, city: e.target.value})}
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-state">State / Province</Label>
                        <Input
                          id="account-state"
                          value={accountSettings.state || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, state: e.target.value})}
                          placeholder="State / Province"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-zip">Postal / ZIP Code</Label>
                        <Input
                          id="account-zip"
                          value={accountSettings.zip || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, zip: e.target.value})}
                          placeholder="Postal / ZIP code"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account-country">Country</Label>
                        <Input
                          id="account-country"
                          value={accountSettings.country || ""}
                          onChange={(e) => setAccountSettings({...accountSettings, country: e.target.value})}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveAccountSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Domain Settings</CardTitle>
                <CardDescription>
                  Configure domain and branding settings for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="domain">Custom Domain</Label>
                    <Input
                      id="domain"
                      value={accountSettings.domain || ""}
                      onChange={(e) => setAccountSettings({...accountSettings, domain: e.target.value})}
                      placeholder="yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your custom domain for branded portal access
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="favicon">Favicon</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="favicon"
                        type="file"
                        className="hidden"
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="favicon" className="cursor-pointer">Upload Favicon</label>
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {accountSettings.favicon ? "Favicon uploaded" : "No favicon uploaded"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      16x16 or 32x32 PNG/ICO file
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Domain Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Appearance</CardTitle>
                <CardDescription>
                  Customize the colors and visual elements of your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="primary-color" className="mb-2 block">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: accountSettings.colorPrimary || "#6366F1" }}
                      ></div>
                      <Input
                        id="primary-color"
                        type="color"
                        value={accountSettings.colorPrimary || "#6366F1"}
                        onChange={(e) => setAccountSettings({...accountSettings, colorPrimary: e.target.value})}
                        className="w-16 p-1 h-8"
                      />
                      <Input
                        value={accountSettings.colorPrimary || "#6366F1"}
                        onChange={(e) => setAccountSettings({...accountSettings, colorPrimary: e.target.value})}
                        className="flex-1"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for buttons, links, and primary actions
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondary-color" className="mb-2 block">Secondary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: accountSettings.colorSecondary || "#4F46E5" }}
                      ></div>
                      <Input
                        id="secondary-color"
                        type="color"
                        value={accountSettings.colorSecondary || "#4F46E5"}
                        onChange={(e) => setAccountSettings({...accountSettings, colorSecondary: e.target.value})}
                        className="w-16 p-1 h-8"
                      />
                      <Input
                        value={accountSettings.colorSecondary || "#4F46E5"}
                        onChange={(e) => setAccountSettings({...accountSettings, colorSecondary: e.target.value})}
                        className="flex-1"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for accents and secondary elements
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Preview</h3>
                  <div className="border rounded-lg p-6">
                    <div className="mb-4 space-y-2">
                      <div className="flex gap-2">
                        <Button style={{ backgroundColor: accountSettings.colorPrimary }}>
                          Primary Button
                        </Button>
                        <Button variant="outline" style={{ borderColor: accountSettings.colorPrimary, color: accountSettings.colorPrimary }}>
                          Outline Button
                        </Button>
                      </div>
                      <div>
                        <p>
                          Regular text with a <a href="#" style={{ color: accountSettings.colorPrimary, textDecoration: "underline" }}>primary link</a> and a <a href="#" style={{ color: accountSettings.colorSecondary, textDecoration: "underline" }}>secondary link</a>.
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div style={{ backgroundColor: accountSettings.colorPrimary }} className="h-4 w-12 rounded"></div>
                        <div style={{ backgroundColor: accountSettings.colorSecondary }} className="h-4 w-12 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Appearance
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Layout Preferences</CardTitle>
                <CardDescription>
                  Configure the layout and UI preferences for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compact-view" className="font-medium">Compact View</Label>
                      <p className="text-sm text-muted-foreground">
                        Use compact spacing in lists and tables
                      </p>
                    </div>
                    <Switch id="compact-view" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sidebar-collapsed" className="font-medium">Collapsed Sidebar by Default</Label>
                      <p className="text-sm text-muted-foreground">
                        Start with collapsed sidebar for more screen space
                      </p>
                    </div>
                    <Switch id="sidebar-collapsed" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-help" className="font-medium">Show Help Tips</Label>
                      <p className="text-sm text-muted-foreground">
                        Display helpful tooltips throughout the interface
                      </p>
                    </div>
                    <Switch id="show-help" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Layout Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch 
                        id="email-notifications" 
                        checked={userSettings?.notifications?.email || false}
                        onCheckedChange={(checked) => 
                          setUserSettings({
                            ...userSettings, 
                            notifications: {...(userSettings?.notifications || {}), email: checked}
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="browser-notifications" className="font-medium">Browser Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications in your browser
                        </p>
                      </div>
                      <Switch 
                        id="browser-notifications" 
                        checked={userSettings?.notifications?.browser || false}
                        onCheckedChange={(checked) => 
                          setUserSettings({
                            ...userSettings, 
                            notifications: {...(userSettings?.notifications || {}), browser: checked}
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS (charges may apply)
                        </p>
                      </div>
                      <Switch 
                        id="sms-notifications" 
                        checked={userSettings?.notifications?.sms || false}
                        onCheckedChange={(checked) => 
                          setUserSettings({
                            ...userSettings, 
                            notifications: {...(userSettings?.notifications || {}), sms: checked}
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="lead-notifications" className="font-medium">Lead Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          New leads, status changes, and follow-up reminders
                        </p>
                      </div>
                      <Switch 
                        id="lead-notifications" 
                        checked={userSettings?.notifications?.leads || false}
                        onCheckedChange={(checked) => 
                          setUserSettings({
                            ...userSettings, 
                            notifications: {...(userSettings?.notifications || {}), leads: checked}
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing-notifications" className="font-medium">Marketing Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          New features, tips, and marketing communications
                        </p>
                      </div>
                      <Switch 
                        id="marketing-notifications" 
                        checked={userSettings.notifications?.marketing || false}
                        onCheckedChange={(checked) => 
                          setUserSettings({
                            ...userSettings, 
                            notifications: {...(userSettings.notifications || {}), marketing: checked}
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="system-notifications" className="font-medium">System Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Account updates, security alerts, and system maintenance
                        </p>
                      </div>
                      <Switch 
                        id="system-notifications" 
                        checked={userSettings.notifications?.system || false}
                        onCheckedChange={(checked) => 
                          setUserSettings({
                            ...userSettings, 
                            notifications: {...(userSettings.notifications || {}), system: checked}
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Notification Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription, payment methods, and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">Current Plan</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You are currently on the Pro plan
                      </p>
                      <Badge>Pro</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">$29.99</p>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Next billing date: <span className="font-medium">June 15, 2025</span>
                    </p>
                    <Button variant="outline">Change Plan</Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Payment Method</h3>
                  <div className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted w-12 h-8 rounded flex items-center justify-center text-sm font-medium">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium">Visa ending in 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 05/2026</p>
                      </div>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="link" size="sm">+ Add new payment method</Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Billing History</h3>
                  <div className="rounded-md border">
                    <div className="p-4 flex justify-between items-center border-b">
                      <div>
                        <p className="font-medium">May 15, 2025</p>
                        <p className="text-sm text-muted-foreground">Pro Plan - Monthly</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$29.99</p>
                        <Badge variant="outline">Paid</Badge>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center border-b">
                      <div>
                        <p className="font-medium">Apr 15, 2025</p>
                        <p className="text-sm text-muted-foreground">Pro Plan - Monthly</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$29.99</p>
                        <Badge variant="outline">Paid</Badge>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Mar 15, 2025</p>
                        <p className="text-sm text-muted-foreground">Pro Plan - Monthly</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$29.99</p>
                        <Badge variant="outline">Paid</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-center">
                    <Button variant="link" size="sm">View all invoices</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email Receipts
                </Button>
                <Button variant="destructive">Cancel Subscription</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}