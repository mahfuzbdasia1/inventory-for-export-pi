import React, { useState } from 'react';
import { Showroom, Expense, ExpenseCategory, UserRole } from '../types';
import { Plus, Wallet, Trash2, Calendar, MapPin, Tag, X, FileText } from 'lucide-react';

interface ExpensesProps {
  showrooms: Showroom[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  userRole: UserRole;
  assignedBranchId?: string;
}

const Expenses: React.FC<ExpensesProps> = ({ showrooms, expenses, onAddExpense, onDeleteExpense, userRole, assignedBranchId }) => {
  const isAdmin = userRole === 'ADMIN';
  const isSeller = userRole === 'SELLER';

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    showroomId: (isAdmin ? showrooms[0]?.id : assignedBranchId) || '',
    category: 'Miscellaneous' as ExpenseCategory,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const categories: ExpenseCategory[] = ['Conveyance', 'Rent', 'Electricity', 'Snacks', 'Utility', 'Miscellaneous'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      ...formData,
      amount: Number(formData.amount)
    });
    setShowAddModal(false);
    setFormData({
      ...formData,
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getCategoryColor = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Conveyance': return 'bg-blue-100 text-blue-600';
      case 'Rent': return 'bg-purple-100 text-purple-600';
      case 'Electricity': return 'bg-yellow-100 text-yellow-700';
      case 'Snacks': return 'bg-orange-100 text-orange-600';
      case 'Utility': return 'bg-teal-100 text-teal-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredExpenses = isAdmin 
    ? expenses 
    : expenses.filter(e => e.showroomId === assignedBranchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Business Expenses</h1>
          <p className="text-sm text-gray-500 font-medium">Log daily conveyance, utilities, and other overheads.</p>
        </div>
        {!isSeller && (
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
          >
            <Plus size={16} /> Record New Expense
          </button>
        )}
      </div>

      <div className="wp-card rounded-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Expense Logs</h3>
          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
            {isAdmin ? 'Showing all branches' : `Filtered for ${showrooms.find(s => s.id === assignedBranchId)?.name}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-600">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-800 uppercase tracking-tighter">{showrooms.find(s => s.id === e.showroomId)?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getCategoryColor(e.category)}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium max-w-xs truncate">{e.description}</td>
                  <td className="px-6 py-4 text-right font-black text-red-600">৳{e.amount.toLocaleString()}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onDeleteExpense(e.id)}
                        className="p-1.5 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-400 italic text-sm font-medium">No expenses recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && !isSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-red-50 flex justify-between items-center">
              <h2 className="font-black text-red-800 uppercase tracking-tight flex items-center gap-2"><Wallet size={18} /> Log Business Expense</h2>
              <button onClick={() => setShowAddModal(false)} className="text-red-400 hover:text-red-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                  <MapPin size={10} /> Select Branch
                </label>
                <select 
                  required
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-1 focus:ring-red-500 bg-white disabled:opacity-70 font-bold text-sm"
                  value={formData.showroomId}
                  onChange={e => setFormData({...formData, showroomId: e.target.value})}
                >
                  {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                    <Tag size={10} /> Category
                  </label>
                  <select 
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-1 focus:ring-red-500 bg-white font-bold text-xs"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                    <Calendar size={10} /> Date
                  </label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-1 focus:ring-red-500 font-bold text-xs"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                  <FileText size={10} /> Description / Notes
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Fuel for delivery van, Office tea..."
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-1 focus:ring-red-500 font-medium text-sm"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                  ৳ Amount
                </label>
                <input 
                  type="number"
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-1 focus:ring-red-500 text-xl font-black text-red-600"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 bg-red-600 text-white font-black uppercase tracking-widest rounded-md hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;