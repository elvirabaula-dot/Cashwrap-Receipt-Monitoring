
'use client';

import React, { useState } from 'react';
import { User, ReceiptInventory, ReceiptOrder, OrderStatus, ReceiptType, WarehouseItem } from '../types';

interface BranchDashboardProps {
  user: User;
  inventory: ReceiptInventory[];
  orders: ReceiptOrder[];
  onUpdateSeries: (branchId: string, type: ReceiptType, newLastUsed: number, updateDate: string, loggedBy?: string) => void;
  onRequestReceipts: (branchId: string, company: string, branchName: string, type: ReceiptType, units: number) => void;
  onUpdateRequest: (orderId: string, type: ReceiptType, units: number) => void;
  onConfirmReceipt: (orderId: string, receivedBy: string) => void;
  warehouseConfig: WarehouseItem[];
}

const BranchDashboard: React.FC<BranchDashboardProps> = ({
  user,
  inventory,
  orders,
  onUpdateSeries,
  onRequestReceipts,
  onUpdateRequest,
  onConfirmReceipt,
  warehouseConfig
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [confirmArrivalId, setConfirmArrivalId] = useState<string | null>(null);
  const [receivedByInput, setReceivedByInput] = useState('');
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  
  const [requestType, setRequestType] = useState<ReceiptType>(ReceiptType.SALES_INVOICE);
  const [unitsRequested, setUnitsRequested] = useState(5);
  
  const [selectedTypeForUpdate, setSelectedTypeForUpdate] = useState<ReceiptType | ''>('');
  const [newLastUsed, setNewLastUsed] = useState<string>('');
  const [loggedBy, setLoggedBy] = useState<string>('');
  const [updateDate, setUpdateDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const activeInv = inventory.find(i => i.type === selectedTypeForUpdate);

  const getUnitLabel = (type: ReceiptType) => {
    const config = warehouseConfig.find(w => w.type === type);
    if (config) return config.unitLabel;
    return type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet';
  };

  const getReceiptsPerUnit = (type: ReceiptType) => {
    const config = warehouseConfig.find(w => w.type === type);
    if (config) return config.receiptsPerUnit;
    return type === ReceiptType.SALES_INVOICE ? 500 : 50;
  };

  const handleSeriesUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeForUpdate || !newLastUsed || !updateDate || !loggedBy.trim()) {
      alert("Please ensure all fields including 'Logged By' are filled.");
      return;
    }
    const num = parseInt(newLastUsed);
    if (activeInv && num > activeInv.lastUsedNumber && num <= activeInv.currentSeriesEnd) {
      onUpdateSeries(user.id, selectedTypeForUpdate as ReceiptType, num, updateDate, loggedBy.trim());
      setNewLastUsed('');
      setLoggedBy('');
    } else {
      alert(`Invalid range. Must be between ${activeInv?.lastUsedNumber || 0 + 1} and ${activeInv?.currentSeriesEnd || 0}`);
    }
  };

  const openEditModal = (order: ReceiptOrder) => {
    setEditOrderId(order.id);
    setRequestType(order.type);
    setUnitsRequested(order.quantityUnits);
    setShowRequestModal(true);
  };

  const handleRequestSubmit = () => {
    if (editOrderId) {
      onUpdateRequest(editOrderId, requestType, unitsRequested);
    } else {
      onRequestReceipts(user.id, user.company || '', user.branchName || '', requestType, unitsRequested);
    }
    closeModal();
  };

  const handleArrivalConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmArrivalId && receivedByInput.trim()) {
      onConfirmReceipt(confirmArrivalId, receivedByInput.trim());
      setConfirmArrivalId(null);
      setReceivedByInput('');
    }
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setEditOrderId(null);
    setRequestType(ReceiptType.SALES_INVOICE);
    setUnitsRequested(5);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Branch Portal: {user.branchName}</h2>
          <p className="text-gray-500 font-medium italic">Inventory & Logistics Portal</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-transform hover:scale-105">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Request Stock
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inventory.map(inv => {
              const isLow = inv.remainingStock <= inv.threshold;
              const unitLabel = getUnitLabel(inv.type);
              const perUnit = getReceiptsPerUnit(inv.type);
              return (
                <div key={inv.type} className={`bg-white p-6 rounded-2xl border ${isLow ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} shadow-sm relative transition-colors`}>
                  <div className="flex justify-between items-start">
                    <p className={`text-[10px] font-bold ${isLow ? 'text-red-600' : 'text-indigo-500'} uppercase tracking-widest`}>{inv.type}</p>
                    {isLow && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse uppercase">Low Stock</span>}
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <h3 className={`text-3xl font-black ${isLow ? 'text-red-700' : 'text-gray-900'}`}>{inv.remainingStock.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 font-medium pb-1">{(inv.remainingStock / perUnit).toFixed(1)} {unitLabel}s</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                      <span>REMAINING SERIES:</span>
                      <span className="font-mono">{inv.lastUsedNumber + 1} - {inv.currentSeriesEnd}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Log Consumption</h3>
            <form onSubmit={handleSeriesUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Receipt Type</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={selectedTypeForUpdate}
                    onChange={(e) => setSelectedTypeForUpdate(e.target.value as ReceiptType)}
                    required
                  >
                    <option value="">Select a type...</option>
                    {inventory.map(i => <option key={i.type} value={i.type}>{i.type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Update Date</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={updateDate} onChange={(e) => setUpdateDate(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Last Used Number</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newLastUsed} onChange={(e) => setNewLastUsed(e.target.value)} placeholder={activeInv ? `Currently at ${activeInv.lastUsedNumber}` : 'Enter #'} disabled={!selectedTypeForUpdate} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Logged By</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={loggedBy} onChange={(e) => setLoggedBy(e.target.value)} placeholder="Name of personnel" disabled={!selectedTypeForUpdate} required />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white px-12 py-3 rounded-xl font-bold hover:bg-black transition-colors h-[50px] disabled:opacity-50" disabled={!selectedTypeForUpdate}>
                  Save Update
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-50 font-bold">Recent Logistics</div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[600px]">
            {orders.map(order => (
              <div key={order.id} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-mono uppercase">{order.id}</span>
                  <div className="flex items-center gap-2">
                    {order.status === OrderStatus.PENDING && (
                      <button 
                        onClick={() => openEditModal(order)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>{order.status}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800">{order.type}</p>
                <p className="text-xs text-gray-500">{order.quantityUnits} {getUnitLabel(order.type)}s</p>
                
                {order.status === OrderStatus.DELIVERED && (
                   <button 
                    onClick={() => setConfirmArrivalId(order.id)} 
                    className="w-full mt-2 bg-green-600 text-white py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-green-700 transition-colors"
                  >
                    Confirm Arrival
                  </button>
                )}

                {order.status === OrderStatus.RECEIVED && order.receivedBy && (
                  <p className="text-[10px] text-green-700 font-bold italic mt-1">Received by: {order.receivedBy}</p>
                )}
              </div>
            ))}
            {orders.length === 0 && <div className="p-8 text-center text-gray-400 text-xs italic">No orders yet</div>}
          </div>
        </div>
      </div>

      {/* Arrival Confirmation Modal */}
      {confirmArrivalId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Arrival</h3>
              <p className="text-sm text-gray-500 mt-1">Please enter the name of the person receiving the receipts.</p>
            </div>
            <form onSubmit={handleArrivalConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Receiver's Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. Juan Dela Cruz"
                  value={receivedByInput}
                  onChange={(e) => setReceivedByInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setConfirmArrivalId(null)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">Confirm Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 transform animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{editOrderId ? 'Edit Request' : 'New Inventory Request'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Receipt Type</label>
                <select className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" value={requestType} onChange={(e) => setRequestType(e.target.value as ReceiptType)}>
                  {Object.values(ReceiptType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity ({getUnitLabel(requestType)}s)</label>
                <input type="number" min="1" className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" value={unitsRequested} onChange={(e) => setUnitsRequested(parseInt(e.target.value))} />
                <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Threshold for alert: {requestType === ReceiptType.SALES_INVOICE ? '5000 Receipts' : '250 Receipts'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Total Receipts to be added: {unitsRequested * getReceiptsPerUnit(requestType)}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={closeModal} className="flex-1 py-3 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleRequestSubmit} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  {editOrderId ? 'Update Request' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchDashboard;
