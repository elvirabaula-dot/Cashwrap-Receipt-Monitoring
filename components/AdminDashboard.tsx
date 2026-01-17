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
  const getBranchLastSeriesForType = (branchId: string, type: ReceiptType) => inventory.find(i => i.branchId === branchId && i.type === type)?.currentSeriesEnd || 0;

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
    const invoice = o.billingInvoiceNo?.toLowerCase() || '';
    return branchName.includes(query) || invoice.includes(query);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('home')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Warehouse</button>
        <button onClick={() => setActiveTab('supplier')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'supplier' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Supplier Orders</button>
        <button onClick={() => setActiveTab('billing')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Billing</button>
        <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Logistics</button>
        <button onClick={() => setActiveTab('search')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Inventory</button>
        <button onClick={() => setActiveTab('accounts')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Accounts</button>
      </div>

      {activeTab === 'home' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Warehouse Stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(warehouse).map(([branchId, items]) => (
              <div key={branchId} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-lg mb-4">{getBranchName(branchId)}</h4>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase">{item.type}</p>
                        <p className="text-sm font-black">{item.totalUnits} {item.unitLabel}s</p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">End: {getBranchLastSeriesForType(branchId, item.type).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Supplier Replenishment</h3>
            <button onClick={() => setShowSupRequestModal(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-sm">New Request</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Branch Allocation</th>
                  <th className="px-6 py-4">Receipt Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeSupOrders.map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 font-mono text-xs">{o.id}</td>
                    <td className="px-6 py-4 font-bold">{getBranchName(o.branchId)}</td>
                    <td className="px-6 py-4">{o.type}</td>
                    <td className="px-6 py-4">{o.quantityUnits} Units</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">{o.status}</span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {o.status === SupplierOrderStatus.REQUESTED && <button onClick={() => onUpdateSupplierStatus(o.id, SupplierOrderStatus.PROCESSED)} className="text-xs font-bold text-indigo-600">Process</button>}
                      {o.status === SupplierOrderStatus.PROCESSED && <button onClick={() => onUpdateSupplierStatus(o.id, SupplierOrderStatus.SHIPPED)} className="text-xs font-bold text-indigo-600">Ship</button>}
                      {o.status === SupplierOrderStatus.SHIPPED && <button onClick={() => setShowSupConfirmModal(o.id)} className="text-xs font-bold text-green-600">Receive</button>}
                    </td>
                  </tr>
                ))}
                {activeSupOrders.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No active supplier orders.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Billing & PRF Tracking</h3>
            <input type="text" placeholder="Search invoices..." className="border rounded-xl px-4 py-2 text-sm" value={billingSearch} onChange={e => setBillingSearch(e.target.value)} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">PRF #</th>
                  <th className="px-6 py-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBillingOrders.map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 text-xs">{o.deliveryDate}</td>
                    <td className="px-6 py-4 font-bold">{getBranchName(o.branchId)}</td>
                    <td className="px-6 py-4 font-mono">{o.billingInvoiceNo}</td>
                    <td className="px-6 py-4 font-black">₱{(o.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {o.prfNumber ? (
                        <span className="font-bold text-indigo-600">{o.prfNumber}</span>
                      ) : (
                        <button onClick={() => { setPrfEntryId(o.id); setPrfNumberInput(''); }} className="text-xs text-gray-400 italic hover:underline">Add PRF</button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => onUpdateSupplierDetails(o.id, { isPaid: !o.isPaid })} className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${o.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {o.isPaid ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Branch Logistics Queue</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] uppercase font-bold text-gray-400">
                <tr>
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.filter(o => o.status !== OrderStatus.RECEIVED).map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold">{o.branchName}</div>
                      <div className="text-[10px] text-gray-400">Req Date: {o.requestDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-indigo-600">{o.type}</div>
                      <div className="text-xs">{o.quantityUnits} Units</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${o.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {o.status === OrderStatus.PENDING && <button onClick={() => onApprove(o.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Approve</button>}
                      {o.status === OrderStatus.APPROVED && <button onClick={() => setDeliveryInput({ id: o.id, start: '' })} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Assign Series</button>}
                      {o.status === OrderStatus.IN_TRANSIT && <button onClick={() => onMarkDelivered(o.id)} className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-bold">Mark Delivered</button>}
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
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold">New Supplier Request</h3>
            <div className="space-y-4">
              <select className="w-full border p-3 rounded-xl" value={supBranchId} onChange={e => setSupBranchId(e.target.value)}>
                <option value="">Select Branch Allocation</option>
                {users.filter(u => u.role === UserRole.BRANCH).map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
              </select>
              <select className="w-full border p-3 rounded-xl" value={supType} onChange={e => setSupType(e.target.value as ReceiptType)}>
                {Object.values(ReceiptType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" className="w-full border p-3 rounded-xl" value={supUnits} onChange={e => setSupUnits(parseInt(e.target.value))} placeholder="Quantity of Units" />
              <div className="flex gap-2">
                <button onClick={() => setShowSupRequestModal(false)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
                <button onClick={() => { onRequestFromSupplier(supBranchId, supType, supUnits); setShowSupRequestModal(false); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold">Receive Supplier Delivery</h3>
            <div className="space-y-4">
              <input className="w-full border p-3 rounded-xl" placeholder="Billing Invoice No" value={supBillingNo} onChange={e => setSupBillingNo(e.target.value)} />
              <input type="number" className="w-full border p-3 rounded-xl" placeholder="Total Amount (₱)" value={supAmount} onChange={e => setSupAmount(parseFloat(e.target.value))} />
              <input className="w-full border p-3 rounded-xl" placeholder="Delivery Receipt No" value={supDRNo} onChange={e => setSupDRNo(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setShowSupConfirmModal(null)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
                <button onClick={() => { 
                  onConfirmSupplierDelivery(showSupConfirmModal, { billingInvoiceNo: supBillingNo, amount: supAmount, deliveryReceiptNo: supDRNo, deliveryDate: supDelDate }); 
                  setShowSupConfirmModal(null);
                }} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {prfEntryId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-4">
            <h3 className="text-xl font-bold">Assign PRF Number</h3>
            <input className="w-full border p-3 rounded-xl" placeholder="Enter PRF #" value={prfNumberInput} onChange={e => setPrfNumberInput(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setPrfEntryId(null)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
              <button onClick={() => { onUpdateSupplierDetails(prfEntryId, { prfNumber: prfNumberInput }); setPrfEntryId(null); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {deliveryInput && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-4">
            <h3 className="text-xl font-bold">Assign Series Start</h3>
            <input type="number" className="w-full border p-3 rounded-xl" placeholder="Starting Number" value={deliveryInput.start} onChange={e => setDeliveryInput({ ...deliveryInput, start: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={() => setDeliveryInput(null)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
              <button onClick={() => { onShip(deliveryInput.id, parseInt(deliveryInput.start)); setDeliveryInput(null); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Ship Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;