
'use client';

import React, { useState } from 'react';
import { ReceiptInventory, ReceiptOrder, WarehouseStock, OrderStatus, ReceiptType, WarehouseItem, UserRole, SupplierOrder, SupplierOrderStatus, User } from '../types';

interface AdminDashboardProps {
  users: User[];
  inventory: ReceiptInventory[];
  orders: ReceiptOrder[];
  warehouse: WarehouseStock;
  supplierOrders: SupplierOrder[];
  onApprove: (id: string) => void;
  onShip: (id: string, startSeries: number) => void;
  onMarkDelivered: (id: string) => void;
  onReplenishWarehouse: (branchId: string, type: ReceiptType, units: number) => void;
  onRequestFromSupplier: (branchId: string, type: ReceiptType, units: number) => void;
  onUpdateSupplierStatus: (orderId: string, status: SupplierOrderStatus) => void;
  onUpdateSupplierDetails: (orderId: string, updates: Partial<SupplierOrder>) => void;
  onConfirmSupplierDelivery: (orderId: string, details: { billingInvoiceNo: string, amount: number, deliveryReceiptNo: string, deliveryDate: string }) => void;
  onAddBranch: (name: string, company: string, username: string, tinNumber?: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users,
  inventory, 
  orders, 
  warehouse, 
  supplierOrders,
  onApprove, 
  onShip,
  onMarkDelivered,
  onReplenishWarehouse,
  onRequestFromSupplier,
  onUpdateSupplierStatus,
  onUpdateSupplierDetails,
  onConfirmSupplierDelivery,
  onAddBranch,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'orders' | 'supplier' | 'billing' | 'accounts'>('home');
  
  // Search States
  const [inventorySearch, setInventorySearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');
  const [accountsSearch, setAccountsSearch] = useState('');
  const [logisticsHistorySearch, setLogisticsHistorySearch] = useState('');
  
  // Interaction States
  const [deliveryInput, setDeliveryInput] = useState<{id: string, start: string} | null>(null);
  const [showSupRequestModal, setShowSupRequestModal] = useState(false);
  const [showSupConfirmModal, setShowSupConfirmModal] = useState<string | null>(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState<User | null>(null);
  const [prfEntryId, setPrfEntryId] = useState<string | null>(null);

  // Form States
  const [newBranchName, setNewBranchName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newTin, setNewTin] = useState('');

  const [editBranchName, setEditBranchName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editTin, setEditTin] = useState('');
  
  const [prfNumberInput, setPrfNumberInput] = useState('');
  const [supBranchId, setSupBranchId] = useState('');
  const [supType, setSupType] = useState<ReceiptType>(ReceiptType.SALES_INVOICE);
  const [supUnits, setSupUnits] = useState(1);
  const [supUnitLabel, setSupUnitLabel] = useState<'Box' | 'Booklet'>('Box');

  const [supBillingNo, setSupBillingNo] = useState('');
  const [supAmount, setSupAmount] = useState<number>(0);
  const [supDRNo, setSupDRNo] = useState('');
  const [supDelDate, setSupDelDate] = useState(new Date().toISOString().split('T')[0]);

  // Helpers
  const getBranchName = (branchId: string) => users.find(u => u.id === branchId)?.branchName || `Branch ${branchId}`;
  const getBranchCompany = (branchId: string) => users.find(u => u.id === branchId)?.company || 'Unknown';
  
  const getBranchInventoryForType = (branchId: string, type: ReceiptType) => 
    inventory.find(i => i.branchId === branchId && i.type === type);
  
  const getBranchLastSeriesForType = (branchId: string, type: ReceiptType) => {
    const inv = getBranchInventoryForType(branchId, type);
    return inv ? inv.currentSeriesEnd : 0;
  };

  const getWarehouseStockForType = (branchId: string, type: ReceiptType) => {
    return (warehouse[branchId] || []).find(i => i.type === type);
  };

  // Fix: Added handleEditUserClick to populate form and show modal
  const handleEditUserClick = (user: User) => {
    setEditUserModal(user);
    setEditBranchName(user.branchName || '');
    setEditCompany(user.company || '');
    setEditUsername(user.username);
    setEditTin(user.tinNumber || '');
  };

  // Fix: Added handleAddBranchSubmit to handle form submission
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBranch(newBranchName, newCompany, newUsername, newTin);
    setShowAddBranchModal(false);
    setNewBranchName('');
    setNewCompany('');
    setNewUsername('');
    setNewTin('');
  };

  // Fix: Added handleUpdateUserSubmit to handle form submission
  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUserModal) {
      onUpdateUser(editUserModal.id, {
        branchName: editBranchName,
        company: editCompany,
        username: editUsername,
        tinNumber: editTin
      });
      setEditUserModal(null);
    }
  };

