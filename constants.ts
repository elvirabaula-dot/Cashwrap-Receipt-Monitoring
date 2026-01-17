
import { UserRole, ReceiptType, OrderStatus, User, ReceiptInventory, ReceiptOrder, WarehouseStock } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', username: 'CW@Admin', role: UserRole.ADMIN },
  { id: '2', username: 'manila_br', role: UserRole.BRANCH, branchName: 'Megamall', company: 'PMCI' },
  { id: '3', username: 'cebu_br', role: UserRole.BRANCH, branchName: 'Seaside Cebu', company: 'PMCI' },
  { id: '4', username: 'davao_br', role: UserRole.BRANCH, branchName: 'SM Davao', company: 'PEHI' },
];

export const INITIAL_INVENTORY: ReceiptInventory[] = [
  { branchId: '2', type: ReceiptType.SALES_INVOICE, company: 'PMCI', currentSeriesStart: 1000, currentSeriesEnd: 5000, lastUsedNumber: 4850, remainingStock: 150, threshold: 5000 },
  { branchId: '2', type: ReceiptType.COLLECTION_RECEIPT, company: 'PMCI', currentSeriesStart: 100, currentSeriesEnd: 500, lastUsedNumber: 300, remainingStock: 200, threshold: 250 },
  { branchId: '3', type: ReceiptType.SALES_INVOICE, company: 'PMCI', currentSeriesStart: 5001, currentSeriesEnd: 10000, lastUsedNumber: 6000, remainingStock: 4000, threshold: 5000 },
  { branchId: '4', type: ReceiptType.SERVICE_INVOICE, company: 'PEHI', currentSeriesStart: 20000, currentSeriesEnd: 25000, lastUsedNumber: 24900, remainingStock: 100, threshold: 250 },
];

export const INITIAL_ORDERS: ReceiptOrder[] = [
  { id: 'ord_1', branchId: '2', branchName: 'Megamall', company: 'PMCI', type: ReceiptType.SALES_INVOICE, quantityUnits: 5, status: OrderStatus.PENDING, requestDate: '2023-10-25' },
];

export const INITIAL_WAREHOUSE: WarehouseStock = {
  '2': [
    { type: ReceiptType.SALES_INVOICE, branchId: '2', totalUnits: 15, receiptsPerUnit: 500, unitLabel: 'Box' },
    { type: ReceiptType.COLLECTION_RECEIPT, branchId: '2', totalUnits: 20, receiptsPerUnit: 50, unitLabel: 'Booklet' }
  ],
  '3': [
    { type: ReceiptType.SALES_INVOICE, branchId: '3', totalUnits: 10, receiptsPerUnit: 500, unitLabel: 'Box' },
    { type: ReceiptType.DELIVERY_RECEIPT, branchId: '3', totalUnits: 30, receiptsPerUnit: 50, unitLabel: 'Booklet' }
  ],
  '4': [
    { type: ReceiptType.SERVICE_INVOICE, branchId: '4', totalUnits: 25, receiptsPerUnit: 50, unitLabel: 'Booklet' }
  ]
};
