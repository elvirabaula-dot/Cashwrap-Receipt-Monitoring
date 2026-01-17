
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

  // Form states
  const [supBranchId, setSupBranchId] = useState('');
  const [supType, setSupType] = useState<ReceiptType>(ReceiptType.SALES_INVOICE);
  const [supUnits, setSupUnits] = useState(1);
  const [supBillingNo, setSupBillingNo] = useState('');
  const [supAmount, setSupAmount] = useState<number>(0);
  const [supDRNo, setSupDRNo] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCompany, setNewBranchCompany] = useState('');
  const [newBranchUser, setNewBranchUser] = useState('');

  const getBranchName = (id: string) => users.find(u => u.id === id)?.branchName || 'Unknown Branch';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'home', label: 'Warehouse Stock' },
          { id: 'inventory', label: 'Branch Stocks' },
          { id: 'supplier', label: 'Supplier Hub' },
          { id: 'billing', label: 'Billing Ledger' },
          { id: 'orders', label: 'Logistics Queue' },
          { id: 'accounts', label: 'Accounts' }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Warehouse View */}
      {activeTab === 'home' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Central Warehouse</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Available Reserve for Distribution</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(warehouse).map(([branchId, items]) => (
              <div key={branchId} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{getBranchName(branchId)}</h4>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{item.type}</p>
                        <p className="text-lg font-black text-slate-800">{item.totalUnits} <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unitLabel}s</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch Stocks (Inventory) */}
      {activeTab === 'inventory' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Live Branch Stocks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter(u => u.role === UserRole.BRANCH).map(branch => {
              const branchInv = inventory.filter(i => i.branchId === branch.id);
              return (
                <div key={branch.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black text-slate-900 uppercase text-sm">{branch.branchName}</h4>
                    <span className="text-[9px] bg-slate-900 text-white px-2 py-1 rounded-lg font-black uppercase tracking-widest">{branch.company}</span>
                  </div>
                  <div className="space-y-3">
                    {branchInv.length > 0 ? branchInv.map((item, idx) => {
                      const isLow = item.remainingStock <= item.threshold;
                      return (
                        <div key={idx} className={`p-5 rounded-2xl border ${isLow ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isLow ? 'text-red-600' : 'text-indigo-500'}`}>{item.type}</p>
                            {isLow && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse uppercase">Refill Req</span>}
                          </div>
                          <div className="flex justify-between items-end">
                            <p className="text-2xl font-black text-slate-900">{item.remainingStock.toLocaleString()}</p>
                            <p className="text-[9px] font-mono text-slate-400 font-bold">SN: {item.lastUsedNumber + 1} - {item.currentSeriesEnd}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No Active Inventory</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Hub */}
      {activeTab === 'supplier' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Supplier Pipeline</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Acquisitions & Fulfillment</p>
            </div>
            <button onClick={() => setShowSupRequestModal(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-100 hover:scale-105 transition-transform">Initiate Order</button>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Origin/Destination</th>
                  <th className="px-8 py-5">Volume</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Pipeline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {supplierOrders.filter(so => so.status !== SupplierOrderStatus.DELIVERED).map(so => (
                  <tr key={so.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{getBranchName(so.branchId)}</div>
                      <div className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">{so.type}</div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs">{so.quantityUnits} Units</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">{so.status}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {so.status === SupplierOrderStatus.REQUESTED && <button onClick={() => onUpdateSupplierStatus(so.id, SupplierOrderStatus.PROCESSED)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Mark Processed</button>}
                      {so.status === SupplierOrderStatus.PROCESSED && <button onClick={() => onUpdateSupplierStatus(so.id, SupplierOrderStatus.SHIPPED)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Mark Shipped</button>}
                      {so.status === SupplierOrderStatus.SHIPPED && <button onClick={() => setShowSupConfirmModal(so.id)} className="bg-green-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100">Log Delivery</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Ledger */}
      {activeTab === 'billing' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Financial Ledger</h3>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Reference</th>
                  <th className="px-8 py-5">Entity & Allocation</th>
                  <th className="px-8 py-5">Valuation</th>
                  <th className="px-8 py-5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {supplierOrders.filter(so => so.status === SupplierOrderStatus.DELIVERED).map(so => (
                  <tr key={so.id}>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase text-xs">INV-{so.billingInvoiceNo}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">DR-{so.deliveryReceiptNo}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-800 uppercase text-xs">{getBranchName(so.branchId)}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{so.type}</div>
                    </td>
                    <td className="px-8 py-5 font-mono font-black text-slate-900">₱{so.amount?.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onUpdateSupplierDetails(so.id, { isPaid: !so.isPaid })}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${so.isPaid ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                      >
                        {so.isPaid ? 'Settled' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logistics Queue */}
      {activeTab === 'orders' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Logistics Queue</h3>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Shipment Info</th>
                  <th className="px-8 py-5">Inventory Units</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.filter(o => o.status !== OrderStatus.RECEIVED).map(o => (
                  <tr key={o.id}>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{o.branchName}</div>
                      <div className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">{o.type}</div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs">{o.quantityUnits} Units</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{o.status}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {o.status === OrderStatus.PENDING && <button onClick={() => onApprove(o.id)} className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline">Approve Stock</button>}
                      {o.status === OrderStatus.APPROVED && <button onClick={() => setDeliveryInput({ id: o.id, start: '' })} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-50">Dispatch</button>}
                      {o.status === OrderStatus.IN_TRANSIT && <button onClick={() => onMarkDelivered(o.id)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Transit...</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Management */}
      {activeTab === 'accounts' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Branch Accounts</h3>
            <button onClick={() => setShowAddBranchModal(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Register Branch</button>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr><th className="px-8 py-5">Branch Identity</th><th className="px-8 py-5">Credential</th><th className="px-8 py-5 text-right">Access Control</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.filter(u => u.role === UserRole.BRANCH).map(u => (
                  <tr key={u.id}>
                    <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs">{u.branchName}</td>
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-400 font-bold">{u.username}</td>
                    <td className="px-8 py-5 text-right"><button onClick={() => onDeleteUser(u.id)} className="text-red-500 font-black uppercase text-[10px] tracking-widest hover:underline">Revoke Access</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals Implementation */}
      {showSupRequestModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-8 uppercase text-slate-900">New Supply Request</h3>
            <div className="space-y-5">
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" value={supBranchId} onChange={e => setSupBranchId(e.target.value)}>
                <option value="">Target Branch</option>
                {users.filter(u => u.role === UserRole.BRANCH).map(u => <option key={u.id} value={u.id}>{u.branchName}</option>)}
              </select>
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" value={supType} onChange={e => setSupType(e.target.value as ReceiptType)}>
                {Object.values(ReceiptType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Units (e.g. Boxes)" value={supUnits} onChange={e => setSupUnits(parseInt(e.target.value))} />
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowSupRequestModal(false)} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discard</button>
                <button onClick={() => { onRequestFromSupplier(supBranchId, supType, supUnits); setShowSupRequestModal(false); }} className="flex-1 bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Confirm Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-2 uppercase text-slate-900">Fulfillment Log</h3>
            <p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest">Update Warehouse with Delivered Stock</p>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" placeholder="Invoice Number" value={supBillingNo} onChange={e => setSupBillingNo(e.target.value)} />
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" placeholder="DR Number" value={supDRNo} onChange={e => setSupDRNo(e.target.value)} />
              <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" placeholder="Valuation (₱)" value={supAmount} onChange={e => setSupAmount(parseFloat(e.target.value))} />
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowSupConfirmModal(null)} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                <button onClick={() => { 
                  onConfirmSupplierDelivery(showSupConfirmModal, { billingInvoiceNo: supBillingNo, amount: supAmount, deliveryReceiptNo: supDRNo, deliveryDate: new Date().toISOString().split('T')[0] });
                  setShowSupConfirmModal(null);
                }} className="flex-1 bg-green-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Update Reserve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-8 uppercase text-slate-900">Branch Setup</h3>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-none" placeholder="Official Branch Name" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-none" placeholder="Parent Company" value={newBranchCompany} onChange={e => setNewBranchCompany(e.target.value)} />
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-none" placeholder="Access Username" value={newBranchUser} onChange={e => setNewBranchUser(e.target.value)} />
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowAddBranchModal(false)} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abort</button>
                <button onClick={() => { onAddBranch(newBranchName, newBranchCompany, newBranchUser); setShowAddBranchModal(false); }} className="flex-1 bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Create Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deliveryInput && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-8 uppercase text-slate-900">Series Dispatch</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Starting Control Number</label>
                <input type="number" className="w-full bg-slate-50 p-5 rounded-2xl font-mono font-black text-lg outline-none border-none focus:ring-2 focus:ring-indigo-500" value={deliveryInput.start} onChange={e => setDeliveryInput({...deliveryInput, start: e.target.value})} autoFocus />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setDeliveryInput(null)} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                <button onClick={() => onShip(deliveryInput.id, parseInt(deliveryInput.start))} className="flex-1 bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">Release Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
