
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Product, StockItem, Showroom, Category, UserRole } from '../types';
import { Search, Filter, Plus, Edit, Trash2, ArrowRightLeft, X, ShoppingCart, Image as ImageIcon, Store, ShieldAlert, Download, PackageOpen } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  stock: StockItem[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setStock: React.Dispatch<React.SetStateAction<StockItem[]>>;
  onAddStock: (productId: string, showroomId: string, quantity: number) => void;
  onTransferStock: (productId: string, fromId: string, toId: string, quantity: number) => void;
  showrooms: Showroom[];
  categories: Category[];
  userRole: UserRole;
  assignedBranchId?: string;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  stock, 
  setProducts, 
  setStock, 
  onAddStock, 
  onTransferStock, 
  showrooms, 
  categories,
  userRole,
  assignedBranchId 
}) => {
  const location = useLocation();
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isSeller = userRole === 'SELLER';
  
  // Managers and Admins can manage inventory
  const canManageInventory = isAdmin || isManager;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterShowroom, setFilterShowroom] = useState<string>(() => {
    if (!isAdmin && assignedBranchId) return assignedBranchId;
    return 'All';
  });

  useEffect(() => {
    if (isAdmin && location.state && (location.state as any).filterShowroom) {
      setFilterShowroom((location.state as any).filterShowroom);
    }
  }, [location.state, isAdmin]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transferData, setTransferData] = useState({ 
    fromId: (isAdmin ? showrooms[0]?.id : assignedBranchId) || '', 
    toId: showrooms.find(s => s.id !== (isAdmin ? showrooms[0]?.id : assignedBranchId))?.id || '', 
    quantity: 1 
  });
  const [purchaseData, setPurchaseData] = useState({ 
    showroomId: (isAdmin ? showrooms[0]?.id : assignedBranchId) || '', 
    quantity: 1 
  });

  const [formData, setFormData] = useState({
    name: '', 
    brand: '', 
    category: categories[0]?.name || '', 
    size: '', 
    color: '', 
    costPrice: 0, 
    sellingPrice: 0, 
    imageUrl: '',
    initialShowroomId: (isAdmin ? showrooms[0]?.id : assignedBranchId) || '',
    initialQuantity: 0
  });

  const getStockCount = (productId: string, showroomId?: string) => {
    if (showroomId) return stock.find(s => s.productId === productId && s.showroomId === showroomId)?.quantity || 0;
    return stock.filter(s => s.productId === productId).reduce((acc, s) => acc + s.quantity, 0);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    let matchesShowroom = true;
    if (filterShowroom !== 'All') {
      const branchQty = getStockCount(p.id, filterShowroom);
      matchesShowroom = branchQty > 0 || !isSeller;
    }
    return matchesSearch && matchesCategory && matchesShowroom;
  });

  const handleOpenAdd = () => {
    if (isSeller) return;
    setFormData({ 
      name: '', 
      brand: '', 
      category: categories[0]?.name || '', 
      size: '', 
      color: '', 
      costPrice: 0, 
      sellingPrice: 0, 
      imageUrl: '',
      initialShowroomId: (isAdmin ? showrooms[0]?.id : assignedBranchId) || '',
      initialQuantity: 0
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    if (isSeller) return;
    setSelectedProduct(p);
    setFormData({ 
      name: p.name,
      brand: p.brand,
      category: p.category,
      size: p.size,
      color: p.color,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      imageUrl: p.imageUrl || '',
      initialShowroomId: '',
      initialQuantity: 0
    });
    setShowEditModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (showAddModal) {
      const id = `p${Date.now()}`;
      const { initialShowroomId, initialQuantity, ...productData } = formData;
      setProducts(prev => [...prev, { ...productData, id }]);
      if (initialQuantity > 0) {
        setStock(prev => [
          ...prev, 
          { 
            id: `st-${id}-${initialShowroomId}`, 
            productId: id, 
            showroomId: initialShowroomId, 
            quantity: initialQuantity 
          }
        ]);
      }
    } else if (showEditModal && selectedProduct) {
      const { initialShowroomId, initialQuantity, ...productData } = formData;
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...productData, id: p.id } : p));
    }
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    onTransferStock(selectedProduct.id, transferData.fromId, transferData.toId, transferData.quantity);
    setShowTransferModal(false);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    onAddStock(selectedProduct.id, purchaseData.showroomId, purchaseData.quantity);
    setShowPurchaseModal(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Authorization check
    if (!canManageInventory) {
      alert("Insufficient permissions: Only Admins or Managers can delete products.");
      return;
    }

    if (window.confirm("CRITICAL ACTION: Are you sure you want to permanently delete this product? This will also wipe all associated stock records across all branches and cannot be undone.")) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setStock(prev => prev.filter(s => s.productId !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Inventory Control</h1>
          <p className="text-sm text-gray-500 font-medium">Monitor stock levels across all showroom branches.</p>
        </div>
        <div className="flex gap-2">
           {canManageInventory && (
            <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              <Plus size={16} /> Register Product
            </button>
          )}
        </div>
      </div>

      <div className="wp-card rounded-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search by name or brand..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 flex-1 md:flex-none">
              <Filter size={14} className="text-gray-400" />
              <select className="py-2 text-xs font-bold focus:outline-none bg-transparent" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 flex-1 md:flex-none">
              <Store size={14} className="text-gray-400" />
              <select 
                disabled={!isAdmin}
                className="py-2 text-xs font-bold focus:outline-none bg-transparent disabled:opacity-60 cursor-pointer" 
                value={filterShowroom} 
                onChange={e => setFilterShowroom(e.target.value)}
              >
                {isAdmin && <option value="All">Global Stock</option>}
                {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Price (Retail)</th>
                <th className="px-6 py-4 text-center">In Stock</th>
                <th className="px-6 py-4">Branch Status</th>
                {!isSeller && <th className="px-6 py-4 text-right">Inventory Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(p => {
                const displayQty = filterShowroom === 'All' ? getStockCount(p.id) : getStockCount(p.id, filterShowroom);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{p.brand} • Size {p.size} • {p.color}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900 tracking-tight">৳{p.sellingPrice.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Cost: ৳{p.costPrice}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black ${displayQty < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {displayQty} QTY
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {showrooms.map(s => {
                          const count = getStockCount(p.id, s.id);
                          if (!isAdmin && s.id !== assignedBranchId) return null;
                          if (count === 0 && !isAdmin) return null;
                          return (
                            <div key={s.id} className={`text-[9px] px-1.5 py-0.5 rounded font-black border uppercase tracking-tighter ${count < 3 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-200 text-gray-500'}`}>
                              {s.name.split(' ')[0]}: {count}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    {!isSeller && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 transition-opacity">
                          <button onClick={() => { setSelectedProduct(p); setShowPurchaseModal(true); }} className="px-2 py-1 bg-green-50 text-green-700 rounded text-[9px] font-black uppercase hover:bg-green-100 border border-green-200 shadow-sm cursor-pointer transition-all active:scale-95">Entry</button>
                          {isAdmin && <button onClick={() => { setSelectedProduct(p); setShowTransferModal(true); }} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-[9px] font-black uppercase hover:bg-orange-100 border border-orange-200 shadow-sm cursor-pointer transition-all active:scale-95">Transfer</button>}
                          <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-all active:scale-95" title="Edit Product"><Edit size={14} /></button>
                          {canManageInventory && <button onClick={(e) => handleDelete(e, p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all active:scale-95 cursor-pointer" title="Delete Product"><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-black text-gray-900 uppercase tracking-tight">{showAddModal ? 'Register New Product' : 'Edit Product Details'}</h2>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Model Name</label><input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Brand</label><input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 text-sm" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</label><select className="w-full border p-2 rounded text-sm font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Size</label><input required className="w-full border p-2 rounded text-sm" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Color Variant</label><input required className="w-full border p-2 rounded text-sm" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Purchase Cost (৳)</label><input required type="number" className="w-full border p-2 rounded font-black text-red-600" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Selling Price (৳)</label><input required type="number" className="w-full border p-2 rounded font-black text-blue-600" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} /></div>
              <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Image URL</label><input className="w-full border p-2 rounded text-sm" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} /></div>
              
              {showAddModal && (
                <>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Initial Stock Branch</label><select className="w-full border p-2 rounded text-sm font-bold" value={formData.initialShowroomId} onChange={e => setFormData({...formData, initialShowroomId: e.target.value})}>{showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Initial Qty</label><input type="number" className="w-full border p-2 rounded text-sm font-bold" value={formData.initialQuantity} onChange={e => setFormData({...formData, initialQuantity: Number(e.target.value)})} /></div>
                </>
              )}

              <div className="col-span-2 pt-4 border-t flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-black rounded shadow-lg shadow-blue-500/20 uppercase text-xs tracking-widest active:scale-95 transition-all cursor-pointer">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-orange-50 flex justify-between items-center text-orange-900">
              <h2 className="font-black uppercase tracking-tight flex items-center gap-2 text-sm sm:text-base"><ArrowRightLeft size={18} /> Internal Stock Transfer</h2>
              <button onClick={() => setShowTransferModal(false)} className="text-orange-400 hover:text-orange-600 cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div className="bg-orange-50/50 p-3 rounded border border-orange-100">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Selected Model</p>
                <p className="font-bold text-gray-900">{selectedProduct.brand} {selectedProduct.name}</p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Current Global Pool: {getStockCount(selectedProduct.id)} units</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">From Source</label>
                  <select className="w-full border p-2 rounded text-sm font-bold" value={transferData.fromId} onChange={e => setTransferData({...transferData, fromId: e.target.value})}>{showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">To Destination</label>
                  <select className="w-full border p-2 rounded text-sm font-bold" value={transferData.toId} onChange={e => setTransferData({...transferData, toId: e.target.value})}>{showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Quantity to Move</label>
                <input type="number" min="1" required className="w-full border p-3 rounded text-xl font-black text-orange-600 focus:ring-1 focus:ring-orange-500 outline-none" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: Number(e.target.value)})} />
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-tighter">Available in source branch: {getStockCount(selectedProduct.id, transferData.fromId)} QTY</p>
              </div>
              <div className="pt-4 flex gap-3 border-t">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:bg-gray-50 transition-all">Discard</button>
                <button type="submit" className="flex-[2] py-3 bg-orange-600 text-white font-black uppercase rounded shadow-lg shadow-orange-500/20 tracking-widest text-xs active:scale-95 transition-all cursor-pointer">Execute Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Entry Modal */}
      {showPurchaseModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-green-50 flex justify-between items-center text-green-900">
              <h2 className="font-black uppercase tracking-tight flex items-center gap-2 text-sm sm:text-base"><PackageOpen size={18} /> Purchase Inward Entry</h2>
              <button onClick={() => setShowPurchaseModal(false)} className="text-green-400 hover:text-green-600 cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handlePurchaseSubmit} className="p-6 space-y-4">
              <div className="bg-green-50/50 p-3 rounded border border-green-100">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Model for Restocking</p>
                <p className="font-bold text-gray-900">{selectedProduct.brand} {selectedProduct.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inward Destination (Branch)</label>
                <select className="w-full border p-2.5 rounded text-sm font-bold" value={purchaseData.showroomId} onChange={e => setPurchaseData({...purchaseData, showroomId: e.target.value})}>{showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Entry Quantity (New Stock)</label>
                <input type="number" min="1" required className="w-full border p-3 rounded text-xl font-black text-green-600 focus:ring-1 focus:ring-green-500 outline-none" value={purchaseData.quantity} onChange={e => setPurchaseData({...purchaseData, quantity: Number(e.target.value)})} />
              </div>
              <div className="pt-4 flex gap-3 border-t">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-green-600 text-white font-black uppercase rounded shadow-lg shadow-green-500/20 tracking-widest text-xs active:scale-95 transition-all cursor-pointer">Authorize Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
