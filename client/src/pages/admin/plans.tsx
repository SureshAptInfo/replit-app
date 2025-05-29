import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Edit, Trash2, MoreVertical, DollarSign, Users, Database, FileText } from 'lucide-react';

export default function Plans() {
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  
  // Fetch subscription plans data
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      // For demo purposes, return mock data
      return [
        {
          id: 1,
          name: 'Basic',
          description: 'For small agencies just getting started',
          price: 49,
          billingPeriod: 'monthly',
          active: true,
          features: [
            { name: 'Up to 3 users', included: true },
            { name: 'Up to 1 sub-account', included: true },
            { name: 'Up to 100 leads', included: true },
            { name: 'Basic email templates', included: true },
            { name: 'Standard reporting', included: true },
            { name: 'SMS messaging', included: false },
            { name: 'WhatsApp integration', included: false },
            { name: 'Document storage', included: false },
            { name: 'API access', included: false },
          ],
          tenantCount: 12
        },
        {
          id: 2,
          name: 'Professional',
          description: 'For growing agencies with multiple clients',
          price: 99,
          billingPeriod: 'monthly',
          active: true, 
          features: [
            { name: 'Up to 10 users', included: true },
            { name: 'Up to 5 sub-accounts', included: true },
            { name: 'Up to 1,000 leads', included: true },
            { name: 'Advanced email templates', included: true },
            { name: 'Advanced reporting', included: true },
            { name: 'SMS messaging', included: true },
            { name: 'WhatsApp integration', included: true },
            { name: 'Document storage (10GB)', included: true },
            { name: 'API access', included: false },
          ],
          tenantCount: 8
        },
        {
          id: 3,
          name: 'Enterprise',
          description: 'For established agencies with large client bases',
          price: 249,
          billingPeriod: 'monthly',
          active: true,
          features: [
            { name: 'Unlimited users', included: true },
            { name: 'Unlimited sub-accounts', included: true },
            { name: 'Unlimited leads', included: true },
            { name: 'Custom email templates', included: true },
            { name: 'Custom reporting', included: true },
            { name: 'SMS messaging', included: true },
            { name: 'WhatsApp integration', included: true },
            { name: 'Document storage (100GB)', included: true },
            { name: 'API access', included: true },
          ],
          tenantCount: 5
        }
      ];
    }
  });
  
  // Fetch all available features
  const { data: features = [], isLoading: featuresLoading } = useQuery({
    queryKey: ['/api/admin/plan-features'],
    queryFn: async () => {
      // For demo purposes, return mock data
      return [
        { id: 1, name: 'Up to 3 users', category: 'users' },
        { id: 2, name: 'Up to 10 users', category: 'users' },
        { id: 3, name: 'Unlimited users', category: 'users' },
        { id: 4, name: 'Up to 1 sub-account', category: 'accounts' },
        { id: 5, name: 'Up to 5 sub-accounts', category: 'accounts' },
        { id: 6, name: 'Unlimited sub-accounts', category: 'accounts' },
        { id: 7, name: 'Up to 100 leads', category: 'leads' },
        { id: 8, name: 'Up to 1,000 leads', category: 'leads' },
        { id: 9, name: 'Unlimited leads', category: 'leads' },
        { id: 10, name: 'Basic email templates', category: 'communication' },
        { id: 11, name: 'Advanced email templates', category: 'communication' },
        { id: 12, name: 'Custom email templates', category: 'communication' },
        { id: 13, name: 'Standard reporting', category: 'analytics' },
        { id: 14, name: 'Advanced reporting', category: 'analytics' },
        { id: 15, name: 'Custom reporting', category: 'analytics' },
        { id: 16, name: 'SMS messaging', category: 'communication' },
        { id: 17, name: 'WhatsApp integration', category: 'communication' },
        { id: 18, name: 'Document storage (5GB)', category: 'storage' },
        { id: 19, name: 'Document storage (10GB)', category: 'storage' },
        { id: 20, name: 'Document storage (100GB)', category: 'storage' },
        { id: 21, name: 'API access', category: 'advanced' },
      ];
    }
  });

  const featureCategories = [
    { id: 'users', name: 'Users & Access', icon: <Users className="h-4 w-4" /> },
    { id: 'accounts', name: 'Sub-Accounts', icon: <Users className="h-4 w-4" /> },
    { id: 'leads', name: 'Leads', icon: <Users className="h-4 w-4" /> },
    { id: 'communication', name: 'Communication', icon: <FileText className="h-4 w-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <FileText className="h-4 w-4" /> },
    { id: 'storage', name: 'Storage', icon: <Database className="h-4 w-4" /> },
    { id: 'advanced', name: 'Advanced Features', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          
          <div className="flex gap-2">
            <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Manage Features
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Manage Plan Features</DialogTitle>
                  <DialogDescription>
                    Add, edit, or remove features that can be included in subscription plans.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="users">
                  <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {featureCategories.map(category => (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                        {category.icon}
                        <span className="hidden md:inline">{category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {featureCategories.map(category => (
                    <TabsContent key={category.id} value={category.id}>
                      <div className="space-y-4 py-2">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium">{category.name} Features</h3>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Feature
                          </Button>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Feature Name</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {featuresLoading ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center py-4">
                                  Loading features...
                                </TableCell>
                              </TableRow>
                            ) : (
                              features
                                .filter(feature => feature.category === category.id)
                                .map(feature => (
                                  <TableRow key={feature.id}>
                                    <TableCell>{feature.name}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                
                <DialogFooter>
                  <Button onClick={() => setFeatureDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Define a new subscription plan with features and pricing.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Plan Name</Label>
                      <Input id="name" placeholder="e.g. Professional" />
                    </div>
                    <div>
                      <Label htmlFor="price">Monthly Price ($)</Label>
                      <Input id="price" type="number" placeholder="99" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Short description of the plan" />
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium mb-2">Plan Features</h3>
                    
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                      {featuresLoading ? (
                        <div className="text-center py-4">Loading features...</div>
                      ) : (
                        featureCategories.map(category => (
                          <div key={category.id} className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              {category.icon}
                              <span className="ml-1">{category.name}</span>
                            </h4>
                            <div className="ml-5 space-y-2">
                              {features
                                .filter(feature => feature.category === category.id)
                                .map(feature => (
                                  <div key={feature.id} className="flex items-center space-x-2">
                                    <Checkbox id={`feature-${feature.id}`} />
                                    <Label htmlFor={`feature-${feature.id}`} className="text-sm font-normal">
                                      {feature.name}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setPlanDialogOpen(false)}>
                    Create Plan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansLoading ? (
            <div className="col-span-3 text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-2">Loading subscription plans...</p>
            </div>
          ) : (
            plans.map(plan => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Plan
                        </DropdownMenuItem>
                        {plan.active ? (
                          <DropdownMenuItem>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <Check className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4 flex items-baseline">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">/ month</span>
                  </div>
                  
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-4 w-4 mt-1 text-green-500 mr-2" />
                        ) : (
                          <div className="h-4 w-4 mt-1 mr-2" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm text-muted-foreground">{plan.tenantCount} tenants</span>
                  </div>
                  <Badge variant={plan.active ? "default" : "outline"}>
                    {plan.active ? "Active" : "Inactive"}
                  </Badge>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}