import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Plus, Edit, Trash2, Activity } from 'lucide-react';

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch tenants data
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['/api/admin/tenants'],
    queryFn: async () => {
      // For demo purposes, return mock data
      return [
        {
          id: 1,
          name: 'Digital Marketing Agency',
          domain: 'digitalmarketing.example.com',
          owner: 'John Smith',
          email: 'john@digitalmarketing.example.com',
          plan: 'Enterprise',
          status: 'active',
          createdAt: '2025-01-15',
          usersCount: 12,
          leadsCount: 350
        },
        {
          id: 2,
          name: 'Real Estate Group',
          domain: 'realestate.example.com',
          owner: 'Sarah Johnson',
          email: 'sarah@realestate.example.com',
          plan: 'Professional',
          status: 'active',
          createdAt: '2025-02-20',
          usersCount: 8,
          leadsCount: 215
        },
        {
          id: 3,
          name: 'Tech Solutions',
          domain: 'techsolutions.example.com',
          owner: 'Mike Wilson',
          email: 'mike@techsolutions.example.com',
          plan: 'Basic',
          status: 'inactive',
          createdAt: '2025-03-10',
          usersCount: 3,
          leadsCount: 42
        }
      ];
    }
  });
  
  // Filter tenants based on search term
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusColor = (status: string) => {
    // Use existing variant names that are defined in the Badge component
    return status === 'active' ? 'default' : 'destructive';
  };

  return (
    <>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>
                  Create a new tenant account in the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name">Tenant Name</label>
                  <Input id="name" placeholder="Enter tenant name" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="domain">Domain</label>
                  <Input id="domain" placeholder="example.com" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="owner">Owner Name</label>
                  <Input id="owner" placeholder="Enter owner name" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="email">Email</label>
                  <Input id="email" type="email" placeholder="owner@example.com" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="plan">Subscription Plan</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialogOpen(false)}>
                  Create Tenant
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              Manage all tenant accounts in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span className="ml-2">Loading tenants...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No tenants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">{tenant.domain}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{tenant.owner}</div>
                          <div className="text-sm text-muted-foreground">{tenant.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{tenant.plan}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(tenant.status)}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{tenant.usersCount}</TableCell>
                      <TableCell>{tenant.leadsCount}</TableCell>
                      <TableCell className="text-right">
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
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Activity className="mr-2 h-4 w-4" />
                              View Usage
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}