import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AddLead() {
  const [leads, setLeads] = useState([
    {
      name: '',
      email: '',
      phone: '',
      position: '',
      company: '',
      source: 'Website',
      notes: ''
    }
  ]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addMoreLeads = () => {
    setLeads([...leads, {
      name: '',
      email: '',
      phone: '',
      position: '',
      company: '',
      source: 'Website',
      notes: ''
    }]);
  };

  const updateLead = (index: number, field: string, value: string) => {
    const updatedLeads = [...leads];
    updatedLeads[index] = { ...updatedLeads[index], [field]: value };
    setLeads(updatedLeads);
  };

  const removeLead = (index: number) => {
    if (leads.length > 1) {
      setLeads(leads.filter((_, i) => i !== index));
    }
  };

  const saveLeads = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      if (lead.name || lead.email || lead.phone) {
        try {
          await apiRequest('POST', '/api/leads', {
            name: lead.name,
            email: lead.email || null,
            phone: lead.phone,
            position: lead.position || null,
            company: lead.company || null,
            source: lead.source,
            notes: lead.notes || null,
            status: 'new'
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
    }

    setSaving(false);
    
    if (successCount > 0) {
      toast({
        title: "Leads Added Successfully",
        description: `Added ${successCount} leads to your system`,
      });
      
      // Reset form
      setLeads([{
        name: '',
        email: '',
        phone: '',
        position: '',
        company: '',
        source: 'Website',
        notes: ''
      }]);
    }
    
    if (errorCount > 0) {
      toast({
        title: "Some leads failed to save",
        description: `${errorCount} leads could not be added`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Leads</h1>
        <p className="text-muted-foreground">
          Quickly add one or multiple leads to your system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Lead Information
          </CardTitle>
          <CardDescription>
            Fill in the lead details below. You can add multiple leads at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {leads.map((lead, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Lead {index + 1}</h3>
                {leads.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLead(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Name *</Label>
                  <Input
                    id={`name-${index}`}
                    value={lead.name}
                    onChange={(e) => updateLead(index, 'name', e.target.value)}
                    placeholder="Enter lead name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={lead.email}
                    onChange={(e) => updateLead(index, 'email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>Phone *</Label>
                  <Input
                    id={`phone-${index}`}
                    value={lead.phone}
                    onChange={(e) => updateLead(index, 'phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`position-${index}`}>Position</Label>
                  <Input
                    id={`position-${index}`}
                    value={lead.position}
                    onChange={(e) => updateLead(index, 'position', e.target.value)}
                    placeholder="Job title or position"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`company-${index}`}>Company</Label>
                  <Input
                    id={`company-${index}`}
                    value={lead.company}
                    onChange={(e) => updateLead(index, 'company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`source-${index}`}>Source</Label>
                  <Select
                    value={lead.source}
                    onValueChange={(value) => updateLead(index, 'source', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                      <SelectItem value="Phone Call">Phone Call</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Advertisement">Advertisement</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`notes-${index}`}>Notes</Label>
                <Textarea
                  id={`notes-${index}`}
                  value={lead.notes}
                  onChange={(e) => updateLead(index, 'notes', e.target.value)}
                  placeholder="Additional notes about this lead"
                  rows={2}
                />
              </div>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={addMoreLeads}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Lead
            </Button>
            
            <Button
              onClick={saveLeads}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save All Leads"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}