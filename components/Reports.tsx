import React, { useState, useMemo } from 'react';
import { Sale, Product, Showroom, Expense, UserRole } from '../types';
import { Search, Filter, Download, Calendar, User, MapPin, Trash2, Wallet } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  showrooms: Showroom[];
  onDeleteSale: (saleId: string) => void;
  expenses: Expense[];
  userRole: UserRole;
  assignedBranchId?: string;
}

const Reports: React.FC<ReportsProps> = ({ sales, products, showrooms, onDeleteSale, expenses, userRole, assignedBranchId }) => {
  const isAdmin = userRole === 'ADMIN';
  
  const [filterShowroom, setFilterShowroom] = useState(() => {
    if (!isAdmin && assignedBranchId) return assignedBranchId;
    return 'All';
  });
  
  const [reportTab, setReportTab] = useState<'sales' | 'expenses'>('sales');

  const filteredSales = sales.filter(s => {
    const matchesShowroom = filterShowroom === 'All' || s.showroomId === filterShowroom;
    return matchesShowroom;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesShowroom = filterShowroom === 'All' || e.showroomId === filterShowroom;
    return matchesShowroom;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Financial Reports & Logs</h1>
          <p className="text-sm text-gray-500 font-medium">Detailed transaction history for sales and expenses.</p>
        </div>
        <button className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors shadow-sm">
          <Download size={16} /> Export to Excel
        </button>
      </div>

      <div className="flex gap-1 bg-gray-200 p-1 rounded-sm w-fit">
        <button 
          onClick={() => setReportTab('sales')}
          className={`px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${reportTab === 'sales' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Sales Transactions
        </button>
        <button 
          onClick={() => setReportTab('expenses')}
          className={`px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${reportTab === 'expenses' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Expense Logs
        </button>
      </div>

      <div className="wp-card rounded-md">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1.5">
              <input type="date" className="text-xs font-bold focus:outline-none bg-transparent" />
              <span className="text-gray-300 text-xs">to</span>
              <input type="date" className="text-xs font-bold focus:outline-none bg-transparent" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select 
              disabled={!isAdmin}
              className="border border-gray-300 rounded px-3 py-2 text-xs font-bold bg-white min-w-[180px] disabled:opacity-60 cursor-pointer"
              value={filterShowroom}
              onChange={(e) => setFilterShowroom(e.target.value)}
            >
              {isAdmin && <option value="All">All Showrooms</option>}
              {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportTab === 'sales' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Showroom</th>
                  <th className="px-6 py-4">Customer Info</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Items</th>
                  <th className="px-6 py-4 text-right">VAT/Disc</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-black text-blue-600 uppercase">{sale.id}</td>
                    <td className="px-6 py-4 text-[11px] text-gray-600 font-medium">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{showrooms.find(s => s.id === sale.showroomId)?.name || 'Unknown'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                          <User size={10} className="text-gray-400" />
                          {sale.customerName || 'Walk-in'}
                        </div>
                        {sale.customerAddress && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                            <MapPin size={10} className="text-gray-400" />
                            {sale.customerAddress}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sale.type === 'SALE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sale.type}</span></td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-gray-600">{sale.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                    <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-bold uppercase tracking-tight">৳{sale.vat.toFixed(0)} / -৳{sale.discount.toFixed(0)}</td>
                    <td className="px-6 py-4 text-right"><span className={`text-sm font-black tracking-tight ${sale.type === 'SALE' ? 'text-gray-900' : 'text-red-600'}`}>{sale.type === 'SALE' ? '' : '-'}৳{Math.abs(sale.finalAmount).toLocaleString()}</span></td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onDeleteSale(sale.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="px-6 py-12 text-center text-gray-400 italic text-sm font-medium">No sales transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs font-black text-gray-800 uppercase tracking-tight">{showrooms.find(s => s.id === exp.showroomId)?.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase tracking-widest">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">{exp.description}</td>
                    <td className="px-6 py-4 text-right font-black text-red-600">৳{exp.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm font-medium">No expenses found for the selected showroom.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;