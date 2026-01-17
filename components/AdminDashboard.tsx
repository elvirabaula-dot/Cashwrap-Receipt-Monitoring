
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
  const [activeTab, setActiveTab] = useState<'home' | 'inventory' | 'supplier' | 'billing' | 'orders' | 'accounts'>('home');
  
  // Modal & Form States
  const [showSupRequestModal, setShowSupRequestModal] = useState(false);
  const [showSupConfirmModal, setShowSupConfirmModal] = useState<string | null>(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [deliveryInput, setDeliveryInput] = useState<{id: string, start: string} | null>(null);

  // Supplier Form
  const [supBranchId, setSupBranchId] = useState('');
  const [supType, setSupType] = useState<ReceiptType>(ReceiptType.SALES_INVOICE);
  const [supUnits, setSupUnits] = useState(1);

  // Billing Form for Confirmation
  const [supBillingNo, setSupBillingNo] = useState('');
  const [supAmount, setSupAmount] = useState<number>(0);
  const [supDRNo, setSupDRNo] = useState('');

  // New Branch Form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCompany, setNewBranchCompany] = useState('');
  const [newBranchUser, setNewBranchUser] = useState('');

  const getBranchName = (id: string) => users.find(u => u.id === id)?.branchName || 'Unknown Branch';
  const getBranchLastSeries = (id: string, type: ReceiptType) => inventory.find(i => i.branchId === id && i.type === type)?.currentSeriesEnd || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'home', label: 'Warehouse' },
          { id: 'inventory', label: 'Branch Inventory' },
          { id: 'supplier', label: 'Supplier' },
          { id: 'billing', label: 'Billing' },
          { id: 'orders', label: 'Logistics' },
          { id: 'accounts', label: 'Accounts' }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Warehouse Tab */}
      {activeTab === 'home' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-xl font-black text-slate-800 uppercase mb-6">Warehouse Stocks (Central)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(warehouse).map(([branchId, items]) => (
              <div key={branchId} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="font-black text-slate-900 mb-4">{getBranchName(branchId)}</h4>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{item.type}</p>
                        <p className="text-lg font-black text-slate-800">{item.totalUnits} <span className="text-[10px] text-slate-400">{item.unitLabel}s</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-xl font-black text-slate-800 uppercase mb-6">Live Branch Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter(u => u.role === UserRole.BRANCH).map(branch => {
              const branchInv = inventory.filter(i => i.branchId === branch.id);
              return (
                <div key={branch.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-slate-900">{branch.branchName}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{branch.company}</span>
                  </div>
                  <div className="space-y-3 flex-grow">
                    {branchInv.length > 0 ? branchInv.map((item, idx) => {
                      const isLow = item.remainingStock <= item.threshold;
                      return (
                        <div key={idx} className={`p-4 rounded-2xl border ${isLow ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-start">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isLow ? 'text-red-600' : 'text-indigo-500'}`}>{item.type}</p>
                            {isLow && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse uppercase">Critical</span>}
                          </div>
                          <div className="mt-1 flex justify-between items-end">
                            <p className="text-xl font-black text-slate-800">{item.remainingStock.toLocaleString()}</p>
                            <p className="text-[9px] font-mono text-slate-400 font-bold">{item.lastUsedNumber + 1} - {item.currentSeriesEnd}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-8 text-center text-slate-400 text-xs italic">No items in branch inventory</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Tab Content */}
      {activeTab === 'supplier' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase">Supplier Requests</h3>
            <button onClick={() => setShowSupRequestModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">New Supply Request</button>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] uppercase font-black text-gray-400">
                <tr>
                  <th className="px-6 py-4">Branch & Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {supplierOrders.filter(so => so.status !== SupplierOrderStatus.DELIVERED).map(so => (
                  <tr key={so.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{getBranchName(so.branchId)}</div>
                      <div className="text-[10px] text-indigo-500 font-bold uppercase">{so.type}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">{so.quantityUnits} Units</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">{so.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {so.status === SupplierOrderStatus.REQUESTED && <button onClick={() => onUpdateSupplierStatus(so.id, SupplierOrderStatus.PROCESSED)} className="text-[10px] font-black text-indigo-600 uppercase">Process</button>}
                      {so.status === SupplierOrderStatus.PROCESSED && <button onClick={() => onUpdateSupplierStatus(so.id, SupplierOrderStatus.SHIPPED)} className="text-[10px] font-black text-indigo-600 uppercase">Ship</button>}
                      {so.status === SupplierOrderStatus.SHIPPED && <button onClick={() => setShowSupConfirmModal(so.id)} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">Receive</button>}
                    </td>
                  </tr>
                ))}
                {supplierOrders.filter(so => so.status !== SupplierOrderStatus.DELIVERED).length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-xs">No active supplier requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab Content */}
      {activeTab === 'billing' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase">Accounts Payable / Billing</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] uppercase font-black text-gray-400">
                <tr>
                  <th className="px-6 py-4">Invoice Details</th>
                  <th className="px-6 py-4">Branch / Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {supplierOrders.filter(so => so.status === SupplierOrderStatus.DELIVERED).map(so => (
                  <tr key={so.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">#{so.billingInvoiceNo}</div>
                      <div className="text-[10px] font-bold text-gray-400">DR: {so.deliveryReceiptNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{getBranchName(so.branchId)}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{so.type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">₱{so.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onUpdateSupplierDetails(so.id, { isPaid: !so.isPaid })}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${so.isPaid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                      >
                        {so.isPaid ? 'Paid' : 'Unpaid'}
                      </button>
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
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
          <h3 className="text-xl font-black text-slate-800 uppercase">Logistics Pipeline</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] uppercase font-black text-gray-400">
                <tr>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Volume</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.filter(o => o.status !== OrderStatus.RECEIVED).map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{o.branchName}</div>
                      <div className="text-[10px] text-indigo-500 font-bold uppercase">{o.type}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">{o.quantityUnits} Units</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${o.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {o.status === OrderStatus.PENDING && <button onClick={() => onApprove(o.id)} className="text-[10px] font-black text-green-600 uppercase">Approve</button>}
                      {o.status === OrderStatus.APPROVED && <button onClick={() => setDeliveryInput({ id: o.id, start: '' })} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">Dispatch</button>}
                      {o.status === OrderStatus.IN_TRANSIT && <button onClick={() => onMarkDelivered(o.id)} className="text-[10px] font-black text-slate-500 uppercase">Delivered</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase">Branch Management</h3>
            <button onClick={() => setShowAddBranchModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase">Add New Branch</button>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] uppercase font-black text-gray-400">
                <tr><th className="px-6 py-4">Branch</th><th className="px-6 py-4">User</th><th className="px-6 py-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y">
                {users.filter(u => u.role === UserRole.BRANCH).map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-black text-slate-800">{u.branchName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.username}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => onDeleteUser(u.id)} className="text-red-500 font-bold uppercase text-[10px]">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSupRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-6 uppercase">Order Supply</h3>
            <div className="space-y-4">
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold" value={supBranchId} onChange={e => setSupBranchId(e.target.value)}>
                <option value="">Select Target Branch</option>
                {users.filter(u => u.role === UserRole.BRANCH).map(u => <option key={u.id} value={u.id}>{u.branchName}</option>)}
              </select>
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold" value={supType} onChange={e => setSupType(e.target.value as ReceiptType)}>
                {Object.values(ReceiptType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Units" value={supUnits} onChange={e => setSupUnits(parseInt(e.target.value))} />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowSupRequestModal(false)} className="flex-1 text-xs font-black text-slate-400 uppercase">Cancel</button>
                <button onClick={() => { onRequestFromSupplier(supBranchId, supType, supUnits); setShowSupRequestModal(false); }} className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-6 uppercase">Confirm Delivery</h3>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Invoice #" value={supBillingNo} onChange={e => setSupBillingNo(e.target.value)} />
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="DR #" value={supDRNo} onChange={e => setSupDRNo(e.target.value)} />
              <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Amount" value={supAmount} onChange={e => setSupAmount(parseFloat(e.target.value))} />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowSupConfirmModal(null)} className="flex-1 text-xs font-black text-slate-400 uppercase">Cancel</button>
                <button onClick={() => { 
                  onConfirmSupplierDelivery(showSupConfirmModal, { billingInvoiceNo: supBillingNo, amount: supAmount, deliveryReceiptNo: supDRNo, deliveryDate: new Date().toISOString().split('T')[0] });
                  setShowSupConfirmModal(null);
                }} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-6 uppercase">New Branch</h3>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Name" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Company" value={newBranchCompany} onChange={e => setNewBranchCompany(e.target.value)} />
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold" placeholder="User" value={newBranchUser} onChange={e => setNewBranchUser(e.target.value)} />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddBranchModal(false)} className="flex-1 text-xs font-black text-slate-400 uppercase">Cancel</button>
                <button onClick={() => { onAddBranch(newBranchName, newBranchCompany, newBranchUser); setShowAddBranchModal(false); }} className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deliveryInput && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black mb-6 uppercase">Series Dispatch</h3>
            <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-mono font-bold" placeholder="Start Series" value={deliveryInput.start} onChange={e => setDeliveryInput({...deliveryInput, start: e.target.value})} />
            <div className="flex gap-4 pt-4">
              <button onClick={() => setDeliveryInput(null)} className="flex-1 text-xs font-black text-slate-400 uppercase">Cancel</button>
              <button onClick={() => onShip(deliveryInput.id, parseInt(deliveryInput.start))} className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Ship</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
