import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, FileText, Download, ArrowRight, AlertCircle, ArrowLeft, Plus } from 'lucide-react';

type Step = 'upload' | 'source' | 'mapping' | 'import' | 'complete';

interface CSVColumn {
  name: string;
  sample: string;
}

interface FieldMapping {
  csvColumn: string;
  leadField: string;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: string[];
}

const LEAD_FIELDS = [
  { value: 'skip', label: 'Skip This Column' },
  { value: 'name', label: 'Full Name *' },
  { value: 'email', label: 'Email Address *' },
  { value: 'phone', label: 'Phone Number *' },
  { value: 'position', label: 'Job Title/Position' },
  { value: 'company', label: 'Company Name' },
  { value: 'address', label: 'Address' },
  { value: 'notes', label: 'Notes' },
];

export default function LeadImportEnhanced() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [customSource, setCustomSource] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Fetch available sources
  const fetchSources = async () => {
    try {
      const response = await fetch('/api/leads/sources');
      if (response.ok) {
        const sources = await response.json();
        setAvailableSources(sources);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/leads/import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to preview CSV');
      }

      const data = await response.json();
      setCsvColumns(data.columns);
      setTotalRows(data.totalRows);
      
      // Auto-map common fields
      const autoMappings: FieldMapping[] = data.columns.map((col: CSVColumn) => {
        const colName = col.name.toLowerCase().trim();
        let leadField = 'skip';
        
        if (colName.includes('name') || colName === 'full name' || colName === 'contact name') {
          leadField = 'name';
        } else if (colName.includes('email') || colName === 'email address') {
          leadField = 'email';
        } else if (colName.includes('phone') || colName === 'mobile' || colName === 'telephone') {
          leadField = 'phone';
        } else if (colName.includes('position') || colName === 'job title' || colName === 'title') {
          leadField = 'position';
        } else if (colName.includes('company') || colName === 'organization') {
          leadField = 'company';
        }
        
        return {
          csvColumn: col.name,
          leadField
        };
      });
      
      setFieldMappings(autoMappings);
      await fetchSources();
      setStep('source');
      
      toast({
        title: "CSV Preview Ready",
        description: `Found ${data.totalRows} rows with ${data.columns.length} columns`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  const handleMappingChange = (csvColumn: string, leadField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, leadField }
          : mapping
      )
    );
  };

  const proceedToMapping = () => {
    if (!selectedSource && !customSource) {
      toast({
        title: "Source Required",
        description: "Please select or enter a source for the leads",
        variant: "destructive",
      });
      return;
    }
    setStep('mapping');
  };

  const startImport = async () => {
    if (!csvFile) return;

    setIsProcessing(true);
    setStep('import');
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('fieldMappings', JSON.stringify(fieldMappings));
      formData.append('skipDuplicates', skipDuplicates.toString());
      formData.append('source', customSource || selectedSource);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 500);

      const response = await fetch('/api/leads/csv-import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setStep('complete');

      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.imported} leads`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import leads",
        variant: "destructive",
      });
      setStep('mapping');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportLeads = async () => {
    try {
      const response = await fetch('/api/leads/export', {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Leads exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  const hasRequiredMappings = fieldMappings.some(m => m.leadField === 'name') && 
                             (fieldMappings.some(m => m.leadField === 'email') || 
                              fieldMappings.some(m => m.leadField === 'phone'));

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={exportLeads} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Current Leads
          </Button>
        </div>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop the CSV file here' : 'Drag and drop a CSV file here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to select a file
            </p>
            <p className="text-xs text-gray-400">
              Supports CSV files with Name, Email, Phone, Position columns
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSourceStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Choose Lead Source</CardTitle>
        <p className="text-sm text-gray-500">
          Select the source for these {totalRows} leads from your CSV file
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="existing-source">Select Existing Source</Label>
            <Select value={selectedSource} onValueChange={(value) => {
              setSelectedSource(value);
              setCustomSource('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a source..." />
              </SelectTrigger>
              <SelectContent>
                {availableSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div>
            <Label htmlFor="custom-source">Create New Source</Label>
            <div className="flex gap-2">
              <Input
                id="custom-source"
                placeholder="Enter new source name..."
                value={customSource}
                onChange={(e) => {
                  setCustomSource(e.target.value);
                  setSelectedSource('');
                }}
              />
              <Button size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="skip-duplicates" 
              checked={skipDuplicates}
              onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
            />
            <Label htmlFor="skip-duplicates">
              Skip duplicate contacts (based on email or phone)
            </Label>
          </div>
        </div>

        <div className="flex justify-between">
          <Button onClick={() => setStep('upload')} variant="outline">
            Back
          </Button>
          <Button onClick={proceedToMapping}>
            Continue to Field Mapping
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMappingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Map CSV Columns</CardTitle>
        <p className="text-sm text-gray-500">
          Map your CSV columns to lead fields. At least Name and (Email or Phone) are required.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">CSV Column</TableHead>
                <TableHead className="w-1/3">Sample Data</TableHead>
                <TableHead className="w-1/3">Map To Lead Field</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvColumns.map((column, index) => {
                const mapping = fieldMappings.find(m => m.csvColumn === column.name);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{column.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[150px] truncate">
                      {column.sample}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping?.leadField || 'skip'}
                        onValueChange={(value) => handleMappingChange(column.name, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={() => setStep('source')} variant="outline">
            Back
          </Button>
          <div className="flex items-center gap-4">
            {!hasRequiredMappings && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Map at least Name and (Email or Phone) to continue
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={startImport} disabled={!hasRequiredMappings}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Start Import
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderImportStep = () => (
    <Card>
      <CardContent className="space-y-6 text-center py-12">
        <div>
          <FileText className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold">Importing Leads</h3>
          <p className="text-sm text-gray-500">Processing {totalRows} rows...</p>
        </div>
        <Progress value={importProgress} className="w-full max-w-md mx-auto" />
        <p className="text-sm text-gray-600">{Math.round(importProgress)}% complete</p>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <CardContent className="space-y-6 text-center py-12">
        <div>
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold">Import Complete!</h3>
        </div>
        
        {importResult && (
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold mb-4">Import Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                <div className="text-blue-800">Contacts in File</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-green-800">Successfully Imported</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-yellow-800">Duplicates Skipped</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-red-800">Errors</div>
              </div>
            </div>
            
            {importResult.errorDetails && importResult.errorDetails.length > 0 && (
              <div className="mt-4 text-left">
                <p className="font-medium text-sm mb-2">Error Details:</p>
                <div className="text-xs text-gray-600 max-h-32 overflow-y-auto space-y-1 bg-white p-3 rounded">
                  {importResult.errorDetails.slice(0, 5).map((error: string, index: number) => (
                    <div key={index} className="bg-red-50 p-2 rounded text-red-700">
                      {error}
                    </div>
                  ))}
                  {importResult.errorDetails.length > 5 && (
                    <div className="text-center py-2 text-gray-500">
                      ... and {importResult.errorDetails.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/leads')} variant="default">
            View Leads
          </Button>
          <Button onClick={() => {
            setStep('upload');
            setCsvFile(null);
            setCsvColumns([]);
            setFieldMappings([]);
            setImportResult(null);
            setSelectedSource('');
            setCustomSource('');
          }} variant="outline">
            Import More
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Lead Import</h1>
            <p className="text-gray-600">Import leads from CSV files with duplicate detection</p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          {['upload', 'source', 'mapping', 'import', 'complete'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName ? 'bg-primary text-white' :
                ['upload', 'source', 'mapping', 'import', 'complete'].indexOf(step) > index ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 4 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  ['upload', 'source', 'mapping', 'import', 'complete'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 'upload' && renderUploadStep()}
      {step === 'source' && renderSourceStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'import' && renderImportStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
}