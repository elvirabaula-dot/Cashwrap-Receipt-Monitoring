'use client';

import React, { useState } from 'react';
import { User, UserRole, ReceiptInventory, ReceiptOrder, WarehouseStock, OrderStatus, ReceiptType, SupplierOrder, SupplierOrderStatus, WarehouseItem } from '../types';
import { INITIAL_USERS, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_WAREHOUSE } from '../constants';
import Login from '../components/Login';
import AdminDashboard from '../components/AdminDashboard';
import BranchDashboard from '../components/BranchDashboard';
import Navbar from '../components/Navbar';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [inventory, setInventory] = useState<ReceiptInventory[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<ReceiptOrder[]>(INITIAL_ORDERS);
  const [warehouse, setWarehouse] = useState<WarehouseStock>(INITIAL_WAREHOUSE);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (username: string) => {
    const found = users.find(u => u.username === username);
    if (found) setUser(found);
    else alert('Access Denied: Invalid System Credentials.');
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

  /**
   * CRITICAL FIX: Cascading Deletion
   * Removes user, inventory, warehouse, and pending orders in one transaction.
   */
  const handleDeleteBranch = (id: string) => {
    if (confirm('CRITICAL ACTION: This will permanently purge this branch and ALL associated warehouse/inventory data. Proceed?')) {
      setIsLoading(true);
      
      // Atomic state update
      setTimeout(() => {
        setUsers(prev => prev.filter(u => u.id !== id));
        setInventory(prev => prev.filter(inv => inv.branchId !== id));
        setWarehouse(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setOrders(prev => prev.filter(o => o.branchId !== id));
        setSupplierOrders(prev => prev.filter(so => so.branchId !== id));
        
        setIsLoading(false);
      }, 500);
    }
  };

  const handleShipOrder = (orderId: string, startSeries: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const perUnit = o.type === ReceiptType.SALES_INVOICE ? 500 : 50;
        const total = o.quantityUnits * perUnit;
        const end = startSeries + total - 1;
        
        setWarehouse(curr => {
          const branchItems = curr[o.branchId] || [];
          const updatedItems = branchItems.map(item => 
            item.type === o.type ? { ...item, totalUnits: Math.max(0, item.totalUnits - o.quantityUnits) } : item
          );
          return { ...curr, [o.branchId]: updatedItems };
        });

        return { 
          ...o, 
          status: OrderStatus.IN_TRANSIT, 
          seriesStart: startSeries, 
          seriesEnd: end,
          deliveryDate: new Date().toISOString().split('T')[0]
        };
      }
      return o;
    }));
  };

  const handleConfirmSupplierDelivery = (orderId: string, details: any) => {
    setSupplierOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        setWarehouse(curr => {
          const branchItems = curr[o.branchId] || [];
          const existing = branchItems.find(i => i.type === o.type);
          let updatedItems: WarehouseItem[];
          
          if (existing) {
            updatedItems = branchItems.map(i => i.type === o.type ? { ...i, totalUnits: i.totalUnits + o.quantityUnits } : i);
          } else {
            updatedItems = [...branchItems, {
              type: o.type,
              branchId: o.branchId,
              totalUnits: o.quantityUnits,
              receiptsPerUnit: o.type === ReceiptType.SALES_INVOICE ? 500 : 50,
              unitLabel: o.type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet'
            }];
          }
          return { ...curr, [o.branchId]: updatedItems };
        });
        return { ...o, ...details, status: SupplierOrderStatus.DELIVERED };
      }
      return o;
    }));
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[300] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">Syncing Enterprise Records...</p>
          </div>
        </div>
      )}

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {user.role === UserRole.ADMIN ? (
          <AdminDashboard 
            users={users}
            inventory={inventory} 
            orders={orders} 
            warehouse={warehouse}
            supplierOrders={supplierOrders}
            onApprove={(id) => setOrders(p => p.map(o => o.id === id ? {...o, status: OrderStatus.APPROVED} : o))}
            onShip={handleShipOrder}
            onMarkDelivered={(id) => setOrders(p => p.map(o => o.id === id ? {...o, status: OrderStatus.DELIVERED} : o))}
            onReplenishWarehouse={() => {}} 
            onRequestFromSupplier={(b, t, u) => {
              const newOrder: SupplierOrder = {
                id: `SUP-${Date.now()}`,
                branchId: b,
                type: t,
                quantityUnits: u,
                status: SupplierOrderStatus.REQUESTED,
                requestDate: new Date().toISOString().split('T')[0]
              };
              setSupplierOrders(p => [newOrder, ...p]);
            }}
            onUpdateSupplierStatus={(id, s) => setSupplierOrders(p => p.map(o => o.id === id ? {...o, status: s} : o))}
            onUpdateSupplierDetails={(id, up) => setSupplierOrders(p => p.map(o => o.id === id ? { ...o, ...up } : o))}
            onConfirmSupplierDelivery={handleConfirmSupplierDelivery}
            onAddBranch={handleAddBranch}
            onUpdateUser={(id, up) => setUsers(p => p.map(u => u.id === id ? {...u, ...up} : u))}
            onDeleteUser={handleDeleteBranch}
          />
        ) : (
          <BranchDashboard 
            user={user} 
            inventory={inventory.filter(i => i.branchId === user.id)}
            orders={orders.filter(o => o.branchId === user.id)}
            onUpdateSeries={(bid, type, num, date, by) => {
              setInventory(p => p.map(inv => (inv.branchId === bid && inv.type === type) ? {
                ...inv,
                lastUsedNumber: num,
                remainingStock: Math.max(0, inv.remainingStock - (num - inv.lastUsedNumber)),
                lastUpdateDate: date,
                lastUpdatedBy: by
              } : inv));
            }}
            onRequestReceipts={(bid, comp, bname, type, units) => {
              const o: ReceiptOrder = {
                id: `ord_${Date.now()}`,
                branchId: bid,
                branchName: bname,
                company: comp,
                type,
                quantityUnits: units,
                status: OrderStatus.PENDING,
                requestDate: new Date().toISOString().split('T')[0]
              };
              setOrders(p => [o, ...p]);
            }}
            onUpdateRequest={(id, t, u) => setOrders(p => p.map(o => o.id === id ? { ...o, type: t, quantityUnits: u } : o))}
            onConfirmReceipt={(id, by) => {
              const o = orders.find(x => x.id === id);
              if(!o) return;
              setOrders(p => p.map(x => x.id === id ? {...x, status: OrderStatus.RECEIVED, receivedBy: by} : x));
              setInventory(p => {
                const ex = p.find(i => i.branchId === o.branchId && i.type === o.type);
                const add = o.quantityUnits * (o.type === ReceiptType.SALES_INVOICE ? 500 : 50);
                if(ex) return p.map(i => i.branchId === o.branchId && i.type === o.type ? {...i, currentSeriesEnd: o.seriesEnd || i.currentSeriesEnd, remainingStock: i.remainingStock + add} : i);
                return [...p, { branchId: o.branchId, company: o.company, type: o.type, currentSeriesStart: o.seriesStart || 0, currentSeriesEnd: o.seriesEnd || 0, lastUsedNumber: (o.seriesStart||1)-1, remainingStock: add, threshold: 500 }];
              });
            }}
            warehouseConfig={warehouse[user.id] || []}
          />
        )}
      </main>
    </div>
  );
}