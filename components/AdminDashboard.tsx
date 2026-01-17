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
  onDeleteUser: (userId: string) => void;
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
  onUpdateUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'orders' | 'supplier' | 'billing' | 'accounts'>('home');
  const [inventorySearch, setInventorySearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');
  const [accountsSearch, setAccountsSearch] = useState('');
  const [logisticsSearch, setLogisticsSearch] = useState('');
  const [deliveryInput, setDeliveryInput] = useState<{id: string, start: string} | null>(null);
  
  // Modal States
  const [showSupRequestModal, setShowSupRequestModal] = useState(false);
  const [showSupConfirmModal, setShowSupConfirmModal] = useState<string | null>(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState<User | null>(null);
  const [prfEntryId, setPrfEntryId] = useState<string | null>(null);

  // Form States
  const [editBranchName, setEditBranchName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editTin, setEditTin] = useState('');
  const [prfNumberInput, setPrfNumberInput] = useState('');

  // New Branch Form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCompany, setNewBranchCompany] = useState('');
  const [newBranchUser, setNewBranchUser] = useState('');
  const [newBranchTin, setNewBranchTin] = useState('');

  // Supplier Form States
  const [supBranchId, setSupBranchId] = useState('');
  const [supType, setSupType] = useState<ReceiptType>(ReceiptType.SALES_INVOICE);
  const [supUnits, setSupUnits] = useState(1);
  const [supUnitLabel, setSupUnitLabel] = useState<'Box' | 'Booklet'>('Box');

  // Supplier Confirmation Form States
  const [supBillingNo, setSupBillingNo] = useState('');
  const [supAmount, setSupAmount] = useState<number>(0);
  const [supDRNo, setSupDRNo] = useState('');
  const [supDelDate, setSupDelDate] = useState(new Date().toISOString().split('T')[0]);

  const getBranchName = (branchId: string) => users.find(u => u.id === branchId)?.branchName || `Branch ${branchId}`;
  const getBranchCompany = (branchId: string) => users.find(u => u.id === branchId)?.company || 'Unknown';
  const getBranchTin = (branchId: string) => users.find(u => u.id === branchId)?.tinNumber || 'N/A';
  const getBranchInventoryForType = (branchId: string, type: ReceiptType) => inventory.find(i => i.branchId === branchId && i.type === type);
  const getBranchLastSeriesForType = (branchId: string, type: ReceiptType) => getBranchInventoryForType(branchId, type)?.currentSeriesEnd || 0;

  const getWarehouseStockForType = (branchId: string, type: ReceiptType) => {
    return (warehouse[branchId] || []).find(i => i.type === type);
  };

  // Filtered Lists
  const filteredAccounts = users.filter(u => {
    if (u.role === UserRole.ADMIN) return false;
    const query = accountsSearch.toLowerCase();
    return (u.branchName?.toLowerCase().includes(query) || 
            u.company?.toLowerCase().includes(query) || 
            u.username.toLowerCase().includes(query) || 
            u.tinNumber?.toLowerCase().includes(query));
  });

  const filteredInventory = inventory.filter(inv => {
    const query = inventorySearch.toLowerCase();
    const bName = getBranchName(inv.branchId).toLowerCase();
    return bName.includes(query) || inv.company.toLowerCase().includes(query) || inv.type.toLowerCase().includes(query);
  });

  const activeSupOrders = supplierOrders.filter(o => o.status !== SupplierOrderStatus.DELIVERED);
  
  const filteredBillingOrders = supplierOrders.filter(o => {
    if (o.status !== SupplierOrderStatus.DELIVERED) return false;
    const query = billingSearch.toLowerCase();
    const branchName = getBranchName(o.branchId).toLowerCase();
    const company = getBranchCompany(o.branchId).toLowerCase();
    const invoice = o.billingInvoiceNo?.toLowerCase() || '';
    const prf = o.prfNumber?.toLowerCase() || '';
    
    return branchName.includes(query) || company.includes(query) || invoice.includes(query) || prf.includes(query);
  });

  const filteredLogisticsHistory = orders.filter(o => {
    if (o.status !== OrderStatus.RECEIVED) return false;
    const query = logisticsSearch.toLowerCase();
    return (
      o.branchName.toLowerCase().includes(query) ||
      o.type.toLowerCase().includes(query) ||
      (o.receivedBy?.toLowerCase() || '').includes(query) ||
      (o.seriesStart?.toString() || '').includes(query)
    );
  });

  const handleEditUserClick = (u: User) => {
    setEditUserModal(u);
    setEditBranchName(u.branchName || '');
    setEditCompany(u.company || '');
    setEditUsername(u.username);
    setEditTin(u.tinNumber || '');
  };

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

  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchName && newBranchCompany && newBranchUser) {
      onAddBranch(newBranchName, newBranchCompany, newBranchUser, newBranchTin);
      setShowAddBranchModal(false);
      setNewBranchName('');
      setNewBranchCompany('');
      setNewBranchUser('');
      setNewBranchTin('');
    }
  };

  const handlePrfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prfEntryId && prfNumberInput.trim()) {
      onUpdateSupplierDetails(prfEntryId, { prfNumber: prfNumberInput.trim() });
      setPrfEntryId(null);
      setPrfNumberInput('');
    }
  };

  const handleSupConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSupConfirmModal) return;
    onConfirmSupplierDelivery(showSupConfirmModal, {
      billingInvoiceNo: supBillingNo,
      amount: supAmount,
      deliveryReceiptNo: supDRNo,
      deliveryDate: supDelDate
    });
    setShowSupConfirmModal(null);
    setSupBillingNo('');
    setSupAmount(0);
    setSupDRNo('');
  };

  const handleNewSupplierRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supBranchId) {
      alert("Please select a branch first.");
      return;
    }
    onRequestFromSupplier(supBranchId, supType, supUnits);
    setShowSupRequestModal(false);
    setSupBranchId('');
    setSupType(ReceiptType.SALES_INVOICE);
    setSupUnits(1);
    setSupUnitLabel('Box');
  };

  const receiptsPerUnit = supUnitLabel === 'Box' ? 500 : 50;
  const totalReceipts = supUnits * receiptsPerUnit;
  const currentBranchEnd = getBranchLastSeriesForType(supBranchId, supType);
  const nextStart = currentBranchEnd + 1;
  const nextEnd = nextStart + totalReceipts - 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('home')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Warehouse</button>
        <button onClick={() => setActiveTab('supplier')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'supplier' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Supplier Orders</button>
        <button onClick={() => setActiveTab('billing')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Billing</button>
        <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Logistics</button>
        <button onClick={() => setActiveTab('search')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Branch Inventory</button>
        <button onClick={() => setActiveTab('accounts')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Accounts</button>
      </div>

      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-800">Warehouse Allocation Stock</h3>
            <div className="relative w-full md:w-64">
              <input type="text" placeholder="Filter by branch..." className="block w-full pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={warehouseSearch} onChange={(e) => setWarehouseSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-6">
            {Object.entries(warehouse).filter(([branchId]) => {
              const query = warehouseSearch.toLowerCase();
              return getBranchName(branchId).toLowerCase().includes(query) || getBranchCompany(branchId).toLowerCase().includes(query);
            }).map(([branchId, items]) => (
              <div key={branchId} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="text-lg font-black text-gray-900">{getBranchName(branchId)}</h4>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{getBranchCompany(branchId)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.isArray(items) && items.map((item: WarehouseItem, idx: number) => {
                    const lastSeries = getBranchLastSeriesForType(branchId, item.type);
                    return (
                      <div key={idx} className="p-4 rounded-2xl border bg-gray-50/50 border-gray-100 group">
                        <p className="text-[10px] font-black uppercase text-indigo-500 group-hover:text-indigo-600 transition-colors">{item.type}</p>
                        <div className="flex justify-between items-end mt-2">
                          <h5 className="text-2xl font-black text-slate-800">{item.totalUnits}</h5>
                          <p className="text-[10px] font-bold uppercase pb-1 text-gray-400">{item.unitLabel}s</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Projected Start:</p>
                          <div className="text-[10px] font-mono font-bold text-slate-600">{(lastSeries + 1).toLocaleString()}</div>
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

      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">Active Branch Inventory</h3>
            <div className="relative w-full md:w-80">
              <input type="text" placeholder="Search branch, company, or type..." className="w-full pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Branch & Company</th>
                    <th className="px-6 py-4">Receipt Type</th>
                    <th className="px-6 py-4">Remaining Series</th>
                    <th className="px-6 py-4">Remaining Stock</th>
                    <th className="px-6 py-4">Last Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.map((inv, idx) => {
                    const isLow = inv.remainingStock <= inv.threshold;
                    const perUnit = inv.type === ReceiptType.SALES_INVOICE ? 500 : 50;
                    const unitLabel = inv.type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet';
                    const unitsCount = Math.floor(inv.remainingStock / perUnit);
                    const looseCount = inv.remainingStock % perUnit;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{getBranchName(inv.branchId)}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{inv.company}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-indigo-600/80">{inv.type}</td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-slate-600">
                            {inv.lastUsedNumber + 1 < inv.currentSeriesEnd ? (
                              `${(inv.lastUsedNumber + 1).toLocaleString()} - ${inv.currentSeriesEnd.toLocaleString()}`
                            ) : (
                              <span className="text-red-500 font-bold">SERIES DEPLETED</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-lg ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                {inv.remainingStock.toLocaleString()}
                              </span>
                              {isLow && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase ring-1 ring-red-200">Low</span>}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">
                              {unitsCount} {unitLabel}{unitsCount !== 1 ? 's' : ''} {looseCount > 0 ? `+ ${looseCount} loose` : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {inv.lastUpdateDate ? (
                            <div className="text-[10px]">
                              <div className="font-bold text-gray-700">{inv.lastUpdateDate}</div>
                              <div className="text-gray-400 italic font-medium">By: {inv.lastUpdatedBy || 'System'}</div>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-xs">No updates</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">Branch Account Management</h3>
            <button onClick={() => setShowAddBranchModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              Register Branch
            </button>
          </div>
          <div className="relative w-full md:w-80">
            <input type="text" placeholder="Search accounts..." className="w-full pl-4 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none transition-all" value={accountsSearch} onChange={(e) => setAccountsSearch(e.target.value)} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Branch Name</th>
                    <th className="px-6 py-4">Company Entity</th>
                    <th className="px-6 py-4">TIN #</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAccounts.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{u.branchName}</td>
                      <td className="px-6 py-4 text-indigo-600 font-bold text-xs">{u.company}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{u.tinNumber || '—'}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">{u.username}</td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => handleEditUserClick(u)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-tighter hover:underline">Edit</button>
                        <button onClick={() => onDeleteUser(u.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-tighter hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-300 italic">No branch accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier & Logistics tabs elided for brevity as they haven't changed */}
      {/* ... (rest of the tabs) ... */}

      {/* Shared Modals */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">New Branch Registration</h3>
            <form onSubmit={handleAddBranchSubmit} className="space-y-4">
              <div className="space-y-4">
                <input placeholder="Branch Name (e.g. SM North)" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
                <input placeholder="Company Entity (e.g. PMCI)" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newBranchCompany} onChange={e => setNewBranchCompany(e.target.value)} />
                <input placeholder="Login Username" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newBranchUser} onChange={e => setNewBranchUser(e.target.value)} />
                <input placeholder="TIN Number (Optional)" className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newBranchTin} onChange={e => setNewBranchTin(e.target.value)} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddBranchModal(false)} className="flex-1 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Edit Branch Details</h3>
            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Branch Name</label>
                  <input required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={editBranchName} onChange={e => setEditBranchName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Entity</label>
                  <input required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Username</label>
                  <input required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">TIN Number</label>
                  <input className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={editTin} onChange={e => setEditTin(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditUserModal(null)} className="flex-1 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">Update Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier & Delivery Modals elided for brevity */}
      {/* ... (rest of modals) ... */}
    </div>
  );
};

export default AdminDashboard;