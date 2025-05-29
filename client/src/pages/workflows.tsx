import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Trash2, 
  Copy, 
  Activity,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSubAccount } from "@/context/sub-account-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Types
interface WorkflowTrigger {
  type: 'lead_created' | 'lead_status_changed' | 'time_based' | 'manual';
  config: any;
}

interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'send_whatsapp' | 'update_lead' | 'create_task' | 'wait';
  config: any;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

interface Workflow {
  id: number;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
  active: boolean;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowExecution {
  id: number;
  workflowId: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  error?: string;
  triggeredBy: string;
}

export default function Workflows() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { currentSubAccount } = useSubAccount();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'executions'>('list');

  // Fetch workflows
  const { data: workflows = [], isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ['/api/workflows', currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount) return [];
      const response = await fetch(`/api/workflows?subAccountId=${currentSubAccount.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflows');
      return response.json();
    },
    enabled: !!currentSubAccount,
  });

  // Fetch workflow executions
  const { data: executions = [], isLoading: isExecutionsLoading } = useQuery({
    queryKey: ['/api/workflow-executions', currentSubAccount?.id],
    queryFn: async () => {
      if (!currentSubAccount) return [];
      const response = await fetch(`/api/workflow-executions?subAccountId=${currentSubAccount.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflow executions');
      return response.json();
    },
    enabled: !!currentSubAccount && viewMode === 'executions',
  });

