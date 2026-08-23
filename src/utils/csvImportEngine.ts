import { COMPANY_INFO, dbService } from '../services/db';
import {
  TapeType,
  TapeWidth,
  Supplier,
  Buyer,
  RollTapePurchase,
  PaperCorePurchase,
  CartonPurchase,
  FilmPurchase,
  ProductionJob,
  SaleOrder,
  InventoryAdjustmentRecord,
  User,
} from '../types';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
  logs: string[];
}

/**
 * Universal CSV Parser that handles double quotes, escaped quotes, multiline cells, and various line breaks.
 */
export function parseCSV(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, ''); // Remove UTF-8 BOM if present
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("")
          currentCell += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  // Push last cell/row
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header keys (removes quotes, spaces, special chars to lower case)
 */
function cleanKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Converts array of rows into array of key-value objects using the first found header row
 */
export function rowsToObjects(rows: string[][]): { data: Record<string, string>[]; headers: string[] } {
  if (rows.length === 0) return { data: [], headers: [] };

  // Find header row (skipping company header lines if present)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    // A valid table header row usually has multiple columns with recognized names
    const rowKeys = row.map(cleanKey);
    const hasHeaderSignature = rowKeys.some(
      (k) =>
        k.includes('name') ||
        k.includes('id') ||
        k.includes('supplier') ||
        k.includes('buyer') ||
        k.includes('invoice') ||
        k.includes('jobcard') ||
        k.includes('rollid') ||
        k.includes('email') ||
        k.includes('date') ||
        k.includes('width') ||
        k.includes('weight') ||
        k.includes('qty') ||
        k.includes('quantity') ||
        k.includes('price') ||
        k.includes('rate') ||
        k.includes('category') ||
        k.includes('phone')
    );
    if (hasHeaderSignature && row.filter(Boolean).length >= 2) {
      headerIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerIndex].map((h) => h.trim());
  const headerKeys = rawHeaders.map(cleanKey);

  const data: Record<string, string>[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => !c.trim())) continue;

    const obj: Record<string, string> = {};
    for (let j = 0; j < headerKeys.length; j++) {
      const key = headerKeys[j];
      if (key) {
        obj[key] = row[j] !== undefined ? row[j].trim() : '';
      }
    }
    data.push(obj);
  }

  return { data, headers: rawHeaders };
}

// -------------------------------------------------------------
// SECTION-BY-SECTION IMPORTERS
// -------------------------------------------------------------

export type ImportSectionKey =
  | 'suppliers'
  | 'buyers'
  | 'rollTapePurchases'
  | 'paperCorePurchases'
  | 'cartonPurchases'
  | 'filmPurchases'
  | 'productionJobs'
  | 'salesOrders'
  | 'inventoryAdjustments'
  | 'users';

export interface SectionDefinition {
  key: ImportSectionKey;
  label: string;
  category: 'Masters' | 'Purchases & Inward' | 'Production' | 'Sales' | 'Audit & Admin';
  description: string;
  templateHeaders: string[];
  sampleRows: (string | number)[][];
}

