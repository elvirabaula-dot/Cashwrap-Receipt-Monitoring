'use client';

import React, { useState } from 'react';
import { User, UserRole, ReceiptInventory, ReceiptOrder, WarehouseStock, OrderStatus, ReceiptType, SupplierOrder, SupplierOrderStatus } from '../types';
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
    setOrders(prev => [newOrder, ...prev]);
  };

  const approveOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.APPROVED } : o));
  };

  const shipOrder = (orderId: string, startSeries: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const unitsPerPack = order.type === ReceiptType.SALES_INVOICE ? 500 : 50;
    const totalReceipts = order.quantityUnits * unitsPerPack;
    const endSeries = startSeries + totalReceipts - 1;

    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      status: OrderStatus.IN_TRANSIT, 
      seriesStart: startSeries,
      seriesEnd: endSeries
    } : o));
  };

  const markAsDelivered = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DELIVERED } : o));
  };

  const confirmReceipt = (orderId: string, receivedBy: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.RECEIVED, receivedBy } : o));

    setInventory(prev => {
      const existing = prev.find(i => i.branchId === order.branchId && i.type === order.type);
      const perUnit = order.type === ReceiptType.SALES_INVOICE ? 500 : 50;
      const amountToAdd = order.quantityUnits * perUnit;

      if (existing) {
        return prev.map(i => i.branchId === order.branchId && i.type === order.type ? {
          ...i,
          currentSeriesEnd: order.seriesEnd || i.currentSeriesEnd,
          remainingStock: i.remainingStock + amountToAdd,
          lastUpdateDate: new Date().toISOString().split('T')[0]
        } : i);
      }
      return [...prev, {
        branchId: order.branchId,
        company: order.company,
        type: order.type,
        currentSeriesStart: order.seriesStart || 0,
        currentSeriesEnd: order.seriesEnd || 0,
        lastUsedNumber: (order.seriesStart || 1) - 1,
        remainingStock: amountToAdd,
        threshold: order.type === ReceiptType.SALES_INVOICE ? 5000 : 250,
        lastUpdateDate: new Date().toISOString().split('T')[0]
      }];
    });
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
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
            onReplenishWarehouse={(b, t, u) => {}} 
            onRequestFromSupplier={(b, t, u) => {}}
            onUpdateSupplierStatus={(id, s) => {}}
            onUpdateSupplierDetails={(id, up) => {}}
            onConfirmSupplierDelivery={(id, det) => {}}
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
            onUpdateRequest={(id, t, u) => {}}
            onConfirmReceipt={confirmReceipt}
            warehouseConfig={warehouse[user.id] || []}
          />
        )}
      </main>
    </div>
  );
}