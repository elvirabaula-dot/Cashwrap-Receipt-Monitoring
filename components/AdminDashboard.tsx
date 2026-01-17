
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
    return u.branchName?.toLowerCase().includes(query) || u.company?.toLowerCase().includes(query) || u.username.toLowerCase().includes(query) || u.tinNumber?.toLowerCase().includes(query);
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
      onUpdateUser(editUserModal.id, { branchName: editBranchName, company: editCompany, username: editUsername, tinNumber: editTin });
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
    // Reset form
    setSupBranchId('');
    setSupType(ReceiptType.SALES_INVOICE);
    setSupUnits(1);
    setSupUnitLabel('Box');
  };

  // Automated Series Computation for Supplier Modal
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
            <h3 className="text-xl font-bold">Warehouse Allocation Stock</h3>
            <div className="relative w-full md:w-64">
              <input type="text" placeholder="Filter by branch..." className="block w-full pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={warehouseSearch} onChange={(e) => setWarehouseSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-6">
            {Object.entries(warehouse).filter(([branchId]) => {
              const query = warehouseSearch.toLowerCase();
              return getBranchName(branchId).toLowerCase().includes(query) || getBranchCompany(branchId).toLowerCase().includes(query);
            }).map(([branchId, items]) => (
              <div key={branchId} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-lg font-black text-gray-900">{getBranchName(branchId)}</h4>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{getBranchCompany(branchId)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {items.map((item, idx) => {
                    const lastSeries = getBranchLastSeriesForType(branchId, item.type);
                    return (
                      <div key={idx} className="p-4 rounded-2xl border bg-gray-50/50 border-gray-100">
                        <p className="text-[10px] font-black uppercase text-indigo-500">{item.type}</p>
                        <div className="flex justify-between items-end mt-2">
                          <h5 className="text-2xl font-black">{item.totalUnits}</h5>
                          <p className="text-[10px] font-bold uppercase pb-1 text-gray-400">{item.unitLabel}s</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Projected Start:</p>
                          <div className="text-[10px] font-mono font-bold">{(lastSeries + 1).toLocaleString()}</div>
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
            <h3 className="text-xl font-bold">Active Branch Inventory</h3>
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
                <tbody className="divide-y">
                  {filteredInventory.map((inv, idx) => {
                    const isLow = inv.remainingStock <= inv.threshold;
                    const perUnit = inv.type === ReceiptType.SALES_INVOICE ? 500 : 50;
                    const unitLabel = inv.type === ReceiptType.SALES_INVOICE ? 'Box' : 'Booklet';
                    const unitsCount = Math.floor(inv.remainingStock / perUnit);
                    const looseCount = inv.remainingStock % perUnit;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <div className="font-bold">{getBranchName(inv.branchId)}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{inv.company}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">{inv.type}</td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-gray-600">
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
                              {isLow && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Low</span>}
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
                              <div className="text-gray-400 italic">By: {inv.lastUpdatedBy || 'System'}</div>
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
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Branch Account Management</h3>
            <button onClick={() => setShowAddBranchModal(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all">Add Branch</button>
          </div>
          <div className="relative w-full md:w-80">
            <input type="text" placeholder="Search accounts..." className="w-full pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={accountsSearch} onChange={(e) => setAccountsSearch(e.target.value)} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              <tbody className="divide-y">
                {filteredAccounts.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/30">
                    <td className="px-6 py-4 font-bold text-gray-900">{u.branchName}</td>
                    <td className="px-6 py-4 text-indigo-600 font-bold text-xs">{u.company}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{u.tinNumber || '—'}</td>
                    <td className="px-6 py-4 font-mono text-gray-500">{u.username}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditUserClick(u)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">Edit Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Supplier Procurement</h3>
            <button onClick={() => setShowSupRequestModal(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all">New Request</button>
          </div>
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b font-bold text-sm text-gray-700">Active Supplier Requests</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] text-gray-400 uppercase font-black border-b tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Branch & TIN</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Warehouse Status</th>
                    <th className="px-6 py-4">Order Qty</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeSupOrders.map(o => {
                    const ws = getWarehouseStockForType(o.branchId, o.type);
                    const brInv = getBranchInventoryForType(o.branchId, o.type);
                    
                    // Logic to figure out warehouse range
                    // Warehouse starts at Branch End + 1
                    const wsStart = (brInv?.currentSeriesEnd || 0) + 1;
                    const wsReceipts = (ws?.totalUnits || 0) * (ws?.receiptsPerUnit || 1);
                    const wsEnd = wsStart + wsReceipts - 1;

                    return (
                      <tr key={o.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{getBranchName(o.branchId)}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{getBranchCompany(o.branchId)}</div>
                          <div className="text-[9px] font-mono text-indigo-500 font-bold mt-1">TIN: {getBranchTin(o.branchId)}</div>
                        </td>
                        <td className="px-6 py-4 font-medium">{o.type}</td>
                        <td className="px-6 py-4">
                          {ws && ws.totalUnits > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-teal-600">{ws.totalUnits} {ws.unitLabel}s</span>
                                <span className="text-[9px] bg-teal-50 text-teal-600 px-1 py-0.5 rounded border border-teal-100 font-bold uppercase tracking-tighter">In Stock</span>
                              </div>
                              <div className="text-[10px] font-mono text-gray-500">Series: {wsStart.toLocaleString()} - {wsEnd.toLocaleString()}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No warehouse stock</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-black">{o.quantityUnits} Units</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${o.status === SupplierOrderStatus.REQUESTED ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{o.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {o.status === SupplierOrderStatus.REQUESTED ? (
                            <button onClick={() => onUpdateSupplierStatus(o.id, SupplierOrderStatus.SHIPPED)} className="text-indigo-600 font-bold text-xs hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">Mark Shipped</button>
                          ) : (
                            <button onClick={() => setShowSupConfirmModal(o.id)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm">Confirm Arrival</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {activeSupOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No active supplier requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-bold">Billing & PRF Management</h3>
            <div className="relative w-full md:w-80">
              <input type="text" placeholder="Search billing..." className="w-full pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={billingSearch} onChange={(e) => setBillingSearch(e.target.value)} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-gray-400 uppercase font-black border-b tracking-widest">
                <tr>
                  <th className="px-6 py-4">Company & Branch</th>
                  <th className="px-6 py-4">Billing No.</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">PRF Details</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBillingOrders.map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold">{getBranchName(o.branchId)}</div>
                      <div className="text-[10px] text-gray-400">{getBranchCompany(o.branchId)}</div>
                    </td>
                    <td className="px-6 py-4 font-mono">{o.billingInvoiceNo}</td>
                    <td className="px-6 py-4 font-black">₱{o.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-xs">{o.prfNumber || 'PENDING'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{o.isPaid ? 'Paid' : 'Unpaid'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!o.prfNumber && <button onClick={() => setPrfEntryId(o.id)} className="text-indigo-600 font-bold text-xs">Add PRF#</button>}
                      {o.prfNumber && !o.isPaid && <button onClick={() => onUpdateSupplierDetails(o.id, { isPaid: true })} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Mark Paid</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Active Branch Logistics Requests</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Branch & Type</th>
                    <th className="px-6 py-4">Branch Current Progress</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.filter(o => o.status !== OrderStatus.RECEIVED).map(o => {
                    const brInv = getBranchInventoryForType(o.branchId, o.type);
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <div className="font-bold">{getBranchName(o.branchId)}</div>
                          <div className="text-[10px] text-indigo-600 uppercase font-bold">{o.type}</div>
                        </td>
                        <td className="px-6 py-4">
                          {brInv ? (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-gray-700">Last Used: <span className="font-mono text-indigo-600">{brInv.lastUsedNumber.toLocaleString()}</span></div>
                              <div className="text-[10px] text-gray-400 uppercase">Series End: {brInv.currentSeriesEnd.toLocaleString()}</div>
                              <div className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded border border-indigo-100">
                                REF NEXT: {(brInv.currentSeriesEnd + 1).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300 italic">No existing series</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{o.quantityUnits} Units</div>
                          {o.seriesStart && <div className="text-[10px] text-blue-600 font-mono">Shipped: {o.seriesStart.toLocaleString()} - {o.seriesEnd?.toLocaleString()}</div>}
                          {!o.seriesStart && (
                            <div className="text-[9px] text-gray-400 uppercase font-bold mt-1">Pending Shipment</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {o.status === OrderStatus.PENDING && <button onClick={() => onApprove(o.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">Approve</button>}
                          {o.status === OrderStatus.APPROVED && <button onClick={() => setDeliveryInput({id: o.id, start: ''})} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">Prepare Delivery</button>}
                          {o.status === OrderStatus.IN_TRANSIT && <button onClick={() => onMarkDelivered(o.id)} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">Mark Arrived</button>}
                          {deliveryInput?.id === o.id && (
                            <div className="flex gap-2 mt-2 justify-end animate-in slide-in-from-right-2">
                              <input type="number" className="border border-indigo-200 px-3 py-1.5 text-xs w-32 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={deliveryInput.start} onChange={e => setDeliveryInput({...deliveryInput, start: e.target.value})} placeholder="Start #" autoFocus />
                              <button onClick={() => { onShip(o.id, parseInt(deliveryInput.start)); setDeliveryInput(null); }} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Ship</button>
                              <button onClick={() => setDeliveryInput(null)} className="text-gray-400 font-bold text-xs p-1.5">✕</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {orders.filter(o => o.status !== OrderStatus.RECEIVED).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No active logistics requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-bold">Completed Shipment History</h3>
              <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Search history by branch, type, or receiver..." 
                  className="w-full pl-4 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" 
                  value={logisticsSearch} 
                  onChange={(e) => setLogisticsSearch(e.target.value)} 
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Branch & Type</th>
                    <th className="px-6 py-4">Series Range</th>
                    <th className="px-6 py-4">Received Date</th>
                    <th className="px-6 py-4">Received By</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogisticsHistory.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/20 text-gray-600">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{o.branchName}</div>
                        <div className="text-[10px] text-indigo-400 uppercase font-bold">{o.type}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {o.seriesStart?.toLocaleString()} - {o.seriesEnd?.toLocaleString()}
                        <div className="text-[9px] text-gray-400 uppercase font-bold mt-0.5">{o.quantityUnits} Units</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {o.deliveryDate || o.requestDate}
                      </td>
                      <td className="px-6 py-4 italic text-xs">
                        {o.receivedBy || 'System Acknowledged'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 uppercase">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLogisticsHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-300 italic">No matching history records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      {showSupConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Confirm Supplier Arrival</h3>
            <form onSubmit={handleSupConfirmSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Billing #" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={supBillingNo} onChange={e => setSupBillingNo(e.target.value)} />
                <input type="number" placeholder="Amount (₱)" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={supAmount} onChange={e => setSupAmount(parseFloat(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="DR #" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={supDRNo} onChange={e => setSupDRNo(e.target.value)} />
                <input type="date" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={supDelDate} onChange={e => setSupDelDate(e.target.value)} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowSupConfirmModal(null)} className="flex-1 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Confirm Delivery</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupRequestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 transform animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold">New Supplier Request</h3>
            <form onSubmit={handleNewSupplierRequestSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Branch</label>
                <select required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={supBranchId} onChange={e => setSupBranchId(e.target.value)}>
                  <option value="">Select branch...</option>
                  {users.filter(u => u.role === UserRole.BRANCH).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.branchName} ({b.company})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Receipt Type</label>
                  <select className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={supType} onChange={e => setSupType(e.target.value as ReceiptType)}>
                    {Object.values(ReceiptType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit Type</label>
                  <select className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={supUnitLabel} onChange={e => setSupUnitLabel(e.target.value as 'Box' | 'Booklet')}>
                    <option value="Box">Boxes (500s)</option>
                    <option value="Booklet">Booklets (50s)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantity ({supUnitLabel}s)</label>
                <input type="number" min="1" required className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={supUnits} onChange={e => setSupUnits(parseInt(e.target.value))} />
              </div>

              {supBranchId && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Projected Range</span>
                    <span className="text-[10px] font-black text-indigo-600">{totalReceipts.toLocaleString()} Receipts</span>
                  </div>
                  <div className="text-lg font-mono font-black text-gray-800 flex justify-between items-center">
                    <span>{nextStart.toLocaleString()}</span>
                    <span className="text-indigo-300">→</span>
                    <span>{nextEnd.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-indigo-400 italic">Auto-computed from {getBranchName(supBranchId)}'s last series: {currentBranchEnd.toLocaleString()}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowSupRequestModal(false)} className="flex-1 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {prfEntryId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-sm w-full p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Enter PRF Number</h3>
            <form onSubmit={handlePrfSubmit} className="space-y-4">
              <input type="text" required placeholder="e.g. PRF-2023-001" className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={prfNumberInput} onChange={e => setPrfNumberInput(e.target.value)} autoFocus />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setPrfEntryId(null)} className="flex-1 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save PRF</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
