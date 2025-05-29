import type { Express } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import { DatabaseStorage } from "../database-storage";

const storage = new DatabaseStorage();

const upload = multer({ storage: multer.memoryStorage() });

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

export function registerFixedImportRoutes(app: Express) {
  // Import leads from CSV - FIXED VERSION
  app.post("/api/leads/import-fixed", upload.single('csvFile'), async (req, res) => {
    console.log("=== IMPORT ENDPOINT HIT ===");
    try {
      console.log("=== IMPORT DEBUG START ===");
      console.log("Auth check:", req.isAuthenticated());
      console.log("File received:", !!req.file);
      console.log("Body keys:", Object.keys(req.body));
      console.log("Raw body:", req.body);

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse form data
      const fieldMappingsStr = req.body.fieldMappings;
      console.log("Field mappings string:", fieldMappingsStr);
      
      let fieldMappings: FieldMapping[] = [];
      try {
        fieldMappings = fieldMappingsStr ? JSON.parse(fieldMappingsStr) : [];
        console.log("Parsed field mappings:", fieldMappings);
      } catch (error) {
        console.error("Error parsing field mappings:", error);
        return res.status(400).json({ error: "Invalid field mappings format" });
      }

      if (!fieldMappings || fieldMappings.length === 0) {
        console.error("No field mappings provided");
        return res.status(400).json({ error: "Field mappings are required" });
      }

      const skipDuplicates = req.body.skipDuplicates === 'true';
      const source = req.body.source || 'csv_import';
      
      console.log("Skip duplicates:", skipDuplicates);
      console.log("Source:", source);

      const csvData = req.file.buffer.toString('utf-8');
      console.log("CSV data length:", csvData.length);
      
      const result: ImportResult = {
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: []
      };

      // Parse CSV
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
        console.log(`Processing ${result.total} records`);
        console.log("Sample record:", records[0]);

        // Get existing leads for duplicate checking
        let existingLeads: any[] = [];
        if (skipDuplicates) {
          existingLeads = await storage.getLeadsBySubAccount(1);
          console.log(`Found ${existingLeads.length} existing leads`);
        }

        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          
          try {
            // Build lead data from mappings
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
              if (value && value.toString().trim()) {
                leadData[mapping.leadField] = value.toString().trim();
                
                if (mapping.leadField === 'name' || mapping.leadField === 'email' || mapping.leadField === 'phone') {
                  hasRequiredFields = true;
                }
              }
            }

            console.log(`Row ${i + 1}: leadData =`, leadData);
            console.log(`Row ${i + 1}: hasRequiredFields =`, hasRequiredFields);

            if (!hasRequiredFields) {
              result.errors++;
              result.errorDetails.push(`Row ${i + 1}: Missing required fields (name, email, or phone)`);
              continue;
            }

            // Check for duplicates
            let isDuplicate = false;
            if (skipDuplicates && (leadData.email || leadData.phone)) {
              for (const existingLead of existingLeads) {
                // Email duplicate check
                if (leadData.email && existingLead.email) {
                  if (leadData.email.toLowerCase().trim() === existingLead.email.toLowerCase().trim()) {
                    isDuplicate = true;
                    break;
                  }
                }
                
                // Phone duplicate check
                if (leadData.phone && existingLead.phone) {
                  const normalizedNew = leadData.phone.replace(/[\s\-\(\)]/g, '');
                  const normalizedExisting = existingLead.phone.replace(/[\s\-\(\)]/g, '');
                  if (normalizedNew === normalizedExisting) {
                    isDuplicate = true;
                    break;
                  }
                }
              }
            }

            if (isDuplicate) {
              result.duplicates++;
              console.log(`Row ${i + 1}: Duplicate found, skipping`);
              continue;
            }

            // Create the lead
            try {
              const newLead = await storage.createLead(leadData);
              result.imported++;
              console.log(`Row ${i + 1}: Successfully created lead ID ${newLead.id}`);
              
              // Add to existing leads for batch duplicate checking
              if (skipDuplicates) {
                existingLeads.push(newLead);
              }
            } catch (createError: any) {
              console.error(`Row ${i + 1}: Error creating lead:`, createError);
              result.errors++;
              result.errorDetails.push(`Row ${i + 1}: Error creating lead - ${createError.message}`);
            }
          } catch (recordError: any) {
            console.error(`Row ${i + 1}: Error processing record:`, recordError);
            result.errors++;
            result.errorDetails.push(`Row ${i + 1}: Error processing record - ${recordError.message}`);
          }
        }

        console.log("=== IMPORT RESULTS ===");
        console.log("Total:", result.total);
        console.log("Imported:", result.imported);
        console.log("Duplicates:", result.duplicates);
        console.log("Errors:", result.errors);
        console.log("Error details:", result.errorDetails);
        console.log("=== IMPORT DEBUG END ===");

        res.json(result);
      });

    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to process CSV file: " + error.message });
    }
  });
}