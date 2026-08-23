export type Role = 'Admin' | 'Inventory User' | 'Production User' | 'Sales User' | 'Viewer' | 'Super Admin' | 'Production Manager' | 'Inventory Manager' | 'Sales Manager';
export type UserRole = Role;

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string; // Stored securely
  isActive: boolean;
  status?: 'Active' | 'Suspended' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
}

export type JumboRollType =
  | 'Plain-Transparent'
  | 'Plain-Brown'
  | 'Plain-Colour'
  | 'Printed-Single-Colour'
  | 'Printed-Double-Colour';

export type RollWidth = '1315 mm' | '1020 mm';

export type Thickness =
  | '38 Microns'
  | '40 Microns'
  | '42 Microns'
  | '44 Microns'
  | '46 Microns'
  | '48 Microns'
  | '50 Microns'
  | '52 Microns';

export type PaperCoreThickness = '3 mm' | '3.5 mm';

export type RollStatus = 'Available' | 'Partially Used' | 'Fully Used';

export interface RollTapePurchase {
  id: string;
  rollId: string; // Unique Roll Identification Number
  jumboRollType: JumboRollType;
  purchasedDate: string;
  supplierId: string;
  supplierName: string;
  rollWidth: RollWidth;
  thickness: Thickness;
  originalWeight: number; // in Kg
  availableWeight: number; // in Kg
  originalLength: number; // in Meter
  availableLength: number; // in Meter
  cost: number; // in INR
  status: RollStatus;
  createdBy: string;
  createdAt: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

export interface PaperCorePurchase {
  id: string;
  purchasedDate: string;
  supplierId: string;
  supplierName: string;
  rollWidth: '1020 mm';
  thickness: PaperCoreThickness;
  weight: number; // in Kg
  availableWeight: number; // in Kg
  cost: number; // in INR
  createdBy: string;
  createdAt: string;
}

export interface CartonBoxPurchase {
  id: string;
  purchasedDate: string;
  supplierId: string;
  supplierName: string;
  boxCount: number; // in Nos
  cost: number; // in INR
  createdBy: string;
  createdAt: string;
}

export interface HeatShrinkFilmPurchase {
  id: string;
  purchasedDate: string;
  supplierId: string;
  supplierName: string;
  weight: number; // in Kg
  cost: number; // in INR
  createdBy: string;
  createdAt: string;
}

export type TapeWidth = '24 mm' | '48 mm' | '60 mm' | '72 mm';

export type TapeType =
  | 'Plain-Transparent'
  | 'Plain-Brown'
  | 'Plain-Colour'
  | 'Printed-Single-Colour'
  | 'Printed-Double-Colour'
  | 'Printed-Transparent'
  | 'Printed-Brown'
  | 'Printed-Colour-Background';

export interface PackingRule {
  tapeWidth: TapeWidth;
  piecesPerCarton: number;
}

export interface ProductionRollUsage {
  rollId: string;
  openingWeight: number;
  weightUsed: number;
  closingWeight: number;
  openingLength?: number;
  lengthUsed?: number;
  closingLength?: number;
}

export interface ProductionOutput {
  id: string;
  tapeWidth: TapeWidth;
  tapeType: TapeType;
  quantity: number; // in Pieces
  cartonsCalculated: number;
  piecesPerCarton: number;
}

export type ProductionJobStatus = 'Completed' | 'Cancelled';

export interface ProductionJob {
  id: string;
  jobCardNo: string; // Unique
  productionDate: string;
  rollsUsed: ProductionRollUsage[];
  paperCoreUsedKg: number;
  paperCoreBeforeKg?: number;
  paperCoreAfterKg?: number;
  cartonBoxesUsed: number;
  cartonBoxesBefore?: number;
  cartonBoxesAfter?: number;
  heatShrinkFilmUsedKg: number;
  heatShrinkFilmBeforeKg?: number;
  heatShrinkFilmAfterKg?: number;
  outputs: ProductionOutput[];
  totalPieces: number;
  totalCartons: number;
  status: ProductionJobStatus;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface FinishedGoodsItem {
  id: string;
  productionDate: string;
  jobCardNo: string;
  tapeWidth: TapeWidth;
  tapeType: TapeType;
  quantity: number; // Pieces produced originally
  availableQuantity: number; // Pieces currently available
  cartonsCount: number; // initial cartons
  availableCartons: number; // current calculated cartons
  createdBy: string;
  createdAt: string;
}

export interface FinishedGoodsSummary {
  tapeWidth: TapeWidth;
  tapeType: TapeType;
  piecesPerCarton: number;
  totalPieces: number;
  totalCartons: number;
}

export type SaleUnit = 'Cartons' | 'Pieces';

export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export type PaymentMode =
  | 'Bank Transfer / NEFT / RTGS'
  | 'UPI'
  | 'Cheque'
  | 'Cash'
  | 'Demand Draft';

export interface PaymentReceipt {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode | string;
  referenceNo?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface SaleOrder {
  id: string;
  saleInvoiceNo: string; // Unique
  saleDate: string;
  buyerId: string;
  buyerName: string;
  buyerAddress?: string;
  buyerPhone?: string;
  tapeWidth: TapeWidth;
  tapeType: TapeType;
  saleUnit: SaleUnit;
  cartonsSold: number;
  piecesSold: number;
  piecesPerCarton: number;
  saleValue: number; // in INR
  amountReceived?: number; // in INR
  balanceDue?: number; // in INR
  paymentStatus?: PaymentStatus; // 'Paid' | 'Partial' | 'Pending'
  paymentMode?: PaymentMode | string;
  paymentReference?: string;
  paymentDate?: string;
  paymentRemarks?: string;
  payments?: PaymentReceipt[];
  status: 'Completed' | 'Cancelled';
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export type TransactionType =
  | 'Purchase'
  | 'Production Consumption'
  | 'Production Output'
  | 'Sales'
  | 'Inventory Adjustment'
  | 'Cancellation/Reversal';

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  transactionType: TransactionType;
  category: 'Roll Tape' | 'Paper Core' | 'Carton Box' | 'Heat Shrink Film' | 'Finished Goods';
  materialOrProduct: string;
  itemId?: string; // Roll ID, Job No, Sale No, etc.
  referenceNumber: string;
  quantityBefore: number;
  quantityChanged: number; // Positive for addition, negative for reduction
  quantityAfter: number;
  unit: string;
  user: string;
  remarks: string;
  isReversal?: boolean;
  reversalRefId?: string;
}

export interface InventoryAdjustment {
  id: string;
  timestamp: string;
  category: 'Roll Tape' | 'Paper Core' | 'Carton Box' | 'Heat Shrink Film' | 'Finished Goods';
  itemIdentifier: string; // Roll ID or FG Width-Type
  systemQuantity: number;
  physicalQuantity: number;
  adjustmentQuantity: number;
  unit: string;
  reason: string;
  remarks?: string;
  user: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface ApplicationSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGstin: string;
  allowNegativeStockOverride: boolean;
  lowStockThresholds: {
    rollTapeMinRolls: number;
    paperCoreMinKg: number;
    cartonBoxMinCount: number;
    heatShrinkFilmMinKg: number;
    finishedGoodsMinPieces: number;
  };
  packingRules: PackingRule[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  recordId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface DashboardMetrics {
  totalRollTapeAvailableKg: number;
  availableRollCount: number;
  partiallyUsedRollCount: number;
  fullyUsedRollCount: number;
  totalPaperCoreAvailableKg: number;
  totalCartonBoxesAvailable: number;
  totalHeatShrinkFilmAvailableKg: number;
  
  todayProductionPieces: number;
  todayProductionCartons: number;
  weekProductionPieces: number;
  weekProductionCartons: number;
  monthProductionPieces: number;
  monthProductionCartons: number;
  totalJobsCount: number;
  
  totalFinishedGoodsPieces: number;
  totalFinishedGoodsCartons: number;
  
  todaySalesValue: number;
  weekSalesValue: number;
  monthSalesValue: number;
  totalSalesValue: number;
  totalAmountReceived?: number;
  totalOutstandingReceivables?: number;
  totalPiecesSold: number;
  totalCartonsSold: number;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  category: string;
  timestamp: string;
}

export interface AutomatedTestResult {
  id: string;
  testName: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs: number;
}
