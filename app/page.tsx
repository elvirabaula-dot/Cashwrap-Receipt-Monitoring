
'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, ReceiptInventory, ReceiptOrder, WarehouseStock, OrderStatus, ReceiptType, SupplierOrder, SupplierOrderStatus, WarehouseItem } from '../types';
import { INITIAL_USERS, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_WAREHOUSE } from '../constants';
import Login from '../components/Login';
import AdminDashboard from '../components/AdminDashboard';
import BranchDashboard from '../components/BranchDashboard';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [inventory, setInventory] = useState<ReceiptInventory[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<ReceiptOrder[]>(INITIAL_ORDERS);
  const [warehouse, setWarehouse] = useState<WarehouseStock>(INITIAL_WAREHOUSE);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useEffect(() => {
    const syncAllTables = async () => {
      setIsCloudSyncing(true);
      try {
        // 1. Sync User Accounts
        const { data: userData } = await supabase.from('User-Accounts').select('*');
        if (userData && userData.length > 0) setUsers(userData as unknown as User[]);

        // 2. Sync Branch Inventory
        const { data: invData } = await supabase.from('Cashwrap-Receipt').select('*');
        if (invData && invData.length > 0) setInventory(invData as unknown as ReceiptInventory[]);

        // 3. Sync Supplier Orders
        const { data: supData } = await supabase.from('Supplier-Orders').select('*');
        if (supData && supData.length > 0) setSupplierOrders(supData as unknown as SupplierOrder[]);

        // 4. Sync Logistics Tracking
        const { data: logData } = await supabase.from('Logistics-Tracking').select('*');
        if (logData && logData.length > 0) setLogistics(logData);

        // 5. Sync Warehouse Stocks
        const { data: whData } = await supabase.from('Warehouse-Inventory').select('*');
        if (whData && whData.length > 0) {
          const grouped: WarehouseStock = {};
          whData.forEach((item: any) => {
            if (!grouped[item.branchId]) grouped[item.branchId] = [];
            grouped[item.branchId].push(item as WarehouseItem);
          });
          setWarehouse(grouped);
        }
      } catch (e) {
        console.error("Master Sync error:", e);
      } finally {
        setIsCloudSyncing(false);
      }
    };

    syncAllTables();
  }, []);

  const handleLogin = (username: string) => {
    const found = users.find(u => u.username === username);
    if (found) setUser(found);
    else alert('Invalid Credentials.');
  };

  const handleLogout = () => setUser(null);

  const handleAddBranch = async (branchName: string, company: string, username: string) => {
    const newBranch: User = { id: `br_${Date.now()}`, username, role: UserRole.BRANCH, branchName, company };
    
    // Cloud persistent save
    await supabase.from('User-Accounts').insert([newBranch]);
    setUsers(prev => [...prev, newBranch]);
  };

  const handleShipOrder = async (orderId: string, startSeries: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const perUnit = o.type === ReceiptType.SALES_INVOICE ? 500 : 50;
        const total = o.quantityUnits * perUnit;
        const endSeries = startSeries + total - 1;
        
        supabase.from('Logistics-Tracking').insert([{
          orderId,
          branchId: o.branchId,
          type: o.type,
          quantityUnits: o.quantityUnits,
          seriesStart: startSeries,
          seriesEnd: endSeries,
          status: 'IN_TRANSIT',
          dispatchDate: new Date().toISOString()
        }]).then();

        return { ...o, status: OrderStatus.IN_TRANSIT, seriesStart: startSeries, seriesEnd: endSeries };
      }
      return o;
    }));
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="bg-slate-900 px-4 py-1 flex justify-center gap-4 border-b border-slate-800">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Cloud Infrastructure: 
          <span className={isCloudSyncing ? "text-amber-500 ml-2" : "text-green-500 ml-2"}>
            {isCloudSyncing ? "Synchronizing Enterprise Tables..." : "Active: Accounts • Inventory • Warehouse • Supplier • Logistics"}
          </span>
        </span>
      </div>

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
              const newOrder: SupplierOrder = { id: `SUP-${Date.now()}`, branchId: b, type: t, quantityUnits: u, status: SupplierOrderStatus.REQUESTED, requestDate: new Date().toISOString() };
              setSupplierOrders(p => [newOrder, ...p]);
            }}
            onUpdateSupplierStatus={(id, s) => setSupplierOrders(p => p.map(o => o.id === id ? {...o, status: s} : o))}
            onUpdateSupplierDetails={(id, up) => setSupplierOrders(p => p.map(o => o.id === id ? { ...o, ...up } : o))}
            onConfirmSupplierDelivery={(id, details) => setSupplierOrders(p => p.map(o => o.id === id ? { ...o, ...details, status: SupplierOrderStatus.DELIVERED } : o))}
            onAddBranch={handleAddBranch}
            onUpdateUser={(id, up) => setUsers(p => p.map(u => u.id === id ? {...u, ...up} : u))}
            onDeleteUser={(id) => setUsers(p => p.filter(u => u.id !== id))}
          />
        ) : (
          <BranchDashboard 
            user={user} 
            inventory={inventory.filter(i => i.branchId === user.id)}
            orders={orders.filter(o => o.branchId === user.id)}
            onUpdateSeries={(bid, type, num, date, by) => {
              setInventory(p => p.map(inv => (inv.branchId === bid && inv.type === type) ? { ...inv, lastUsedNumber: num, remainingStock: Math.max(0, inv.remainingStock - (num - inv.lastUsedNumber)), lastUpdateDate: date, lastUpdatedBy: by } : inv));
            }}
            onRequestReceipts={(bid, comp, bname, type, units) => {
              const o: ReceiptOrder = { id: `ord_${Date.now()}`, branchId: bid, branchName: bname, company: comp, type, quantityUnits: units, status: OrderStatus.PENDING, requestDate: new Date().toISOString() };
              setOrders(p => [o, ...p]);
            }}
            onUpdateRequest={(id, t, u) => setOrders(p => p.map(o => o.id === id ? { ...o, type: t, quantityUnits: u } : o))}
            onConfirmReceipt={(id, by) => {
              setOrders(p => p.map(x => x.id === id ? {...x, status: OrderStatus.RECEIVED, receivedBy: by} : x));
            }}
            warehouseConfig={warehouse[user.id] || []}
          />
        )}
      </main>
    </div>
  );
}