  // Filter Logic
  const filteredAccounts = users.filter(u => {
    if (u.role === UserRole.ADMIN) return false;
    const query = accountsSearch.toLowerCase();
    return u.branchName?.toLowerCase().includes(query) || u.company?.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
  });

  const filteredInventory = inventory.filter(inv => {
    const query = inventorySearch.toLowerCase();
    const bName = getBranchName(inv.branchId).toLowerCase();
    return bName.includes(query) || inv.company.toLowerCase().includes(query) || inv.type.toLowerCase().includes(query);
  });

  const filteredBillingOrders = supplierOrders.filter(o => {
    if (o.status !== SupplierOrderStatus.DELIVERED) return false;
    const query = billingSearch.toLowerCase();
    const branchName = getBranchName(o.branchId).toLowerCase();
    return branchName.includes(query) || o.billingInvoiceNo?.toLowerCase().includes(query) || o.prfNumber?.toLowerCase().includes(query);
  });

  const activeLogisticsRequests = orders.filter(o => o.status !== OrderStatus.RECEIVED);
  const filteredLogisticsHistory = orders.filter(o => {
    if (o.status !== OrderStatus.RECEIVED) return false;
    const query = logisticsHistorySearch.toLowerCase();
    return o.branchName.toLowerCase().includes(query) || o.type.toLowerCase().includes(query);
  });

  const totalPaid = filteredBillingOrders.reduce((sum, o) => o.isPaid ? sum + (o.amount || 0) : sum, 0);
  const totalUnpaid = filteredBillingOrders.reduce((sum, o) => !o.isPaid ? sum + (o.amount || 0) : sum, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Navigation */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit overflow-x-auto scrollbar-hide">
        {['home', 'supplier', 'billing', 'orders', 'search', 'accounts'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {tab === 'home' ? 'Warehouse' : tab === 'search' ? 'Inventory' : tab === 'orders' ? 'Logistics' : tab}
          </button>
        ))}
      </div>

