import React, { useState } from 'react';
import { Sale, Showroom, UserRole } from '../types';
import { Search, RotateCcw, Calendar, Store, ChevronRight, CheckCircle } from 'lucide-react';

interface ReturnsProps {
  sales: Sale[];
  showrooms: Showroom[];
  onReturn: (saleId: string) => void;
  userRole: UserRole;
  assignedBranchId?: string;
}

const Returns: React.FC<ReturnsProps> = ({ sales, showrooms, onReturn, userRole, assignedBranchId }) => {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const isAdmin = userRole === 'ADMIN';
  
  const salesOnly = sales.filter(s => {
    // Role based filtering: Sellers and Managers only see their branch
    const matchesBranch = isAdmin || s.showroomId === assignedBranchId;
    return s.type === 'SALE' && matchesBranch;
  });

  const filteredSales = salesOnly.filter(s => s.id.toLowerCase().includes(invoiceSearch.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 text-red-600 rounded shadow-sm"><RotateCcw size={24} /></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Return & Exchange</h1>
          <p className="text-sm text-gray-500 font-medium">Search for an invoice to process a return</p>
        </div>
      </div>

      <div className="wp-card p-6 rounded-md shadow-sm">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input 
            type="text" 
            placeholder="Enter Invoice Number (e.g. INV-123456)..." 
            className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded focus:ring-1 focus:ring-red-500 text-lg font-bold" 
            value={invoiceSearch} 
            onChange={(e) => setInvoiceSearch(e.target.value)} 
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isAdmin ? 'Global Transaction Log' : 'Branch Transaction Log'}
            </h3>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{filteredSales.length} found</span>
          </div>
          
          <div className="divide-y divide-gray-100 border rounded overflow-hidden">
            {filteredSales.length > 0 ? filteredSales.map(sale => (
              <div 
                key={sale.id} 
                className={`group p-4 bg-white transition-all flex items-center justify-between ${
                  sale.isReturned ? 'bg-gray-50/50 opacity-80' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    sale.isReturned ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-gray-100 text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 border border-transparent'
                  }`}>
                    {sale.isReturned ? <CheckCircle size={20} /> : <RotateCcw size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 uppercase tracking-tight">{sale.id}</span>
                      {sale.isReturned && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-black rounded uppercase tracking-tighter">Already Returned</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(sale.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Store size={12} /> {showrooms.find(s => s.id === sale.showroomId)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">৳{sale.finalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{sale.items.length} items</p>
                  </div>
                  {!sale.isReturned ? (
                    <button 
                      onClick={() => onReturn(sale.id)} 
                      className="px-4 py-2 bg-red-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-red-700 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                    >
                      Return <ChevronRight size={14} />
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-400 rounded text-xs font-black uppercase tracking-widest cursor-not-allowed border border-gray-200">
                      Completed
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-gray-400 bg-gray-50 italic text-sm font-medium">
                No matching invoices found in your branch access.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Returns;