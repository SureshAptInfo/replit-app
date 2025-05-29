import type { Express } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import { DatabaseStorage } from "../database-storage";

const upload = multer({ storage: multer.memoryStorage() });
const storage = new DatabaseStorage();

export function registerSimpleImportRoutes(app: Express) {
  app.post("/api/leads/simple-import", upload.single('csvFile'), async (req, res) => {
    console.log("=== SIMPLE IMPORT ENDPOINT HIT ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("File uploaded:", !!req.file);
    
    try {
      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fieldMappings = JSON.parse(req.body.fieldMappings || "[]");
      const source = req.body.source || 'csv_import';
      const csvData = req.file.buffer.toString('utf-8');
      
      console.log("Field mappings:", fieldMappings);
      console.log("Source:", source);
      console.log("CSV data length:", csvData.length);
      
      let imported = 0;
      let errors = 0;

      // Parse CSV
      const records = await new Promise<any[]>((resolve, reject) => {
        parse(csvData, { columns: true, skip_empty_lines: true, trim: true }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      console.log("Records parsed:", records.length);

      // Process each record
      for (const record of records) {
        try {
          const leadData: any = {
            subAccountId: 1,
            source: source,
            status: "new"
          };

          // Apply field mappings
          for (const mapping of fieldMappings) {
            if (mapping.leadField !== 'skip' && record[mapping.csvColumn]) {
              leadData[mapping.leadField] = String(record[mapping.csvColumn]).trim();
            }
          }

          console.log("Creating lead with data:", leadData);

          // Only create if we have essential data
          if (leadData.name || leadData.email || leadData.phone) {
            const newLead = await storage.createLead(leadData);
            console.log("Lead created successfully:", newLead.id);
            imported++;
          } else {
            console.log("Skipping record - no essential data");
            errors++;
          }
        } catch (error: any) {
          console.error("Error creating lead:", error);
          errors++;
        }
      }

      console.log("Import complete - Total:", records.length, "Imported:", imported, "Errors:", errors);

      res.json({
        total: records.length,
        imported: imported,
        duplicates: 0,
        errors: errors,
        errorDetails: []
      });

    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}