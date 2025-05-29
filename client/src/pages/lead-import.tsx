import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Upload, FileSpreadsheet, Info, AlertCircle, CheckCircle2, Download } from 'lucide-react';

type Step = 'upload' | 'mapping' | 'import' | 'complete';

interface CsvColumn {
  name: string;
  sample: string;
}

interface FieldMapping {
  csvColumn: string;
  leadField: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const leadFields = [
  { value: 'skip', label: 'Skip this column' },
  { value: 'name', label: 'Name (Required)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'position', label: 'Position/Title' },
  { value: 'company', label: 'Company' },
  { value: 'address', label: 'Address' },
  { value: 'source', label: 'Lead Source' },
  { value: 'notes', label: 'Notes' },
];

export default function LeadImport() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvColumns, setCsvColumns] = useState<CsvColumn[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast({
          title: "Empty file",
          description: "The CSV file appears to be empty",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setCsvHeaders(headers);
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      setCsvData(data);
      
      // Create column samples
      const columns = headers.map(header => ({
        name: header,
        sample: data[0]?.[header] || ''
      }));
      setCsvColumns(columns);
      
      // Auto-map common fields
      const autoMappings: FieldMapping[] = [];
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('name')) autoMappings.push({ csvColumn: header, leadField: 'name' });
        else if (lowerHeader.includes('email')) autoMappings.push({ csvColumn: header, leadField: 'email' });
        else if (lowerHeader.includes('phone')) autoMappings.push({ csvColumn: header, leadField: 'phone' });
        else if (lowerHeader.includes('position') || lowerHeader.includes('title')) autoMappings.push({ csvColumn: header, leadField: 'position' });
        else if (lowerHeader.includes('company')) autoMappings.push({ csvColumn: header, leadField: 'company' });
        else autoMappings.push({ csvColumn: header, leadField: 'skip' });
      });
      setFieldMappings(autoMappings);
      
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const updateFieldMapping = (csvColumn: string, leadField: string) => {
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
    
    setImporting(true);
    setImportProgress(0);
    setStep('import');
    
    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('fieldMappings', JSON.stringify(fieldMappings));
      formData.append('skipDuplicates', skipDuplicates.toString());
      
      const response = await apiRequest('POST', '/api/leads/import', formData);
      const result = await response.json();
      
      setImportResult(result);
      setImportProgress(100);
      setStep('complete');
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.imported} leads`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportLeads = async () => {
    try {
      const response = await apiRequest('GET', '/api/leads/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'leads_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export completed",
        description: "Leads exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasRequiredMappings = fieldMappings.some(m => m.leadField === 'name') && 
                             (fieldMappings.some(m => m.leadField === 'email') || 
                              fieldMappings.some(m => m.leadField === 'phone'));

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-col space-y-6 p-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
              <p className="text-muted-foreground">
                Upload a CSV file to import leads into your CRM
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={exportLeads}>
            <Download className="h-4 w-4 mr-2" />
            Export Leads
          </Button>
        </div>

        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p>Drop the CSV file here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop a CSV file here, or click to select
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Supported format: .csv files only
                    </p>
                  </div>
                )}
              </div>
              
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your CSV should include columns like Name, Email, Phone, Company, Position. 
                  We'll help you map the fields in the next step.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {step === 'mapping' && (
          <Card>
            <CardHeader>
              <CardTitle>Map CSV Columns to Lead Fields</CardTitle>
              <p className="text-muted-foreground">
                Match your CSV columns to the appropriate lead fields. Name and either Email or Phone are required.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {csvColumns.map((column, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                    <div className="min-w-0">
                      <Label className="font-medium truncate block">{column.name}</Label>
                      <p className="text-sm text-muted-foreground truncate">Sample: {column.sample}</p>
                    </div>
                    <div className="flex items-center justify-center text-muted-foreground">→</div>
                    <Select 
                      value={fieldMappings.find(m => m.csvColumn === column.name)?.leadField || 'skip'}
                      onValueChange={(value) => updateFieldMapping(column.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Data Preview - Limited and Responsive */}
              {csvData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Preview</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {csvHeaders.slice(0, 4).map((header) => (
                              <th key={header} className="px-3 py-2 text-left font-medium text-xs whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                            {csvHeaders.length > 4 && (
                              <th className="px-3 py-2 text-left font-medium text-xs">
                                +{csvHeaders.length - 4} more
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 3).map((row, index) => (
                            <tr key={index} className="border-t">
                              {csvHeaders.slice(0, 4).map((header) => (
                                <td key={header} className="px-3 py-2 text-xs max-w-32 truncate">
                                  {String(row[header] || '')}
                                </td>
                              ))}
                              {csvHeaders.length > 4 && (
                                <td className="px-3 py-2 text-xs text-gray-400">
                                  ...
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                      Showing first 3 rows of {csvData.length} total rows
                      {csvHeaders.length > 4 && ` (first 4 of ${csvHeaders.length} columns)`}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox 
                  id="skipDuplicates" 
                  checked={skipDuplicates}
                  onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                />
                <Label htmlFor="skipDuplicates">
                  Skip duplicate leads (based on email or phone)
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button 
                  onClick={startImport}
                  disabled={!hasRequiredMappings}
                >
                  Start Import
                </Button>
              </div>

              {!hasRequiredMappings && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please map at least the Name field and either Email or Phone field to continue.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'import' && (
          <Card>
            <CardHeader>
              <CardTitle>Importing Leads...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={importProgress} className="w-full" />
                <p className="text-center text-muted-foreground">
                  Processing your CSV file and importing leads...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                    <div className="text-sm text-green-700">Imported</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-sm text-yellow-700">Skipped</div>
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Errors occurred during import:</div>
                      <ul className="list-disc list-inside mt-2">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-sm">... and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/leads')}>
                    View Leads
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep('upload');
                    setCsvFile(null);
                    setCsvColumns([]);
                    setFieldMappings([]);
                    setImportResult(null);
                  }}>
                    Import Another File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}