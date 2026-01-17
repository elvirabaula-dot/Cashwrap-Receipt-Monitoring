
export enum UserRole {
  ADMIN = 'ADMIN',
  BRANCH = 'BRANCH'
}

export enum ReceiptType {
  SALES_INVOICE = 'Sales Invoice',
  COLLECTION_RECEIPT = 'Collection Receipt',
  DELIVERY_RECEIPT = 'Delivery Receipt',
  SERVICE_INVOICE = 'Service Invoice'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum SupplierOrderStatus {
  REQUESTED = 'REQUESTED',
  PROCESSED = 'PROCESSED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  branchName?: string;
  company?: string;
  tinNumber?: string;
}

export interface ReceiptInventory {
  branchId: string;
  company: string;
  type: ReceiptType;
  currentSeriesStart: number;
  currentSeriesEnd: number;
  lastUsedNumber: number;
  remainingStock: number;
  threshold: number;
  lastUpdateDate?: string;
  lastUpdatedBy?: string;
}

export interface ReceiptOrder {
  id: string;
  branchId: string;
  branchName: string;
  company: string;
  type: ReceiptType;
  quantityUnits: number; // Boxes or Booklets
  status: OrderStatus;
  requestDate: string;
  deliveryDate?: string;
  seriesStart?: number;
  seriesEnd?: number;
  receivedBy?: string;
}

export interface SupplierOrder {
  id: string;
  branchId: string;
  type: ReceiptType;
  quantityUnits: number;
  status: SupplierOrderStatus;
  requestDate: string;
  billingInvoiceNo?: string;
  amount?: number;
  deliveryReceiptNo?: string;
  deliveryDate?: string;
  prfNumber?: string;
  isPaid?: boolean;
}

export interface WarehouseItem {
  type: ReceiptType;
  branchId: string;
  totalUnits: number;
  receiptsPerUnit: number;
  unitLabel: 'Box' | 'Booklet';
}

export interface WarehouseStock {
  [branchId: string]: WarehouseItem[];
}
