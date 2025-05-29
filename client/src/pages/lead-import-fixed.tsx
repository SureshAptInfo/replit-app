import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, FileText, Download, ArrowRight, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

type Step = 'upload' | 'mapping' | 'import' | 'complete';

interface CSVColumn {
  name: string;
  sample: string;
}

interface FieldMapping {
  csvColumn: string;
  leadField: string;
}

const LEAD_FIELDS = [
  { value: 'skip', label: 'Skip This Column' },
  { value: 'name', label: 'Full Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'position', label: 'Job Title/Position' },
  { value: 'company', label: 'Company Name' },
  { value: 'address', label: 'Address' },
  { value: 'source', label: 'Lead Source' },
  { value: 'notes', label: 'Notes' },
];

export default function LeadImportFixed() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

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
      setStep('mapping');
      
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

  const startImport = async () => {
    if (!csvFile) return;

    setIsProcessing(true);
    setStep('import');
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('fieldMappings', JSON.stringify(fieldMappings));
      formData.append('skipDuplicates', 'true');

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setImportProgress(100);
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

  const renderUploadStep = () => (
    <div className="space-y-6">
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
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Map CSV Columns</h3>
          <p className="text-sm text-gray-500">
            Found {totalRows} rows with {csvColumns.length} columns
          </p>
        </div>
        <Button onClick={() => setStep('upload')} variant="outline">
          Back
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">CSV Column</TableHead>
                <TableHead className="w-1/3">Sample Data</TableHead>
                <TableHead className="w-1/3">Map To Lead Field</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvColumns.slice(0, 4).map((column, index) => {
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
              {csvColumns.length > 4 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-4">
                    ... and {csvColumns.length - 4} more columns
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-between">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            At least one of Name, Email, or Phone must be mapped for successful import
          </AlertDescription>
        </Alert>
        <Button onClick={startImport} className="ml-4">
          <ArrowRight className="h-4 w-4 mr-2" />
          Start Import
        </Button>
      </div>
    </div>
  );

  const renderImportStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <FileText className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold">Importing Leads</h3>
        <p className="text-sm text-gray-500">Processing {totalRows} rows...</p>
      </div>
      <Progress value={importProgress} className="w-full" />
      <p className="text-sm text-gray-600">{importProgress}% complete</p>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold">Import Complete!</h3>
      </div>
      
      {importResult && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Processed:</span> {importResult.total}
            </div>
            <div>
              <span className="font-medium text-green-600">Imported:</span> {importResult.imported}
            </div>
            <div>
              <span className="font-medium text-yellow-600">Duplicates:</span> {importResult.duplicates}
            </div>
            <div>
              <span className="font-medium text-red-600">Errors:</span> {importResult.errors}
            </div>
          </div>
          
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="mt-4 text-left">
              <p className="font-medium text-sm mb-2">Error Details:</p>
              <div className="text-xs text-gray-600 max-h-32 overflow-y-auto space-y-1">
                {importResult.errorDetails.slice(0, 5).map((error: string, index: number) => (
                  <div key={index} className="bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
                {importResult.errorDetails.length > 5 && (
                  <div className="text-center py-2">
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
        }} variant="outline">
          Import More
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Import</h1>
          <p className="text-gray-600">Import leads from CSV files</p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          {['upload', 'mapping', 'import', 'complete'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName ? 'bg-primary text-white' :
                ['upload', 'mapping', 'import', 'complete'].indexOf(step) > index ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  ['upload', 'mapping', 'import', 'complete'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 'upload' && 'Upload CSV File'}
            {step === 'mapping' && 'Field Mapping'}
            {step === 'import' && 'Importing Data'}
            {step === 'complete' && 'Import Complete'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'import' && renderImportStep()}
          {step === 'complete' && renderCompleteStep()}
        </CardContent>
      </Card>
    </div>
  );
}