      {/* Warehouse Tab */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold">Warehouse Stock Allocation</h3>
            <input 
              type="text" 
              placeholder="Filter by branch..." 
              className="block w-full md:w-64 pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              value={warehouseSearch} 
              onChange={(e) => setWarehouseSearch(e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(warehouse).filter(([bid]) => getBranchName(bid).toLowerCase().includes(warehouseSearch.toLowerCase())).map(([branchId, items]) => (
              <div key={branchId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900">{getBranchName(branchId)}</h4>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{getBranchCompany(branchId)}</p>
                </div>
                <div className="space-y-4">
                  {items.map((item, idx) => {
                    const lastEnd = getBranchLastSeriesForType(branchId, item.type);
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{item.type}</p>
                          <p className="text-lg font-black">{item.totalUnits} {item.unitLabel}s</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Starts At</p>
                          <p className="text-xs font-mono font-bold text-indigo-600">#{(lastEnd + 1).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Tab */}
      {activeTab === 'supplier' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Supplier Procurement</h3>
            <button onClick={() => setShowSupRequestModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all">New Procurement</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Branch & Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Request Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {supplierOrders.filter(o => o.status !== SupplierOrderStatus.DELIVERED).map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold">{getBranchName(o.branchId)}</div>
                      <div className="text-[10px] text-indigo-500 uppercase font-bold">{o.type}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">{o.quantityUnits} Units</td>
                    <td className="px-6 py-4 text-gray-500">{o.requestDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${o.status === SupplierOrderStatus.REQUESTED ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {o.status === SupplierOrderStatus.REQUESTED ? (
                        <button onClick={() => onUpdateSupplierStatus(o.id, SupplierOrderStatus.SHIPPED)} className="text-indigo-600 text-xs font-bold hover:underline">Mark Shipped</button>
                      ) : (
                        <button onClick={() => setShowSupConfirmModal(o.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Confirm Delivery</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Paid</p>
              <h4 className="text-2xl font-black text-green-600 mt-1">₱{totalPaid.toLocaleString()}</h4>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding</p>
              <h4 className="text-2xl font-black text-red-600 mt-1">₱{totalUnpaid.toLocaleString()}</h4>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Invoices</p>
              <h4 className="text-2xl font-black text-indigo-600 mt-1">{filteredBillingOrders.length}</h4>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
               <span className="text-xs font-bold text-gray-500 uppercase">Billing Archive</span>
               <input 
                 type="text" 
                 placeholder="Search by invoice or PRF..." 
                 className="text-xs p-2 border rounded-lg w-48 outline-none focus:ring-2 focus:ring-indigo-500"
                 value={billingSearch}
                 onChange={(e) => setBillingSearch(e.target.value)}
               />
             </div>
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b">
                 <tr>
                   <th className="px-6 py-4">Invoice & PRF</th>
                   <th className="px-6 py-4">Branch</th>
                   <th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {filteredBillingOrders.map(o => (
                   <tr key={o.id} className="hover:bg-gray-50/30">
                     <td className="px-6 py-4">
                       <div className="font-mono text-xs font-bold text-gray-800">{o.billingInvoiceNo}</div>
                       {o.prfNumber ? (
                         <div className="text-[10px] text-green-600 font-bold">PRF: {o.prfNumber}</div>
                       ) : (
                         <div className="text-[10px] text-red-500 font-bold italic">Waiting for PRF</div>
                       )}
                     </td>
                     <td className="px-6 py-4">
                        <div className="font-bold">{getBranchName(o.branchId)}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{getBranchCompany(o.branchId)}</div>
                     </td>
                     <td className="px-6 py-4 font-black">₱{o.amount?.toLocaleString()}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${o.isPaid ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {o.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        {!o.prfNumber ? (
                          <button onClick={() => setPrfEntryId(o.id)} className="text-indigo-600 text-xs font-bold hover:underline">Add PRF</button>
                        ) : !o.isPaid ? (
                          <button onClick={() => onUpdateSupplierDetails(o.id, { isPaid: true })} className="text-green-600 text-xs font-bold hover:underline">Confirm Payment</button>
                        ) : (
                          <span className="text-gray-300 text-xs italic">Complete</span>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Logistics Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Active Branch Requests</h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 border-b">
                  <tr>
                    <th className="px-6 py-4">Branch & Request</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeLogisticsRequests.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4">
                        <div className="font-bold">{o.branchName}</div>
                        <div className="text-[10px] text-gray-400">{o.requestDate} • {o.quantityUnits} Units</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-indigo-600">{o.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-50 text-yellow-600 border border-yellow-100">{o.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {o.status === OrderStatus.PENDING && <button onClick={() => onApprove(o.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Approve</button>}
                        {o.status === OrderStatus.APPROVED && <button onClick={() => setDeliveryInput({id: o.id, start: ''})} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Ship</button>}
                        {o.status === OrderStatus.IN_TRANSIT && <button onClick={() => onMarkDelivered(o.id)} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Mark Arrived</button>}
                        {deliveryInput?.id === o.id && (
                          <div className="mt-2 flex gap-2 justify-end animate-in slide-in-from-right-2">
                            <input type="number" placeholder="Start Series #" className="border rounded-lg px-2 py-1.5 text-xs w-32" value={deliveryInput.start} onChange={e => setDeliveryInput({...deliveryInput, start: e.target.value})} />
                            <button onClick={() => { onShip(o.id, parseInt(deliveryInput.start)); setDeliveryInput(null); }} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold">OK</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-bold text-gray-400">Shipment History</h3>
               <input type="text" placeholder="Search history..." className="text-xs p-2 border rounded-lg w-64 outline-none" value={logisticsHistorySearch} onChange={(e) => setLogisticsHistorySearch(e.target.value)} />
             </div>
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-80">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 border-b">
                    <tr>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Series Range</th>
                      <th className="px-6 py-4">Received By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLogisticsHistory.map(o => (
                      <tr key={o.id}>
                        <td className="px-6 py-4">
                          <div className="font-bold">{o.branchName}</div>
                          <div className="text-[10px] text-gray-400">{o.type}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">
                          #{o.seriesStart?.toLocaleString()} - #{o.seriesEnd?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic text-xs">
                          {o.receivedBy || 'System Confirmation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold">Active Branch Series Monitoring</h3>
            <input 
              type="text" 
              placeholder="Filter by branch, company or receipt type..." 
              className="block w-full md:w-80 pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              value={inventorySearch} 
              onChange={(e) => setInventorySearch(e.target.value)} 
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Branch & Entity</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Series Range</th>
                    <th className="px-6 py-4">Last Logged #</th>
                    <th className="px-6 py-4">Available Stock</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInventory.map((inv, idx) => {
                    const isLow = inv.remainingStock <= inv.threshold;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <div className="font-bold">{getBranchName(inv.branchId)}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{inv.company}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{inv.type}</td>
                        <td className="px-6 py-4 font-mono text-xs">#{inv.currentSeriesStart.toLocaleString()} - #{inv.currentSeriesEnd.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold">#{inv.lastUsedNumber.toLocaleString()}</div>
                          <div className="text-[9px] text-gray-400 uppercase">Updated: {inv.lastUpdateDate}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`font-black ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{inv.remainingStock.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${isLow ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {isLow ? 'Critical' : 'Healthy'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold">Account Management</h3>
             <button onClick={() => setShowAddBranchModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all">Add New Branch</button>
           </div>
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-4 border-b bg-gray-50/50">
               <input 
                 type="text" 
                 placeholder="Search branches or users..." 
                 className="text-xs p-2 border rounded-lg w-full max-w-sm outline-none focus:ring-2 focus:ring-indigo-500"
                 value={accountsSearch}
                 onChange={(e) => setAccountsSearch(e.target.value)}
               />
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 border-b">
                  <tr>
                    <th className="px-6 py-4">Branch Name</th>
                    <th className="px-6 py-4">Company Entity</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">TIN Number</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAccounts.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4 font-bold">{u.branchName}</td>
                      <td className="px-6 py-4 uppercase text-xs font-bold text-indigo-500">{u.company}</td>
                      <td className="px-6 py-4 text-gray-500">{u.username}</td>
                      <td className="px-6 py-4 font-mono text-xs">{u.tinNumber || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEditUserClick(u)} className="text-indigo-600 text-xs font-bold hover:underline">Edit Info</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Modals */}
      {showSupRequestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold">New Supplier Request</h3>
            <form onSubmit={(e) => { e.preventDefault(); if(supBranchId) onRequestFromSupplier(supBranchId, supType, supUnits); setShowSupRequestModal(false); }} className="space-y-4">
              <select required className="w-full bg-gray-50 border p-3 rounded-xl outline-none" value={supBranchId} onChange={e => setSupBranchId(e.target.value)}>
                <option value="">Select Branch...</option>
                {users.filter(u => u.role === UserRole.BRANCH).map(b => (
                  <option key={b.id} value={b.id}>{b.branchName} ({b.company})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full bg-gray-50 border p-3 rounded-xl outline-none" value={supType} onChange={e => setSupType(e.target.value as ReceiptType)}>
                  {Object.values(ReceiptType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" min="1" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none" placeholder="Qty Units" value={supUnits} onChange={e => setSupUnits(parseInt(e.target.value))} />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowSupRequestModal(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-lg w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Confirm Supplier Arrival</h3>
            <form onSubmit={(e) => { e.preventDefault(); onConfirmSupplierDelivery(showSupConfirmModal!, { billingInvoiceNo: supBillingNo, amount: supAmount, deliveryReceiptNo: supDRNo, deliveryDate: supDelDate }); setShowSupConfirmModal(null); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Billing Invoice #" required className="w-full bg-gray-50 border p-3 rounded-xl" value={supBillingNo} onChange={e => setSupBillingNo(e.target.value)} />
                <input type="number" placeholder="Amount (₱)" required className="w-full bg-gray-50 border p-3 rounded-xl" value={supAmount} onChange={e => setSupAmount(parseFloat(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="DR #" required className="w-full bg-gray-50 border p-3 rounded-xl" value={supDRNo} onChange={e => setSupDRNo(e.target.value)} />
                <input type="date" required className="w-full bg-gray-50 border p-3 rounded-xl" value={supDelDate} onChange={e => setSupDelDate(e.target.value)} />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowSupConfirmModal(null)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {prfEntryId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-sm w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Enter PRF Number</h3>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateSupplierDetails(prfEntryId!, { prfNumber: prfNumberInput }); setPrfEntryId(null); setPrfNumberInput(''); }} className="space-y-4">
              <input type="text" required placeholder="PRF-2023-XXXX" className="w-full bg-gray-50 border p-3 rounded-xl outline-none" value={prfNumberInput} onChange={e => setPrfNumberInput(e.target.value)} autoFocus />
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setPrfEntryId(null)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save PRF</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Register New Branch</h3>
            <form onSubmit={handleAddBranchSubmit} className="space-y-4">
              <input placeholder="Branch Name (e.g. SM North)" required className="w-full bg-gray-50 border p-3 rounded-xl" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
              <input placeholder="Company Entity (e.g. PMCI)" required className="w-full bg-gray-50 border p-3 rounded-xl" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
              <input placeholder="Username" required className="w-full bg-gray-50 border p-3 rounded-xl" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
              <input placeholder="TIN Number" className="w-full bg-gray-50 border p-3 rounded-xl" value={newTin} onChange={e => setNewTin(e.target.value)} />
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowAddBranchModal(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Edit Account Details</h3>
            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <input placeholder="Branch Name" required className="w-full bg-gray-50 border p-3 rounded-xl" value={editBranchName} onChange={e => setEditBranchName(e.target.value)} />
              <input placeholder="Company Entity" required className="w-full bg-gray-50 border p-3 rounded-xl" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
              <input placeholder="Username" required className="w-full bg-gray-50 border p-3 rounded-xl" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
              <input placeholder="TIN Number" className="w-full bg-gray-50 border p-3 rounded-xl" value={editTin} onChange={e => setEditTin(e.target.value)} />
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setEditUserModal(null)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Update Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