  // Toggle workflow active status
  const toggleWorkflow = async (workflowId: number, active: boolean) => {
    try {
      await apiRequest('PATCH', `/api/workflows/${workflowId}`, { active });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Success",
        description: `Workflow ${active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workflow status",
        variant: "destructive",
      });
    }
  };

  // Delete workflow
  const deleteWorkflow = async (workflowId: number) => {
    try {
      await apiRequest('DELETE', `/api/workflows/${workflowId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  // Duplicate workflow
  const duplicateWorkflow = async (workflow: Workflow) => {
    try {
      const newWorkflow = {
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        trigger: workflow.trigger,
        actions: workflow.actions,
        conditions: workflow.conditions,
        active: false,
        subAccountId: currentSubAccount!.id,
        createdBy: user!.id,
      };
      
      await apiRequest('POST', '/api/workflows', newWorkflow);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Success",
        description: "Workflow duplicated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate workflow",
        variant: "destructive",
      });
    }
  };

  const handleSaveWorkflow = async (workflowData: any) => {
    try {
      const payload = {
        ...workflowData,
        subAccountId: currentSubAccount?.id || 1,
        createdBy: user?.id || 1,
        trigger: JSON.stringify(workflowData.trigger),
        actions: JSON.stringify(workflowData.actions),
        conditions: JSON.stringify(workflowData.conditions || [])
      };

      if (selectedWorkflow) {
        await apiRequest("PUT", `/api/workflows/${selectedWorkflow.id}`, payload);
        toast({ title: "Workflow updated successfully" });
      } else {
        await apiRequest("POST", "/api/workflows", payload);
        toast({ title: "Workflow created successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setIsBuilderOpen(false);
      setSelectedWorkflow(null);
    } catch (error) {
      toast({ 
        title: "Error saving workflow", 
        description: "Please try again",
        variant: "destructive" 
      });
    }
  };

  // Get trigger display text
  const getTriggerText = (trigger: WorkflowTrigger) => {
    switch (trigger.type) {
      case 'lead_created':
        return 'When a new lead is created';
      case 'lead_status_changed':
        return `When lead status changes to ${trigger.config?.status || 'any'}`;
      case 'time_based':
        return `Every ${trigger.config?.interval || 'day'}`;
      case 'manual':
        return 'Manual trigger';
      default:
        return 'Unknown trigger';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentSubAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sub-Account Selected</h3>
          <p className="text-gray-600">Please select a sub-account to view workflows.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <Helmet>
        <title>Workflows - LeadTrackPro</title>
        <meta name="description" content="Build and manage automated workflows for lead management and communication." />
      </Helmet>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Workflows
              </h1>
              <p className="text-gray-600">Automate your lead management with powerful workflows</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Workflows</SelectItem>
                  <SelectItem value="executions">Executions</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => {
                  setSelectedWorkflow(null);
                  setIsBuilderOpen(true);
                }}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Zap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
              <p className="text-xs text-muted-foreground">
                {workflows.filter(w => w.active).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time executions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.length > 0 ? 
                  Math.round((workflows.filter(w => w.lastExecutionStatus === 'completed').length / Math.max(workflows.length, 1)) * 100) + '%' 
                  : '0%'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.length > 0 ? 
                  (workflows.reduce((sum, w) => sum + (w.avgExecutionTime || 0), 0) / workflows.length).toFixed(1) + 's'
                  : '0s'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Average duration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          /* Workflows List */
          <Card>
            <CardHeader>
              <CardTitle>Your Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              {isWorkflowsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first workflow to automate lead management
                  </p>
                  <Button 
                    onClick={() => setIsBuilderOpen(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Executions</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{workflow.name}</div>
                            {workflow.description && (
                              <div className="text-sm text-gray-500">{workflow.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{getTriggerText(workflow.trigger)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{workflow.actions.length} action(s)</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={workflow.active ? "default" : "secondary"}>
                            {workflow.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{workflow.executionCount}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {workflow.lastExecuted 
                              ? new Date(workflow.lastExecuted).toLocaleDateString()
                              : "Never"
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWorkflow(workflow.id, !workflow.active)}
                            >
                              {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedWorkflow(workflow);
                                setIsBuilderOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateWorkflow(workflow)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWorkflow(workflow.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Executions List */
          <Card>
            <CardHeader>
              <CardTitle>Workflow Executions</CardTitle>
            </CardHeader>
            <CardContent>
              {isExecutionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No executions yet</h3>
                  <p className="text-gray-600">
                    Workflow executions will appear here once your workflows start running
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((execution) => {
                      const workflow = workflows.find(w => w.id === execution.workflowId);
                      const duration = execution.completedAt 
                        ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)
                        : null;
                      
                      return (
                        <TableRow key={execution.id}>
                          <TableCell>
                            <div className="font-medium">{workflow?.name || 'Unknown Workflow'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(execution.status)}>
                              {execution.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(execution.startedAt).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {duration !== null ? `${duration}s` : execution.status === 'running' ? 'Running...' : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{execution.triggeredBy}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workflow Builder Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </DialogTitle>
            </DialogHeader>
            <WorkflowBuilder 
              workflow={selectedWorkflow}
              onSave={handleSaveWorkflow}
              onCancel={() => setIsBuilderOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

// Workflow Builder Component
interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: any) => void;
  onCancel: () => void;
}

function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    trigger: workflow?.trigger || { type: 'lead_created', config: {} },
    actions: workflow?.actions || [],
    conditions: workflow?.conditions || [],
    active: workflow?.active ?? true
  });

  const [currentStep, setCurrentStep] = useState(1);

  const handleAddAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'send_email', config: {} }]
    }));
  };

  const handleRemoveAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleActionChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {step}
            </div>
            <span className="ml-2 text-sm">
              {step === 1 && 'Basic Info'}
              {step === 2 && 'Trigger'}
              {step === 3 && 'Actions'}
              {step === 4 && 'Review'}
            </span>
            {step < 4 && <div className="ml-4 w-16 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Workflow Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter workflow name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this workflow does"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm font-medium">
              Activate workflow immediately
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Trigger Configuration */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Trigger Configuration</h3>
          <p className="text-sm text-gray-600">Choose when this workflow should run</p>
          
          <div>
            <label className="block text-sm font-medium mb-2">Trigger Type</label>
            <Select value={formData.trigger.type} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, trigger: { type: value as any, config: {} } }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead_created">When a lead is created</SelectItem>
                <SelectItem value="lead_status_changed">When lead status changes</SelectItem>
                <SelectItem value="time_based">Time-based trigger</SelectItem>
                <SelectItem value="manual">Manual trigger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.trigger.type === 'lead_status_changed' && (
            <div>
              <label className="block text-sm font-medium mb-2">Status to watch for</label>
              <Select onValueChange={(value) => 
                setFormData(prev => ({ 
                  ...prev, 
                  trigger: { ...prev.trigger, config: { ...prev.trigger.config, status: value } }
                }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.trigger.type === 'time_based' && (
            <div>
              <label className="block text-sm font-medium mb-2">Delay (hours)</label>
              <Input
                type="number"
                placeholder="Enter hours"
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    trigger: { ...prev.trigger, config: { ...prev.trigger.config, delay: parseInt(e.target.value) } }
                  }))
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Step 3: Actions */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Actions</h3>
            <Button onClick={handleAddAction} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Action
            </Button>
          </div>
          <p className="text-sm text-gray-600">Define what happens when the workflow is triggered</p>

          {formData.actions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">No actions added yet</p>
              <Button onClick={handleAddAction} className="mt-2">
                Add First Action
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Action {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAction(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Action Type</label>
                      <Select 
                        value={action.type} 
                        onValueChange={(value) => handleActionChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="send_email">Send Email</SelectItem>
                          <SelectItem value="send_sms">Send SMS</SelectItem>
                          <SelectItem value="send_whatsapp">Send WhatsApp</SelectItem>
                          <SelectItem value="update_lead">Update Lead</SelectItem>
                          <SelectItem value="create_task">Create Task</SelectItem>
                          <SelectItem value="wait">Wait/Delay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {action.type === 'send_email' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Email Template</label>
                        <Select onValueChange={(value) => 
                          handleActionChange(index, 'config', { ...action.config, templateId: value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome">Welcome Email</SelectItem>
                            <SelectItem value="followup">Follow-up Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {action.type === 'send_whatsapp' && (
                      <WhatsAppTemplateSelector
                        selectedTemplate={action.config?.templateId}
                        onTemplateChange={(template) => 
                          handleActionChange(index, 'config', { 
                            ...action.config, 
                            templateId: template.id,
                            templateName: template.name,
                            parameters: template.parameters || []
                          })
                        }
                        onParameterMapping={(mappings) => 
                          handleActionChange(index, 'config', { 
                            ...action.config, 
                            parameterMappings: mappings
                          })
                        }
                        currentMappings={action.config?.parameterMappings || {}}
                      />
                    )}

                    {action.type === 'send_sms' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">SMS Template</label>
                        <Select onValueChange={(value) => 
                          handleActionChange(index, 'config', { ...action.config, templateId: value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome_sms">Welcome SMS</SelectItem>
                            <SelectItem value="followup_sms">Follow-up SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {action.type === 'wait' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Wait Duration (hours)</label>
                        <Input
                          type="number"
                          placeholder="Enter hours"
                          onChange={(e) => 
                            handleActionChange(index, 'config', { ...action.config, duration: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    )}

                    {action.type === 'update_lead' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">New Status</label>
                        <Select onValueChange={(value) => 
                          handleActionChange(index, 'config', { ...action.config, status: value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="interested">Interested</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Review Workflow</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <strong>Name:</strong> {formData.name}
            </div>
            <div>
              <strong>Description:</strong> {formData.description || 'No description'}
            </div>
            <div>
              <strong>Trigger:</strong> {getTriggerText(formData.trigger)}
            </div>
            <div>
              <strong>Actions:</strong> {formData.actions.length} action(s) configured
            </div>
            <div>
              <strong>Status:</strong> {formData.active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSave}>
              Save Workflow
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// WhatsApp Template Selector Component
interface WhatsAppTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateChange: (template: any) => void;
  onParameterMapping: (mappings: Record<string, string>) => void;
  currentMappings: Record<string, string>;
}

function WhatsAppTemplateSelector({ 
  selectedTemplate, 
  onTemplateChange, 
  onParameterMapping, 
  currentMappings 
}: WhatsAppTemplateSelectorProps) {
  const { currentSubAccount } = useSubAccount();
  
  // Fetch WhatsApp templates
  const { data: allTemplates = [] } = useQuery({
    queryKey: ['/api/templates', currentSubAccount?.id],
    queryFn: async () => {
      const response = await fetch(`/api/templates?subAccountId=${currentSubAccount?.id}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    enabled: !!currentSubAccount
  });

  // Filter WhatsApp templates - more inclusive filtering
  const templates = allTemplates.filter((template: any) => {
    // Check various possible field combinations for WhatsApp templates
    const isWhatsApp = template.type === 'whatsapp' || 
                      template.platform === 'whatsapp' ||
                      template.category === 'whatsapp' ||
                      template.templateType === 'whatsapp' ||
                      (template.whatsappTemplateId && template.whatsappTemplateId.length > 0) ||
                      (template.components && Array.isArray(template.components));
    
    console.log('Template check:', template.name, isWhatsApp, template);
    return isWhatsApp;
  });

  console.log('All templates:', allTemplates);
  console.log('Filtered WhatsApp templates:', templates);

  const selectedTemplateData = templates.find((t: any) => t.id === selectedTemplate);
  
  // CRM field options for mapping
  const crmFields = [
    { value: 'name', label: 'Lead Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'position', label: 'Position' },
    { value: 'company', label: 'Company' },
    { value: 'source', label: 'Source' },
    { value: 'status', label: 'Status' },
    { value: 'value', label: 'Lead Value' }
  ];

  const handleMappingChange = (parameterIndex: number, fieldValue: string) => {
    const newMappings = { ...currentMappings };
    newMappings[parameterIndex.toString()] = fieldValue;
    onParameterMapping(newMappings);
  };

  return (
    <div className="space-y-4 col-span-2">
      <div>
        <label className="block text-sm font-medium mb-2">WhatsApp Template</label>
        <Select 
          value={selectedTemplate} 
          onValueChange={(value) => {
            const template = templates.find((t: any) => t.id === value);
            onTemplateChange(template);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select WhatsApp template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template: any) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplateData && selectedTemplateData.components && (
        <div className="space-y-3">
          <h4 className="font-medium">Template Preview & Field Mapping</h4>
          
          {/* Show template body with parameter mapping */}
          {selectedTemplateData.components.map((component: any, compIndex: number) => {
            if (component.type === 'BODY' && component.parameters) {
              return (
                <div key={compIndex} className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-sm font-medium mb-2">Message Body:</div>
                  <div className="text-sm text-gray-600 mb-3">{component.text}</div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Map Dynamic Variables to CRM Fields:</div>
                    {component.parameters.map((param: any, paramIndex: number) => (
                      <div key={paramIndex} className="flex items-center gap-2">
                        <span className="text-sm min-w-0 flex-shrink-0">
                          Variable {paramIndex + 1}:
                        </span>
                        <Select 
                          value={currentMappings[paramIndex.toString()] || ''} 
                          onValueChange={(value) => handleMappingChange(paramIndex, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select CRM field" />
                          </SelectTrigger>
                          <SelectContent>
                            {crmFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Show buttons if any */}
          {selectedTemplateData.components.some((comp: any) => comp.type === 'BUTTONS') && (
            <div className="border rounded-lg p-3 bg-blue-50">
              <div className="text-sm font-medium mb-2">Template Buttons:</div>
              {selectedTemplateData.components
                .filter((comp: any) => comp.type === 'BUTTONS')
                .map((comp: any) => (
                  <div key={comp.type} className="space-y-1">
                    {comp.buttons?.map((button: any, btnIndex: number) => (
                      <div key={btnIndex} className="text-sm text-blue-600">
                        • {button.text}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>No WhatsApp templates found.</p>
          <p className="text-xs mt-1">Make sure WhatsApp is connected and templates are synced.</p>
        </div>
      )}
    </div>
  );
}

// Helper function
function getTriggerText(trigger: WorkflowTrigger): string {
  switch (trigger.type) {
    case 'lead_created':
      return 'When a lead is created';
    case 'lead_status_changed':
      return `When lead status changes to ${trigger.config?.status || 'any'}`;
    case 'time_based':
      return `Time-based (${trigger.config?.delay || 0} hours delay)`;
    case 'manual':
      return 'Manual trigger';
    default:
      return 'Unknown trigger';
  }
}