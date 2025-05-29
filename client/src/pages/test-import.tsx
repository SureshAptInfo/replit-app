import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function TestImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      // Test with simple field mappings
      const fieldMappings = [
        { csvColumn: 'Name', leadField: 'name' },
        { csvColumn: 'Email', leadField: 'email' },
        { csvColumn: 'Phone', leadField: 'phone' },
        { csvColumn: 'Position', leadField: 'position' }
      ];
      
      formData.append('fieldMappings', JSON.stringify(fieldMappings));
      formData.append('skipDuplicates', 'false');
      formData.append('source', 'test_import');

      const response = await fetch('/api/leads/import-fixed', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        toast({
          title: "Import Complete",
          description: `Imported ${data.imported} of ${data.total} records`,
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Import (Fixed Version)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>
          
          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Test Import"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Import Results:</h3>
              <div className="space-y-1">
                <p>Total records: {result.total}</p>
                <p className="text-green-600">Successfully imported: {result.imported}</p>
                <p className="text-yellow-600">Duplicates skipped: {result.duplicates}</p>
                <p className="text-red-600">Errors: {result.errors}</p>
                
                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-600">Error Details:</p>
                    <ul className="text-sm text-red-500 list-disc list-inside">
                      {result.errorDetails.slice(0, 5).map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                      {result.errorDetails.length > 5 && (
                        <li>... and {result.errorDetails.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}