export const IMPORT_SECTIONS: SectionDefinition[] = [
  {
    key: 'suppliers',
    label: 'Suppliers (Vendors)',
    category: 'Masters',
    description: 'Import or update Raw Material vendors with GSTIN, contact person, phone, email, and billing address.',
    templateHeaders: ['Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address', 'GSTIN', 'Status'],
    sampleRows: [
      ['Cosmo Films Limited', 'Karthik Raja', '+91 98421 11223', 'sales@cosmofilms.co.in', 'Industrial Estate, Erode', '33AAACC1234F1Z5', 'Active'],
      ['Jindal Poly Films Ltd', 'Srinivasan M', '+91 94433 44556', 'orders@jindalpoly.com', 'SIDCO Park, Coimbatore', '33AAACJ4321A1Z9', 'Active'],
    ],
  },
  {
    key: 'buyers',
    label: 'Buyers / Customers',
    category: 'Masters',
    description: 'Import client accounts with delivery address, phone, GSTIN, and contact details.',
    templateHeaders: ['Buyer Name', 'Contact Person', 'Phone', 'Email', 'Address', 'GSTIN', 'Status'],
    sampleRows: [
      ['ABC Traders & Garments', 'Arun Kumar', '+91 98422 77881', 'procurement@abctraders.com', 'No.45 Mangalam Road, Tirupur', '33AAACA9876P1Z3', 'Active'],
      ['Supreme Logistics & Cargo', 'Deepak Nathan', '+91 97890 12345', 'supply@supremelogistics.in', 'Avinashi Road, Coimbatore', '33AAACS5566G1Z2', 'Active'],
    ],
  },
  {
    key: 'rollTapePurchases',
    label: 'Jumbo Roll Tape Inward',
    category: 'Purchases & Inward',
    description: 'Import Jumbo BOPP Roll purchases (Roll ID, supplier, tape type, width, gross weight, net weight, rate/kg).',
    templateHeaders: ['Roll ID', 'Date', 'Supplier Name', 'Tape Type', 'Tape Width', 'Gross Weight (Kg)', 'Core Weight (Kg)', 'Net Weight (Kg)', 'Rate / Kg', 'Total Cost', 'Vehicle No', 'Invoice No', 'Status'],
    sampleRows: [
      ['RL-2026-8001', '2026-08-15', 'Cosmo Films Limited', 'Plain Bopp Tape', '24 mm', 120, 2, 118, 140, 16520, 'TN-38-AB-1234', 'INV-8801', 'Available'],
      ['RL-2026-8002', '2026-08-16', 'Jindal Poly Films Ltd', 'Brown Bopp Tape', '48 mm', 150, 2, 148, 145, 21460, 'TN-33-CD-5678', 'INV-8802', 'Available'],
    ],
  },
  {
    key: 'paperCorePurchases',
    label: 'Paper Core Inward',
    category: 'Purchases & Inward',
    description: 'Import Paper Core tubes inward receipts in kilograms, cost, and supplier info.',
    templateHeaders: ['Date', 'Supplier Name', 'Weight (Kg)', 'Rate / Kg', 'Total Cost', 'Invoice No', 'Remarks'],
    sampleRows: [
      ['2026-08-10', 'Sri Krishna Paper Tubes & Cores', 350, 48, 16800, 'CORE-INV-101', 'Standard 3-inch inner core stock'],
    ],
  },
  {
    key: 'cartonPurchases',
    label: 'Carton Box Inward',
    category: 'Purchases & Inward',
    description: 'Import Outer corrugated master carton boxes receipts (pieces/boxes, rate/box).',
    templateHeaders: ['Date', 'Supplier Name', 'Quantity (Boxes)', 'Rate / Box', 'Total Cost', 'Invoice No', 'Remarks'],
    sampleRows: [
      ['2026-08-11', 'Vigneshwar Corrugating Packaging', 400, 32, 12800, 'BOX-INV-501', '5-ply heavy duty master cartons'],
    ],
  },
  {
    key: 'filmPurchases',
    label: 'Heat Shrink Film Inward',
    category: 'Purchases & Inward',
    description: 'Import Heat shrink PVC/POF packaging rolls inward in kilograms.',
    templateHeaders: ['Date', 'Supplier Name', 'Weight (Kg)', 'Rate / Kg', 'Total Cost', 'Invoice No', 'Remarks'],
    sampleRows: [
      ['2026-08-12', 'PolyShrink India Polymers', 180, 165, 29700, 'FILM-INV-301', 'High clarity shrink roll film'],
    ],
  },
  {
    key: 'productionJobs',
    label: 'Production Job Cards',
    category: 'Production',
    description: 'Import production slitting logs (Job Card No, Parent Roll ID, Width, Finished Cartons/Pieces, Status).',
    templateHeaders: ['Job Card No', 'Date', 'Roll ID', 'Tape Type', 'Tape Width', 'Length (Mtr)', 'Rolls Produced', 'Pieces Per Box', 'Cartons Formed', 'Cores Consumed (Kg)', 'Cartons Used', 'Film Consumed (Kg)', 'Operator', 'Status'],
    sampleRows: [
      ['JOB-2026-01', '2026-08-18', 'RL-2026-8001', 'Plain Bopp Tape', '24 mm', 65, 480, 48, 10, 8.5, 10, 1.2, 'Muthusamy K', 'Completed'],
    ],
  },
  {
    key: 'salesOrders',
    label: 'Sales Invoices & Dispatches',
    category: 'Sales',
    description: 'Import customer sales invoices, quantities dispatched (cartons/pieces), sale price, payment status, and amount received.',
    templateHeaders: ['Invoice No', 'Date', 'Buyer Name', 'Tape Type', 'Tape Width', 'Cartons Sold', 'Pieces Sold', 'Rate Per Box', 'Total Sale Value', 'Amount Received', 'Payment Status', 'Vehicle No', 'Status'],
    sampleRows: [
      ['INV-2026-0901', '2026-08-20', 'ABC Traders & Garments', 'Plain Bopp Tape', '24 mm', 5, 240, 1200, 6000, 6000, 'Paid', 'TN-38-K-9900', 'Dispatched'],
      ['INV-2026-0902', '2026-08-21', 'Supreme Logistics & Cargo', 'Brown Bopp Tape', '48 mm', 8, 288, 1800, 14400, 5000, 'Partial', 'TN-33-F-1122', 'Dispatched'],
    ],
  },
  {
    key: 'inventoryAdjustments',
    label: 'Physical Stock Adjustments',
    category: 'Audit & Admin',
    description: 'Import stock audit reconciliation adjustments (Raw materials, packaging, finished goods).',
    templateHeaders: ['Date', 'Category', 'Item / Identifier', 'System Quantity', 'Physical Quantity', 'Difference', 'Unit', 'Reason', 'Adjusted By', 'Remarks'],
    sampleRows: [
      ['2026-08-19', 'Roll Tape', 'RL-2026-8001', 118, 115, -3, 'Kg', 'Physical Stock Audit Reconciliation', 'admin@bluemoon.in', 'Minor slitting edge trimming difference'],
    ],
  },
  {
    key: 'users',
    label: 'User Accounts & Roles',
    category: 'Audit & Admin',
    description: 'Import user profiles with usernames, passwords, system roles (Super Admin, Production Manager, Inventory Manager, Sales User, Viewer).',
    templateHeaders: ['Name', 'Username', 'Email', 'Role', 'Password', 'Status'],
    sampleRows: [
      ['Karthik Murugan', 'karthik_prod', 'karthik.m@bluemoon.in', 'Production Manager', 'user123', 'Active'],
      ['Priya Sharma', 'priya_sales', 'priya.s@bluemoon.in', 'Sales User', 'user123', 'Active'],
    ],
  },
];

