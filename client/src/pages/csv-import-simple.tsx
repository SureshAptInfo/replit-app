import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function CSVImportSimple() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const processCSV = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    
    try {
      // Read file content
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have header and at least one data row');
      }

      setProgress(20);

      // Parse CSV manually
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Find column indexes
      const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
      const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
      const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));
      const positionIndex = headers.findIndex(h => h.toLowerCase().includes('position') || h.toLowerCase().includes('title'));

      setProgress(40);

      // Prepare all leads
      const allLeads = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        const leadData = {
          name: nameIndex >= 0 ? values[nameIndex] : '',
          email: emailIndex >= 0 ? values[emailIndex] : null,
          phone: phoneIndex >= 0 ? values[phoneIndex] : '',
          position: positionIndex >= 0 ? values[positionIndex] : null,
          source: 'csv_import'
        };

        // Skip if no name or phone
        if (leadData.name && leadData.phone) {
          allLeads.push(leadData);
        }
      }

      setProgress(60);

      // Send to bulk import API
      const response = await fetch('/api/leads/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: allLeads }),
      });

      setProgress(80);

      if (!response.ok) {
        throw new Error('Bulk import failed');
      }

      const result = await response.json();
      setProgress(100);

      setResult(result);

      toast({
        title: "Import Complete",
        description: `Imported ${result.imported} leads, ${result.duplicates} duplicates skipped`,
      });

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setImporting(false);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CSV Import</h1>
        <p className="text-muted-foreground">
          Import leads from a CSV file. Your CSV should have columns for Name, Email, Phone, and Position.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
          <CardDescription>
            Select a CSV file with lead information. Required columns: Name, Phone. Optional: Email, Position.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Choose CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            onClick={processCSV}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Import Leads"}
          </Button>

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Import completed: {result.imported} leads imported successfully
                {result.duplicates > 0 && `, ${result.duplicates} duplicates skipped`}
                {result.errors > 0 && `, ${result.errors} errors`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            Name,Email,Phone,Position<br/>
            John Doe,john@example.com,555-1234,Manager<br/>
            Jane Smith,jane@example.com,555-5678,Developer
          </div>
        </CardContent>
      </Card>
    </div>
  );
}