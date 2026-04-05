import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";
import Papa from "papaparse";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  console.log("Server starting... Registering API routes.");

  app.get("/api/health", (req, res) => {
    let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (rawKey) {
      try {
        const serviceAccount = JSON.parse(rawKey);
        email = serviceAccount.client_email || email;
      } catch (e: any) {
        let hint = "";
        if (rawKey.trim().endsWith(".json") || !rawKey.trim().startsWith("{")) {
          hint = " (Hint: It looks like you provided a filename or a malformed string instead of the actual JSON content.)";
        }
        console.error(`Error parsing GOOGLE_SERVICE_ACCOUNT_JSON in health check: ${e.message}${hint}`);
      }
    }

    res.json({ status: "ok", env: { 
      email: email,
      hasKey: !!(rawKey || process.env.GOOGLE_PRIVATE_KEY),
      hasSheetId: !!process.env.GOOGLE_SHEET_ID
    }});
  });

  // Helper to get Google Sheets client
  const getSheetsClient = async (req?: express.Request, requireId = true) => {
    const spreadsheetId = req?.headers["x-sheet-id"] as string | undefined;

    if (requireId && !spreadsheetId) {
      throw new Error("Missing Spreadsheet ID — provide via x-sheet-id header");
    }

    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!rawKey) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env");
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(rawKey);
    } catch (e: any) {
      throw new Error(`Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ${e.message}. Make sure you pasted the full JSON content from your service account key file.`);
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    return {
      sheets: google.sheets({ version: "v4", auth }),
      drive: google.drive({ version: "v3", auth }),
      spreadsheetId,
    };
  };

  const getFileMetadata = async (drive: any, fileId: string) => {
    try {
      const response = await drive.files.get({
        fileId,
        fields: "id, name, mimeType",
        supportsAllDrives: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting file metadata:", error);
      return null;
    }
  };

  const HEADERS = ["Date", "Type", "Category", "Amount", "Bank", "Merchant", "Note", "ID"];

  // Exchange rates proxy
  app.get("/api/rates", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Missing from or to query params" });
    
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      if (!response.ok) throw new Error(`Frankfurter API returned ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Rates Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets API Endpoint - GET (Fetch)
  app.get("/api/sheets", async (req, res) => {
    try {
      const { sheets, drive, spreadsheetId } = await getSheetsClient(req);
      const metadata = await getFileMetadata(drive, spreadsheetId!);

      if (metadata?.mimeType === 'text/csv') {
        const response = await drive.files.get({
          fileId: spreadsheetId,
          alt: 'media',
          supportsAllDrives: true,
        }, { responseType: 'text' });
        const csvData = response.data;
        const parsed = Papa.parse(csvData as string, { header: true, skipEmptyLines: true });
        return res.json(parsed.data);
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "A:Z",
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return res.json([]);

      const headers = rows[0].map((h: any) => h ? String(h).trim() : "");
      const data = rows.slice(1).map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          // Normalize header to uppercase for consistent access
          const normalizedHeader = header.toUpperCase();
          obj[normalizedHeader] = row[index] || "";
          // Also keep original for compatibility if needed
          if (normalizedHeader !== header) {
            obj[header] = row[index] || "";
          }
        });
        return obj;
      });

      res.json(data);
    } catch (error: any) {
      console.error("GET Sheets Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets API Endpoint - POST (Append)
  app.post("/api/sheets", async (req, res) => {
    try {
      const { sheets, drive, spreadsheetId } = await getSheetsClient(req);
      const transaction = req.body;

      const metadata = await getFileMetadata(drive, spreadsheetId!);
      const dateStr = transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const newRow = [
        dateStr,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.bank || "",
        transaction.merchant || "",
        transaction.note || "",
        transaction.id
      ];

      if (metadata?.mimeType === 'text/csv') {
        const response = await drive.files.get({
          fileId: spreadsheetId,
          alt: 'media',
          supportsAllDrives: true,
        }, { responseType: 'text' });
        let csvData = response.data;
        let parsed = Papa.parse(csvData as string, { header: false, skipEmptyLines: true });
        
        if (parsed.data.length === 0) {
          parsed.data.push(HEADERS);
        }
        parsed.data.push(newRow);
        
        const updatedCsv = Papa.unparse(parsed.data);
        await drive.files.update({
          fileId: spreadsheetId,
          media: {
            mimeType: 'text/csv',
            body: updatedCsv,
          },
          supportsAllDrives: true,
        });
        return res.json({ success: true });
      }

      // Ensure headers exist or create them
      const meta = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "A1:Z1",
      });

      if (!meta.data.values || meta.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "A1",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [HEADERS]
          }
        });
      } else {
        // Check if ID column exists in current headers
        const currentHeaders = meta.data.values[0].map((h: any) => h ? String(h).toUpperCase() : "");
        if (!currentHeaders.includes("ID")) {
          // If ID is missing, we need to add it. 
          // For simplicity, we'll just overwrite the headers to match our expected structure
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "A1",
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [HEADERS]
            }
          });
        }
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "A:H",
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("POST Sheets Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets API Endpoint - DELETE
  app.delete("/api/sheets/:id", async (req, res) => {
    try {
      const { sheets, drive, spreadsheetId } = await getSheetsClient(req);
      const { id } = req.params;

      const metadata = await getFileMetadata(drive, spreadsheetId!);

      if (metadata?.mimeType === 'text/csv') {
        const response = await drive.files.get({
          fileId: spreadsheetId,
          alt: 'media',
          supportsAllDrives: true,
        }, { responseType: 'text' });
        let csvData = response.data;
        let parsed = Papa.parse(csvData as string, { header: false, skipEmptyLines: true });
        
        const idIndex = HEADERS.indexOf("ID");
        const rowIndex = parsed.data.findIndex((row: any) => row[idIndex] === id);
        
        if (rowIndex === -1) return res.status(404).json({ error: "Transaction not found" });
        
        parsed.data.splice(rowIndex, 1);
        const updatedCsv = Papa.unparse(parsed.data);
        await drive.files.update({
          fileId: spreadsheetId,
          media: {
            mimeType: 'text/csv',
            body: updatedCsv,
          },
          supportsAllDrives: true,
        });
        return res.json({ success: true });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "A:Z",
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return res.status(404).json({ error: "No data found" });

      const headers = rows[0];
      const idIndex = headers.findIndex((h: string) => h && String(h).toUpperCase() === "ID");
      
      let rowIndex = -1;
      if (idIndex !== -1) {
        rowIndex = rows.findIndex((row, idx) => idx > 0 && String(row[idIndex]) === String(id));
      }

      // Fallback: search all columns if not found by header
      if (rowIndex === -1) {
        for (let i = 1; i < rows.length; i++) {
          const foundIndex = rows[i].indexOf(id);
          if (foundIndex !== -1) {
            rowIndex = i;
            break;
          }
        }
      }

      if (rowIndex === -1) return res.status(404).json({ error: "Transaction not found in sheet. Try 'Sync All' to refresh the sheet." });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE Sheets Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets API Endpoint - BATCH UPDATE (Overwrite)
  app.put("/api/sheets/batch", async (req, res) => {
    try {
      const { sheets, drive, spreadsheetId } = await getSheetsClient(req);
      const transactions = req.body;

      if (!Array.isArray(transactions)) {
        return res.status(400).json({ error: "Body must be an array of transactions" });
      }

      const metadata = await getFileMetadata(drive, spreadsheetId!);
      const rows = transactions.map(t => [
        t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
        t.type,
        t.category,
        t.amount,
        t.bank || "",
        t.merchant || "",
        t.note || "",
        t.id
      ]);

      if (metadata?.mimeType === 'text/csv') {
        const csvData = Papa.unparse([HEADERS, ...rows]);
        await drive.files.update({
          fileId: spreadsheetId,
          media: {
            mimeType: 'text/csv',
            body: csvData,
          },
          supportsAllDrives: true,
        });
      } else {
        // Overwrite the entire sheet including headers to ensure structure is correct
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "A1",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [HEADERS, ...rows] },
        });
        
        // Clear any remaining data below our new data if needed
        // But since we are overwriting from A1, and we might have fewer rows than before,
        // it's safer to clear first or clear the rest.
        // Actually, a better way is to clear the whole sheet first.
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: "A:Z",
        });
        
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "A1",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [HEADERS, ...rows] },
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Batch Update Sheets Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets API Endpoint - PUT (Update)
  app.put("/api/sheets/:id", async (req, res) => {
    try {
      const { sheets, drive, spreadsheetId } = await getSheetsClient(req);
      const { id } = req.params;
      const transaction = req.body;

      const metadata = await getFileMetadata(drive, spreadsheetId!);
      const dateStr = transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const updatedRow = [
        dateStr,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.bank || "",
        transaction.merchant || "",
        transaction.note || "",
        id
      ];

      if (metadata?.mimeType === 'text/csv') {
        const response = await drive.files.get({
          fileId: spreadsheetId,
          alt: 'media',
          supportsAllDrives: true,
        }, { responseType: 'text' });
        let csvData = response.data;
        let parsed = Papa.parse(csvData as string, { header: false, skipEmptyLines: true });
        
        const idIndex = HEADERS.indexOf("ID");
        const rowIndex = parsed.data.findIndex((row: any) => String(row[idIndex]) === String(id));
        
        if (rowIndex === -1) return res.status(404).json({ error: "Transaction not found" });
        
        parsed.data[rowIndex] = updatedRow;
        const updatedCsv = Papa.unparse(parsed.data);
        await drive.files.update({
          fileId: spreadsheetId,
          media: {
            mimeType: 'text/csv',
            body: updatedCsv,
          },
          supportsAllDrives: true,
        });
        return res.json({ success: true });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "A:Z",
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return res.status(404).json({ error: "No data found" });

      // Find ID column index (case-insensitive)
      const headers = rows[0];
      let idIndex = headers.findIndex((h: string) => h && String(h).toUpperCase() === "ID");
      
      let rowIndex = -1;
      if (idIndex !== -1) {
        rowIndex = rows.findIndex((row, idx) => idx > 0 && String(row[idIndex]) === String(id));
      }

      // Fallback: search all columns if not found by header
      if (rowIndex === -1) {
        for (let i = 1; i < rows.length; i++) {
          const foundIndex = rows[i].indexOf(id);
          if (foundIndex !== -1) {
            rowIndex = i;
            break;
          }
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({ error: "Transaction not found in sheet. Try 'Sync All' to refresh the sheet." });
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `A${rowIndex + 1}:H${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("PUT Sheets Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
}

startServer();