/**
 * Downloads a pre-formatted clean CSV template for any section
 */
export function downloadCSVTemplate(sectionKey: ImportSectionKey, userEmail: string = 'admin@bluemoon.in') {
  const sec = IMPORT_SECTIONS.find((s) => s.key === sectionKey);
  if (!sec) return;

  const csvRows = [
    `"${COMPANY_INFO.name}"`,
    `"Template: ${sec.label}"`,
    `"Category: ${sec.category}"`,
    `"Generated On: ${new Date().toLocaleString()}"`,
    `"Authorized By: ${userEmail}"`,
    '',
    sec.templateHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...sec.sampleRows.map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '""';
          const str = String(cell).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Template_${sectionKey}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Main CSV Import Processing Engine
 */
export function processCSVImport(
  sectionKey: ImportSectionKey,
  csvText: string,
  mode: 'append_or_update' | 'replace_all',
  userEmail: string
): ImportResult {
  const rawRows = parseCSV(csvText);
  const { data } = rowsToObjects(rawRows);

  if (data.length === 0) {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: ['No valid data rows found in the uploaded CSV file. Ensure column headers match the template.'],
      logs: [],
    };
  }

  const errors: string[] = [];
  const logs: string[] = [];
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const state = dbService.getState();

  try {
    switch (sectionKey) {
      // -------------------------------------------------------------
      // 1. SUPPLIERS
      // -------------------------------------------------------------
      case 'suppliers': {
        if (mode === 'replace_all') {
          state.suppliers = [];
          logs.push('Cleared existing suppliers for complete replacement.');
        }

        data.forEach((row, idx) => {
          const name = row['suppliername'] || row['name'] || row['companyname'] || row['supplier'];
          if (!name) {
            skippedCount++;
            errors.push(`Row ${idx + 2}: Supplier Name is required. Skipped.`);
            return;
          }

          const contactPerson = row['contactperson'] || row['contact'] || row['person'] || '';
          const phone = row['phone'] || row['phonenumber'] || row['mobile'] || '';
          const email = row['email'] || row['emailaddress'] || '';
          const address = row['address'] || row['factoryaddress'] || '';
          const gstNumber = row['gstin'] || row['gstnumber'] || row['gst'] || '';
          const status = (row['status']?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive';

          const existingIndex = state.suppliers.findIndex(
            (s) => s.name.toLowerCase() === name.toLowerCase() || (gstNumber && s.gstNumber && s.gstNumber.toUpperCase() === gstNumber.toUpperCase())
          );

          if (existingIndex >= 0) {
            state.suppliers[existingIndex] = {
              ...state.suppliers[existingIndex],
              contactPerson: contactPerson || state.suppliers[existingIndex].contactPerson,
              phone: phone || state.suppliers[existingIndex].phone,
              email: email || state.suppliers[existingIndex].email,
              address: address || state.suppliers[existingIndex].address,
              gstNumber: gstNumber || state.suppliers[existingIndex].gstNumber,
              status: status || state.suppliers[existingIndex].status,
            };
            updatedCount++;
            logs.push(`Updated existing supplier: "${name}"`);
          } else {
            const newSup: Supplier = {
              id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name,
              contactPerson,
              phone,
              email,
              address,
              gstNumber,
              status,
              createdAt: new Date().toISOString(),
            };
            state.suppliers.push(newSup);
            importedCount++;
            logs.push(`Added new supplier: "${name}"`);
          }
        });
        break;
      }

      // -------------------------------------------------------------
      // 2. BUYERS
      // -------------------------------------------------------------
      case 'buyers': {
        if (mode === 'replace_all') {
          state.buyers = [];
          logs.push('Cleared existing buyers for complete replacement.');
        }

        data.forEach((row, idx) => {
          const name = row['buyername'] || row['name'] || row['companyname'] || row['buyer'] || row['customer'];
          if (!name) {
            skippedCount++;
            errors.push(`Row ${idx + 2}: Buyer Name is required. Skipped.`);
            return;
          }

          const contactPerson = row['contactperson'] || row['contact'] || row['person'] || '';
          const phone = row['phone'] || row['phonenumber'] || row['mobile'] || '';
          const email = row['email'] || row['emailaddress'] || '';
          const address = row['address'] || row['deliveryaddress'] || '';
          const gstNumber = row['gstin'] || row['gstnumber'] || row['gst'] || '';
          const status = (row['status']?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive';

          const existingIndex = state.buyers.findIndex(
            (b) => b.name.toLowerCase() === name.toLowerCase() || (gstNumber && b.gstNumber && b.gstNumber.toUpperCase() === gstNumber.toUpperCase())
          );

          if (existingIndex >= 0) {
            state.buyers[existingIndex] = {
              ...state.buyers[existingIndex],
              contactPerson: contactPerson || state.buyers[existingIndex].contactPerson,
              phone: phone || state.buyers[existingIndex].phone,
              email: email || state.buyers[existingIndex].email,
              address: address || state.buyers[existingIndex].address,
              gstNumber: gstNumber || state.buyers[existingIndex].gstNumber,
              status: status || state.buyers[existingIndex].status,
            };
            updatedCount++;
            logs.push(`Updated existing buyer: "${name}"`);
          } else {
            const newBuy: Buyer = {
              id: `buy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name,
              contactPerson,
              phone,
              email,
              address,
              gstNumber,
              status,
              createdAt: new Date().toISOString(),
            };
            state.buyers.push(newBuy);
            importedCount++;
            logs.push(`Added new buyer: "${name}"`);
          }
        });
        break;
      }

      // -------------------------------------------------------------
      // 3. JUMBO ROLL TAPE PURCHASES
      // -------------------------------------------------------------
      case 'rollTapePurchases': {
        if (mode === 'replace_all') {
          state.rollTapePurchases = [];
          logs.push('Cleared existing roll tape purchases.');
        }

        data.forEach((row, idx) => {
          const rollId = row['rollid'] || row['id'] || `RL-${Date.now()}-${idx + 1}`;
          const date = row['date'] || row['purchasedate'] || new Date().toISOString().slice(0, 10);
          const supplierName = row['suppliername'] || row['supplier'] || 'Cosmo Films Limited';
          const tapeType = (row['tapetype'] || row['type'] || 'Plain Bopp Tape') as TapeType;
          const tapeWidth = (row['tapewidth'] || row['width'] || '24 mm') as TapeWidth;
          const grossWeight = parseFloat(row['grossweightkg'] || row['grossweight'] || row['weight'] || '100') || 100;
          const coreWeight = parseFloat(row['coreweightkg'] || row['coreweight'] || '2') || 2;
          const netWeight = parseFloat(row['netweightkg'] || row['netweight'] || `${grossWeight - coreWeight}`) || (grossWeight - coreWeight);
          const ratePerKg = parseFloat(row['ratekg'] || row['rateperkg'] || row['rate'] || row['price'] || '140') || 140;
          const totalCost = parseFloat(row['totalcost'] || row['cost'] || `${netWeight * ratePerKg}`) || (netWeight * ratePerKg);
          const vehicleNumber = row['vehicleno'] || row['vehiclenumber'] || '';
          const invoiceNumber = row['invoiceno'] || row['invoicenumber'] || '';
          const availableWeight = parseFloat(row['availableweight'] || `${netWeight}`) || netWeight;
          const status = (availableWeight <= 0 ? 'Fully Used' : availableWeight < netWeight ? 'Partially Used' : 'Available') as 'Available' | 'Partially Used' | 'Fully Used';

          const existingIndex = state.rollTapePurchases.findIndex((r) => r.rollId.toLowerCase() === rollId.toLowerCase());

          if (existingIndex >= 0) {
            state.rollTapePurchases[existingIndex] = {
              ...state.rollTapePurchases[existingIndex],
              date,
              supplierName,
              tapeType,
              tapeWidth,
              grossWeight,
              coreWeight,
              netWeight,
              ratePerKg,
              totalCost,
              vehicleNumber,
              invoiceNumber,
              availableWeight,
              status,
            };
            updatedCount++;
            logs.push(`Updated Roll Tape: ${rollId}`);
          } else {
            const newRoll: RollTapePurchase = {
              id: `roll-${Date.now()}-${idx + 1}`,
              rollId,
              date,
              supplierName,
              tapeType,
              tapeWidth,
              grossWeight,
              coreWeight,
              netWeight,
              ratePerKg,
              totalCost,
              vehicleNumber,
              invoiceNumber,
              availableWeight,
              status,
              createdAt: new Date().toISOString(),
            };
            state.rollTapePurchases.push(newRoll);
            importedCount++;
            logs.push(`Imported Roll Tape: ${rollId} (${netWeight} Kg)`);
          }
        });
        break;
      }

      // -------------------------------------------------------------
      // 4. PAPER CORE PURCHASES
      // -------------------------------------------------------------
      case 'paperCorePurchases': {
        if (mode === 'replace_all') {
          state.paperCorePurchases = [];
          logs.push('Cleared existing paper core records.');
        }

        data.forEach((row, idx) => {
          const date = row['date'] || new Date().toISOString().slice(0, 10);
          const supplierName = row['suppliername'] || row['supplier'] || 'Sri Krishna Paper Tubes & Cores';
          const weightKg = parseFloat(row['weightkg'] || row['weight'] || row['quantity'] || '100') || 100;
          const ratePerKg = parseFloat(row['ratekg'] || row['rateperkg'] || row['rate'] || '48') || 48;
          const totalCost = parseFloat(row['totalcost'] || row['cost'] || `${weightKg * ratePerKg}`) || (weightKg * ratePerKg);
          const invoiceNumber = row['invoiceno'] || row['invoicenumber'] || '';
          const remarks = row['remarks'] || row['notes'] || '';

          const newPC: PaperCorePurchase = {
            id: `pc-${Date.now()}-${idx + 1}`,
            date,
            supplierName,
            weightKg,
            ratePerKg,
            totalCost,
            invoiceNumber,
            remarks,
            createdAt: new Date().toISOString(),
          };
          state.paperCorePurchases.push(newPC);
          importedCount++;
          logs.push(`Imported Paper Core: ${weightKg} Kg from ${supplierName}`);
        });
        break;
      }

      // -------------------------------------------------------------
      // 5. CARTON BOX PURCHASES
      // -------------------------------------------------------------
      case 'cartonPurchases': {
        if (mode === 'replace_all') {
          state.cartonPurchases = [];
          logs.push('Cleared existing carton box records.');
        }

        data.forEach((row, idx) => {
          const date = row['date'] || new Date().toISOString().slice(0, 10);
          const supplierName = row['suppliername'] || row['supplier'] || 'Vigneshwar Corrugating Packaging';
          const quantityBoxes = parseInt(row['quantityboxes'] || row['quantity'] || row['boxes'] || row['qty'] || '100', 10) || 100;
          const ratePerBox = parseFloat(row['ratebox'] || row['rateperbox'] || row['rate'] || '32') || 32;
          const totalCost = parseFloat(row['totalcost'] || row['cost'] || `${quantityBoxes * ratePerBox}`) || (quantityBoxes * ratePerBox);
          const invoiceNumber = row['invoiceno'] || row['invoicenumber'] || '';
          const remarks = row['remarks'] || row['notes'] || '';

          const newCB: CartonPurchase = {
            id: `carton-${Date.now()}-${idx + 1}`,
            date,
            supplierName,
            quantityBoxes,
            ratePerBox,
            totalCost,
            invoiceNumber,
            remarks,
            createdAt: new Date().toISOString(),
          };
          state.cartonPurchases.push(newCB);
          importedCount++;
          logs.push(`Imported Carton Boxes: ${quantityBoxes} Boxes from ${supplierName}`);
        });
        break;
      }

      // -------------------------------------------------------------
      // 6. FILM PURCHASES
      // -------------------------------------------------------------
      case 'filmPurchases': {
        if (mode === 'replace_all') {
          state.filmPurchases = [];
          logs.push('Cleared existing shrink film records.');
        }

        data.forEach((row, idx) => {
          const date = row['date'] || new Date().toISOString().slice(0, 10);
          const supplierName = row['suppliername'] || row['supplier'] || 'PolyShrink India Polymers';
          const weightKg = parseFloat(row['weightkg'] || row['weight'] || row['quantity'] || '50') || 50;
          const ratePerKg = parseFloat(row['ratekg'] || row['rateperkg'] || row['rate'] || '165') || 165;
          const totalCost = parseFloat(row['totalcost'] || row['cost'] || `${weightKg * ratePerKg}`) || (weightKg * ratePerKg);
          const invoiceNumber = row['invoiceno'] || row['invoicenumber'] || '';
          const remarks = row['remarks'] || row['notes'] || '';

          const newFilm: FilmPurchase = {
            id: `film-${Date.now()}-${idx + 1}`,
            date,
            supplierName,
            weightKg,
            ratePerKg,
            totalCost,
            invoiceNumber,
            remarks,
            createdAt: new Date().toISOString(),
          };
          state.filmPurchases.push(newFilm);
          importedCount++;
          logs.push(`Imported Shrink Film: ${weightKg} Kg from ${supplierName}`);
        });
        break;
      }

      // -------------------------------------------------------------
      // 7. PRODUCTION JOBS
      // -------------------------------------------------------------
      case 'productionJobs': {
        if (mode === 'replace_all') {
          state.productionJobs = [];
          state.finishedGoods = [];
          logs.push('Cleared existing production jobs & finished goods.');
        }

        data.forEach((row, idx) => {
          const jobCardNo = row['jobcardno'] || row['jobcard'] || row['jobno'] || `JOB-${Date.now()}-${idx + 1}`;
          const date = row['date'] || row['productiondate'] || new Date().toISOString().slice(0, 10);
          const rollId = row['rollid'] || row['parentrollid'] || 'RL-2026-8001';
          const tapeType = (row['tapetype'] || row['type'] || 'Plain Bopp Tape') as TapeType;
          const tapeWidth = (row['tapewidth'] || row['width'] || '24 mm') as TapeWidth;
          const tapeLengthMtr = parseInt(row['lengthmtr'] || row['length'] || '65', 10) || 65;
          const outputPieces = parseInt(row['rollsproduced'] || row['outputpieces'] || row['pieces'] || '480', 10) || 480;
          const piecesPerBox = parseInt(row['piecesperbox'] || '48', 10) || 48;
          const outputCartons = parseInt(row['cartonsformed'] || row['outputcartons'] || `${Math.floor(outputPieces / piecesPerBox)}`, 10) || Math.floor(outputPieces / piecesPerBox);
          const paperCoreKg = parseFloat(row['coresconsumedkg'] || row['papercorekg'] || '8.5') || 8.5;
          const cartonsUsed = parseInt(row['cartonsused'] || `${outputCartons}`, 10) || outputCartons;
          const filmKg = parseFloat(row['filmconsumedkg'] || row['filmkg'] || '1.2') || 1.2;
          const operatorName = row['operator'] || row['operatorname'] || 'Production Lead';
          const status = (row['status'] === 'Cancelled' ? 'Cancelled' : 'Completed') as 'Completed' | 'Cancelled';

          const existingIndex = state.productionJobs.findIndex((j) => j.jobCardNo.toLowerCase() === jobCardNo.toLowerCase());

          const jobObj: ProductionJob = {
            id: existingIndex >= 0 ? state.productionJobs[existingIndex].id : `job-${Date.now()}-${idx + 1}`,
            jobCardNo,
            date,
            rollId,
            tapeType,
            tapeWidth,
            tapeLengthMtr,
            outputPieces,
            piecesPerBox,
            outputCartons,
            loosePieces: outputPieces % piecesPerBox,
            paperCoreKg,
            cartonsUsed,
            filmKg,
            operatorName,
            status,
            createdAt: new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            state.productionJobs[existingIndex] = jobObj;
            updatedCount++;
            logs.push(`Updated Job Card: ${jobCardNo}`);
          } else {
            state.productionJobs.push(jobObj);
            importedCount++;
            logs.push(`Imported Job Card: ${jobCardNo} (${outputCartons} Cartons)`);

            // Also create or update Finished Goods Batch entry
            const fgIndex = state.finishedGoods.findIndex((fg) => fg.jobCardNo.toLowerCase() === jobCardNo.toLowerCase());
            if (fgIndex >= 0) {
              state.finishedGoods[fgIndex] = {
                ...state.finishedGoods[fgIndex],
                tapeWidth,
                tapeType,
                tapeLengthMtr,
                totalPieces: outputPieces,
                availablePieces: outputPieces,
                piecesPerBox,
                totalCartons: outputCartons,
                availableCartons: outputCartons,
              };
            } else {
              state.finishedGoods.push({
                id: `fg-${Date.now()}-${idx + 1}`,
                jobCardNo,
                productionDate: date,
                tapeWidth,
                tapeType,
                tapeLengthMtr,
                totalPieces: outputPieces,
                availablePieces: outputPieces,
                piecesPerBox,
                totalCartons: outputCartons,
                availableCartons: outputCartons,
                loosePieces: outputPieces % piecesPerBox,
                status: 'Available',
                createdAt: new Date().toISOString(),
              });
            }
          }
        });
        break;
      }

      // -------------------------------------------------------------
      // 8. SALES ORDERS & DISPATCHES
      // -------------------------------------------------------------
      case 'salesOrders': {
        if (mode === 'replace_all') {
          state.salesOrders = [];
          logs.push('Cleared existing sales orders.');
        }

        data.forEach((row, idx) => {
          const invoiceNo = row['invoiceno'] || row['invoice'] || row['billno'] || `INV-${Date.now()}-${idx + 1}`;
          const date = row['date'] || row['invoicedate'] || new Date().toISOString().slice(0, 10);
          const buyerName = row['buyername'] || row['buyer'] || row['customer'] || 'ABC Traders';
          const tapeType = (row['tapetype'] || row['type'] || 'Plain Bopp Tape') as TapeType;
          const tapeWidth = (row['tapewidth'] || row['width'] || '24 mm') as TapeWidth;
          const cartonsSold = parseInt(row['cartonssold'] || row['cartons'] || '5', 10) || 5;
          const piecesSold = parseInt(row['piecessold'] || row['pieces'] || `${cartonsSold * 48}`, 10) || cartonsSold * 48;
          const ratePerBox = parseFloat(row['rateperbox'] || row['ratebox'] || row['rate'] || '1200') || 1200;
          const saleValue = parseFloat(row['totalsalevalue'] || row['salevalue'] || row['total'] || `${cartonsSold * ratePerBox}`) || (cartonsSold * ratePerBox);
          const amountReceived = parseFloat(row['amountreceived'] || row['received'] || `${saleValue}`) || saleValue;
          const paymentStatus = (row['paymentstatus'] || (amountReceived >= saleValue ? 'Paid' : amountReceived > 0 ? 'Partial' : 'Pending')) as 'Paid' | 'Partial' | 'Pending';
          const vehicleNumber = row['vehicleno'] || row['vehiclenumber'] || '';
          const status = (row['status'] === 'Cancelled' ? 'Cancelled' : 'Dispatched') as 'Dispatched' | 'Cancelled';

          const existingIndex = state.salesOrders.findIndex((s) => s.invoiceNo.toLowerCase() === invoiceNo.toLowerCase());

          const saleObj: SaleOrder = {
            id: existingIndex >= 0 ? state.salesOrders[existingIndex].id : `sale-${Date.now()}-${idx + 1}`,
            invoiceNo,
            date,
            buyerName,
            tapeType,
            tapeWidth,
            cartonsSold,
            piecesSold,
            ratePerBox,
            saleValue,
            amountReceived,
            paymentStatus,
            payments: [
              {
                id: `pay-${Date.now()}-${idx + 1}`,
                date,
                amount: amountReceived,
                paymentMode: 'Bank Transfer / NEFT / RTGS',
                referenceNo: 'CSV Import Inward',
                recordedBy: userEmail,
                notes: 'Imported via CSV record update',
              },
            ],
            vehicleNumber,
            status,
            createdAt: new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            state.salesOrders[existingIndex] = saleObj;
            updatedCount++;
            logs.push(`Updated Sales Invoice: ${invoiceNo}`);
          } else {
            state.salesOrders.push(saleObj);
            importedCount++;
            logs.push(`Imported Sales Invoice: ${invoiceNo} (Rs ${saleValue})`);
          }
        });
        break;
      }

      // -------------------------------------------------------------
      // 9. INVENTORY ADJUSTMENTS
      // -------------------------------------------------------------
      case 'inventoryAdjustments': {
        if (mode === 'replace_all') {
          state.inventoryAdjustments = [];
          logs.push('Cleared existing adjustments.');
        }

        data.forEach((row, idx) => {
          const date = row['date'] || new Date().toISOString().slice(0, 10);
          const category = (row['category'] || 'Roll Tape') as any;
          const itemIdentifier = row['itemidentifier'] || row['item'] || row['rollid'] || 'Stock Audit Item';
          const systemQty = parseFloat(row['systemquantity'] || row['systemqty'] || '100') || 100;
          const physicalQty = parseFloat(row['physicalquantity'] || row['physicalqty'] || '98') || 98;
          const diff = parseFloat(row['difference'] || `${physicalQty - systemQty}`) || (physicalQty - systemQty);
          const unit = row['unit'] || 'Kg';
          const reason = row['reason'] || 'Physical Stock Audit Reconciliation';
          const adjustedBy = row['adjustedby'] || userEmail;
          const remarks = row['remarks'] || '';

          const adj: InventoryAdjustmentRecord = {
            id: `adj-${Date.now()}-${idx + 1}`,
            date,
            category,
            itemIdentifier,
            systemQty,
            physicalQty,
            differenceQty: diff,
            unit,
            reason,
            adjustedBy,
            remarks,
            createdAt: new Date().toISOString(),
          };

          state.inventoryAdjustments.push(adj);
          importedCount++;
          logs.push(`Recorded Adjustment: ${category} - ${itemIdentifier} (${diff > 0 ? '+' : ''}${diff} ${unit})`);
        });
        break;
      }

      // -------------------------------------------------------------
      // 10. USERS
      // -------------------------------------------------------------
      case 'users': {
        if (mode === 'replace_all') {
          // Keep current active user to avoid locking out
          state.users = state.users.filter((u) => u.email.toLowerCase() === userEmail.toLowerCase());
          logs.push(`Retained active user ${userEmail} and cleared other user accounts.`);
        }

        data.forEach((row, idx) => {
          const name = row['name'] || row['fullname'] || `User ${idx + 1}`;
          const email = (row['email'] || row['emailaddress'] || '').toLowerCase();
          if (!email) {
            skippedCount++;
            errors.push(`Row ${idx + 2}: Email is required for user import. Skipped.`);
            return;
          }

          const username = row['username'] || email.split('@')[0] || `user_${idx + 1}`;
          const role = (row['role'] || 'Production Manager') as any;
          const passwordHash = row['password'] || row['pass'] || row['passwordhash'] || 'user123';
          const status = (row['status'] === 'Suspended' || row['status'] === 'Inactive' ? row['status'] : 'Active') as any;

          const existingIndex = state.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());

          if (existingIndex >= 0) {
            state.users[existingIndex] = {
              ...state.users[existingIndex],
              name,
              username,
              role,
              passwordHash,
              status,
              isActive: status === 'Active',
            };
            updatedCount++;
            logs.push(`Updated user: ${name} (${username})`);
          } else {
            const newUser: User = {
              id: `usr-${Date.now()}-${idx + 1}`,
              name,
              username,
              email,
              role,
              passwordHash,
              status,
              isActive: status === 'Active',
              createdAt: new Date().toISOString(),
            };
            state.users.push(newUser);
            importedCount++;
            logs.push(`Imported user: ${name} (${role})`);
          }
        });
        break;
      }
    }

    // Save updated state and add audit log
    dbService.saveState(state);
    dbService.logAudit(
      userEmail,
      `CSV Import: ${sectionKey} (${importedCount} new, ${updatedCount} updated, mode: ${mode})`,
      'Data Management'
    );

    return {
      success: true,
      importedCount,
      updatedCount,
      skippedCount,
      errors,
      logs,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount,
      updatedCount,
      skippedCount,
      errors: [err?.message || 'Unexpected error while parsing and updating database state.'],
      logs,
    };
  }
}
