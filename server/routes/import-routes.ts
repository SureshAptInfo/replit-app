import type { Express } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import { storage } from "../storage";
import * as schema from "@shared/schema";

// Configure multer for file uploads  
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

export function registerImportRoutes(app: Express) {
  // Preview CSV file and extract column headers with sample data
  app.post("/api/leads/import/preview", upload.any(), async (req, res) => {
    // Find the CSV file in the uploaded files
    const csvFile = Array.isArray(req.files) ? req.files.find((file: any) => file.fieldname === 'csvFile' || file.originalname?.endsWith('.csv')) : null;
    if (!csvFile) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }
    
    // Override req.file for compatibility
    req.file = csvFile;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const records: any[] = [];
      
      // Parse CSV to get first few rows
      parse(csvData, { 
        columns: true, 
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) {
          return res.status(400).json({ error: "Invalid CSV format" });
        }
        
        if (!data || data.length === 0) {
          return res.status(400).json({ error: "CSV file is empty" });
        }

        // Extract column names and sample data
        const firstRow = data[0];
        const columns: CSVColumn[] = Object.keys(firstRow).map(key => ({
          name: key,
          sample: firstRow[key] || ""
        }));

        res.json({ 
          columns,
          totalRows: data.length 
        });
      });
    } catch (error) {
      console.error("CSV preview error:", error);
      res.status(500).json({ error: "Failed to process CSV file" });
    }
  });

  // Import leads from CSV
  app.post("/api/leads/import", upload.any(), async (req, res) => {
    // Find the CSV file in the uploaded files
    const csvFile = Array.isArray(req.files) ? req.files.find((file: any) => file.fieldname === 'csvFile' || file.originalname?.endsWith('.csv')) : null;
    if (!csvFile) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }
    
    // Override req.file for compatibility
    req.file = csvFile;
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`Import: Raw req.body:`, req.body);
      console.log(`Import: req.body.fieldMappings:`, req.body.fieldMappings);
      
      let fieldMappings: FieldMapping[] = [];
      try {
        fieldMappings = JSON.parse(req.body.fieldMappings || "[]");
        console.log(`Import: Parsed fieldMappings:`, fieldMappings);
      } catch (error) {
        console.error(`Import: Error parsing fieldMappings:`, error);
        return res.status(400).json({ error: "Invalid field mappings format" });
      }
      const skipDuplicates = req.body.skipDuplicates === 'true';
      const source = req.body.source || 'csv_import';
      const csvData = req.file.buffer.toString('utf-8');
      
      console.log(`Import started: skipDuplicates=${skipDuplicates}, source=${source}`);

      const result: ImportResult = {
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: []
      };

      // Parse CSV data
      parse(csvData, { 
        columns: true, 
        skip_empty_lines: true,
        trim: true
      }, async (err, records) => {
        if (err) {
          console.error("CSV parse error:", err);
          return res.status(400).json({ error: "Invalid CSV format" });
        }

        result.total = records.length;
        console.log(`Import: Processing ${result.total} records, skipDuplicates: ${skipDuplicates}`);
        console.log(`Import: Request body keys:`, Object.keys(req.body));
        console.log(`Import: fieldMappings received:`, fieldMappings);
        console.log(`Import: First few records:`, records.slice(0, 2));

        // Fetch existing leads once for duplicate checking
        let existingLeads: any[] = [];
        if (skipDuplicates) {
          existingLeads = await storage.getLeadsBySubAccount(1);
          console.log(`Import: Found ${existingLeads.length} existing leads for duplicate checking`);
          
          // Debug: Log a sample of existing emails and phones
          const sampleExisting = existingLeads.slice(0, 3).map(lead => ({
            email: lead.email,
            phone: lead.phone
          }));
          console.log(`Import: Sample existing leads:`, sampleExisting);
        }

        for (const record of records) {
          try {
            // Map CSV columns to lead fields
            const leadData: any = {
              subAccountId: 1,
              source: source,
              status: "new"
            };

            let hasRequiredFields = false;

            // Apply field mappings
            for (const mapping of fieldMappings) {
              if (mapping.leadField === 'skip') continue;
              
              const value = record[mapping.csvColumn];
              if (value && String(value).trim()) {
                const trimmedValue = String(value).trim();
                leadData[mapping.leadField] = trimmedValue;
                
                // Check for required fields
                if (['name', 'email', 'phone'].includes(mapping.leadField)) {
                  hasRequiredFields = true;
                }
              }
            }

            console.log(`Import: Final leadData:`, leadData);
            console.log(`Import: Has required fields:`, hasRequiredFields);

            if (!hasRequiredFields) {
              result.errors++;
              result.errorDetails.push(`Row ${result.imported + result.errors + result.duplicates + 1}: Missing required fields (name, email, or phone)`);
              continue;
            }

            // Check for duplicates if enabled
            if (skipDuplicates && (leadData.email || leadData.phone)) {
              let isDuplicate = false;
              
              // Debug: Log what we're checking
              console.log(`Import: Checking for duplicates - Email: ${leadData.email}, Phone: ${leadData.phone}`);
              
              // Check by email first
              if (leadData.email) {
                isDuplicate = existingLeads.some(lead => 
                  lead.email && lead.email.toLowerCase() === leadData.email.toLowerCase()
                );
                if (isDuplicate) {
                  console.log(`Import: Found duplicate by email: ${leadData.email}`);
                }
              }
              
              // Check by phone if not duplicate by email
              if (!isDuplicate && leadData.phone) {
                // Normalize phone numbers for comparison
                const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
                const normalizedPhone = normalizePhone(leadData.phone);
                
                isDuplicate = existingLeads.some(lead => 
                  lead.phone && normalizePhone(lead.phone) === normalizedPhone
                );
                if (isDuplicate) {
                  console.log(`Import: Found duplicate by phone: ${leadData.phone}`);
                }
              }

              if (isDuplicate) {
                result.duplicates++;
                console.log(`Import: Skipping duplicate lead: ${leadData.name}`);
                continue;
              }
            }

            // Validate required fields
            if (!leadData.name) {
              result.errors++;
              result.errorDetails.push(`Row ${result.imported + result.errors + result.duplicates + 1}: Name is required`);
              continue;
            }

            // Create the lead
            const newLead = await storage.createLead(leadData);
            
            // Add to existing leads array for subsequent duplicate checks
            if (skipDuplicates) {
              existingLeads.push(newLead);
            }
            
            result.imported++;

          } catch (error: any) {
            result.errors++;
            result.errorDetails.push(`Row ${result.imported + result.errors + result.duplicates + 1}: ${error.message}`);
          }
        }

        res.json(result);
      });

    } catch (error) {
      console.error("CSV import error:", error);
      res.status(500).json({ error: "Failed to import leads" });
    }
  });

  // Export leads to CSV
  app.get("/api/leads/export", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { format = 'csv', status, source } = req.query;
      
      // Get leads based on filters
      const filters: any = {};
      if (status && status !== 'all') filters.status = status as string;
      if (source && source !== 'all') filters.source = source as string;

      const leads = await storage.getLeadsBySubAccount(
        1, // Default subAccount for now
        filters
      );

      if (format === 'csv') {
        // Prepare CSV data
        const csvColumns = [
          'Name',
          'Email', 
          'Phone',
          'Company',
          'Position',
          'Status',
          'Source',
          'Notes',
          'Created Date',
          'Last Updated'
        ];

        const csvData = leads.map(lead => [
          lead.name || '',
          lead.email || '',
          lead.phone || '',
          lead.company || '',
          lead.position || '',
          lead.status || '',
          lead.source || '',
          lead.notes || '',
          lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : '',
          lead.updatedAt ? new Date(lead.updatedAt).toISOString().split('T')[0] : ''
        ]);

        // Generate CSV using sync version
        try {
          const output = stringify([csvColumns, ...csvData]);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`);
          res.send(output);
        } catch (err) {
          return res.status(500).json({ error: "Failed to generate CSV" });
        }
      } else {
        // Return JSON format
        res.json(leads);
      }

    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export leads" });
    }
  });
}