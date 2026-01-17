
import React, { useState } from 'react';
import { User, UserRole, ReceiptInventory, ReceiptOrder, WarehouseStock, OrderStatus, ReceiptType, WarehouseItem, SupplierOrder, SupplierOrderStatus } from './types';
import { INITIAL_USERS, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_WAREHOUSE } from './constants';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import BranchDashboard from './components/BranchDashboard';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [inventory, setInventory] = useState<ReceiptInventory[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<ReceiptOrder[]>(INITIAL_ORDERS);
  const [warehouse, setWarehouse] = useState<WarehouseStock>(INITIAL_WAREHOUSE);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);

  const handleLogin = (username: string) => {
    const found = users.find(u => u.username === username);
    if (found) setUser(found);
    else alert('Invalid username. Try "admin", or any created branch username.');
  };

  const handleLogout = () => setUser(null);

  const handleAddBranch = (branchName: string, company: string, username: string, tinNumber?: string) => {
    const newBranch: User = {
      id: `br_${Date.now()}`,
      username,
      role: UserRole.BRANCH,
      branchName,
      company,
      tinNumber
    };
    setUsers(prev => [...prev, newBranch]);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    setInventory(prev => prev.map(inv => inv.branchId === userId ? { ...inv, company: updates.company || inv.company } : inv));
  };

  const updateLastUsed = (branchId: string, type: ReceiptType, newLastUsed: number, updateDate: string, loggedBy?: string) => {
    setInventory(prev => prev.map(inv => {
      if (inv.branchId === branchId && inv.type === type) {
        const consumed = newLastUsed - inv.lastUsedNumber;
        return {
          ...inv,
          lastUsedNumber: newLastUsed,
          remainingStock: Math.max(0, inv.remainingStock - consumed),
          lastUpdateDate: updateDate,
          lastUpdatedBy: loggedBy
        };
      }
      return inv;
    }));
  };

  const requestReceipts = (branchId: string, company: string, branchName: string, type: ReceiptType, units: number) => {
    const newOrder: ReceiptOrder = {
      id: `ord_${Date.now()}`,
      branchId,
      branchName,
      company,
      type,
      quantityUnits: units,
      status: OrderStatus.PENDING,
      requestDate: new Date().toISOString().split('T')[0]
    };

    setWarehouse(prev => {
      const branchItems = prev[branchId] || [];
      const hasConfig = branchItems.some(i => i.type === type);
      if (hasConfig) return prev;

      const receiptsPerUnit = type === ReceiptType.SALES_INVOICE ? 500 : 50;
      const unitLabel = type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet';
      
      return {
        ...prev,
        [branchId]: [...branchItems, { branchId, type, totalUnits: 0, receiptsPerUnit, unitLabel }]
      };
    });

    setOrders(prev => [newOrder, ...prev]);
  };

  const updateRequest = (orderId: string, type: ReceiptType, units: number) => {
    setOrders(prev => {
      const targetOrder = prev.find(o => o.id === orderId);
      if (!targetOrder) return prev;

      setWarehouse(v => {
        const branchItems = v[targetOrder.branchId] || [];
        if (branchItems.some(i => i.type === type)) return v;
        const receiptsPerUnit = type === ReceiptType.SALES_INVOICE ? 500 : 50;
        const unitLabel = type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet';
        return {
          ...v,
          [targetOrder.branchId]: [...branchItems, { branchId: targetOrder.branchId, type, totalUnits: 0, receiptsPerUnit, unitLabel }]
        };
      });

      return prev.map(o => (o.id === orderId && o.status === OrderStatus.PENDING) ? { ...o, type, quantityUnits: units } : o);
    });
  };

  const confirmReceipt = (orderId: string, receivedBy: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== OrderStatus.DELIVERED) return;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.RECEIVED, receivedBy } : o));

    const branchItems = warehouse[order.branchId] || [];
    const itemConfig = branchItems.find(i => i.type === order.type);
    const unitsPerPack = itemConfig?.receiptsPerUnit || (order.type === ReceiptType.SALES_INVOICE ? 500 : 50); 

    const totalReceipts = order.quantityUnits * unitsPerPack;
    const endSeries = order.seriesEnd || 0;

    setInventory(prev => {
      const existing = prev.find(i => i.branchId === order.branchId && i.type === order.type);
      const threshold = order.type === ReceiptType.SALES_INVOICE ? 5000 : 250;

      if (existing) {
        return prev.map(i => (i.branchId === order.branchId && i.type === order.type) ? {
          ...i,
          currentSeriesEnd: endSeries,
          remainingStock: i.remainingStock + totalReceipts,
          threshold: threshold,
          lastUpdateDate: new Date().toISOString().split('T')[0]
        } : i);
      } else {
        const startSeries = order.seriesStart || 0;
        return [...prev, {
          branchId: order.branchId,
          company: order.company,
          type: order.type,
          currentSeriesStart: startSeries,
          currentSeriesEnd: endSeries,
          lastUsedNumber: startSeries - 1,
          remainingStock: totalReceipts,
          threshold: threshold,
          lastUpdateDate: new Date().toISOString().split('T')[0]
        }];
      }
    });
  };

  const approveOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.APPROVED } : o));
  };

  const shipOrder = (orderId: string, startSeries: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const branchStock = warehouse[order.branchId] || [];
    const item = branchStock.find(i => i.type === order.type);
    
    if (!item || item.totalUnits < order.quantityUnits) {
      alert(`Insufficient stock in ${order.branchName}'s warehouse allocation.`);
      return;
    }

    const unitsPerPack = item.receiptsPerUnit;
    const totalReceipts = order.quantityUnits * unitsPerPack;
    const endSeries = startSeries + totalReceipts - 1;

    setWarehouse(prev => ({
      ...prev,
      [order.branchId]: (prev[order.branchId] || []).map(i => 
        i.type === order.type 
          ? { ...i, totalUnits: i.totalUnits - order.quantityUnits } 
          : i
      )
    }));

    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      status: OrderStatus.IN_TRANSIT, 
      seriesStart: startSeries,
      seriesEnd: endSeries
    } : o));
  };

  const markAsDelivered = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      status: OrderStatus.DELIVERED,
      deliveryDate: new Date().toISOString().split('T')[0]
    } : o));
  };

  const handleReplenishWarehouse = (branchId: string, type: ReceiptType, units: number) => {
    setWarehouse(prev => {
      const branchItems = prev[branchId] || [];
      const existingItem = branchItems.find(i => i.type === type);
      
      if (existingItem) {
        return {
          ...prev,
          [branchId]: branchItems.map(i => i.type === type ? { ...i, totalUnits: i.totalUnits + units } : i)
        };
      } else {
        const receiptsPerUnit = type === ReceiptType.SALES_INVOICE ? 500 : 50;
        const unitLabel = type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet';
        return {
          ...prev,
          [branchId]: [...branchItems, { branchId, type, totalUnits: units, receiptsPerUnit, unitLabel }]
        };
      }
    });
  };

  const requestFromSupplier = (branchId: string, type: ReceiptType, units: number) => {
    const newOrder: SupplierOrder = {
      id: `sup_${Date.now()}`,
      branchId,
      type,
      quantityUnits: units,
      status: SupplierOrderStatus.REQUESTED,
      requestDate: new Date().toISOString().split('T')[0],
      isPaid: false
    };
    setSupplierOrders(prev => [newOrder, ...prev]);
  };

  const updateSupplierOrder = (orderId: string, status: SupplierOrderStatus) => {
    setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const updateSupplierDetails = (orderId: string, updates: Partial<SupplierOrder>) => {
    setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
  };

  const confirmSupplierDelivery = (orderId: string, details: { billingInvoiceNo: string, amount: number, deliveryReceiptNo: string, deliveryDate: string }) => {
    const order = supplierOrders.find(o => o.id === orderId);
    if (!order) return;

    setSupplierOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      ...details, 
      status: SupplierOrderStatus.DELIVERED 
    } : o));

    handleReplenishWarehouse(order.branchId, order.type, order.quantityUnits);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-grow p-4 md:p-8">
        {user.role === UserRole.ADMIN ? (
          <AdminDashboard 
            users={users}
            inventory={inventory} 
            orders={orders} 
            warehouse={warehouse}
            supplierOrders={supplierOrders}
            onApprove={approveOrder}
            onShip={shipOrder}
            onMarkDelivered={markAsDelivered}
            onReplenishWarehouse={handleReplenishWarehouse}
            onRequestFromSupplier={requestFromSupplier}
            onUpdateSupplierStatus={updateSupplierOrder}
            onUpdateSupplierDetails={updateSupplierDetails}
            onConfirmSupplierDelivery={confirmSupplierDelivery}
            onAddBranch={handleAddBranch}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <BranchDashboard 
            user={user} 
            inventory={inventory.filter(i => i.branchId === user.id)}
            orders={orders.filter(o => o.branchId === user.id)}
            onUpdateSeries={updateLastUsed}
            onRequestReceipts={requestReceipts}
            onUpdateRequest={updateRequest}
            onConfirmReceipt={confirmReceipt}
            warehouseConfig={warehouse[user.id] || []}
          />
        )}
      </main>
    </div>
  );
};

export default App;
