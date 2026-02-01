import React, { useState } from 'react';
import { User, UserRole, Showroom, SalaryPayment, Expense, StaffRole } from '../types';
import { Users, Plus, Edit, Trash2, Wallet, Calendar, Search, MapPin, X, CheckCircle, DollarSign, BadgeCheck, Briefcase, UserCheck, UserX, Printer, FileText, Download, ShieldCheck } from 'lucide-react';

declare var html2pdf: any;

interface StaffManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  showrooms: Showroom[];
  onAddSalaryExpense: (expense: Omit<Expense, 'id'>) => void;
  salaryPayments: SalaryPayment[];
  setSalaryPayments: React.Dispatch<React.SetStateAction<SalaryPayment[]>>;
  currentUser: User;
  staffRoles: StaffRole[];
}

const StaffManagement: React.FC<StaffManagementProps> = ({ 
  users, 
  setUsers, 
  showrooms, 
  onAddSalaryExpense,
  salaryPayments = [], 
  setSalaryPayments,
  currentUser,
  staffRoles
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll'>('directory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{payment: SalaryPayment, user: User} | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    fullName: '',
    username: '',
    roleId: '',
    assignedShowroomId: '',
    baseSalary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    phoneNumber: '',
    status: 'ACTIVE'
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      username: '',
      roleId: staffRoles[0]?.id || '',
      assignedShowroomId: showrooms[0]?.id || '',
      baseSalary: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      phoneNumber: '',
      status: 'ACTIVE'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingStaff(user);
    const matchingRole = staffRoles.find(r => r.id === user.roleId) || 
                         staffRoles.find(r => r.accessLevel === user.role) || 
                         staffRoles[0];

    setFormData({
      fullName: user.fullName,
      username: user.username,
      roleId: matchingRole.id,
      assignedShowroomId: user.assignedShowroomId || showrooms[0]?.id || '',
      baseSalary: user.baseSalary,
      joiningDate: user.joiningDate,
      phoneNumber: user.phoneNumber || '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRole = staffRoles.find(r => r.id === formData.roleId);
    if (!selectedRole) return alert("Please select a valid job role.");

    const newUser: User = {
      ...formData as User,
      id: `u-${Date.now()}`,
      username: formData.username?.toLowerCase() || '',
      password: formData.username?.toLowerCase() + '123',
      role: selectedRole.accessLevel,
      roleId: selectedRole.id,
      status: formData.status as 'ACTIVE' | 'INACTIVE'
    };
    setUsers(prev => [...prev, newUser]);
    setShowAddModal(false);
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const selectedRole = staffRoles.find(r => r.id === formData.roleId);
    if (!selectedRole) return alert("Job role selection is invalid.");

    setUsers(prev => prev.map(u => u.id === editingStaff.id ? {
      ...u,
      fullName: formData.fullName || u.fullName,
      phoneNumber: formData.phoneNumber || u.phoneNumber,
      status: (formData.status as 'ACTIVE' | 'INACTIVE') || u.status,
      role: selectedRole.accessLevel,
      roleId: selectedRole.id,
      assignedShowroomId: selectedRole.accessLevel === 'ADMIN' ? undefined : formData.assignedShowroomId,
      baseSalary: formData.baseSalary !== undefined ? formData.baseSalary : u.baseSalary,
      joiningDate: formData.joiningDate || u.joiningDate
    } as User : u));

    setShowEditModal(false);
    setEditingStaff(null);
  };

  // Helper for resilient month comparison
  const isPaidForMonth = (userId: string, targetMonth: string) => {
    if (!Array.isArray(salaryPayments)) return false;
    const normalizedTarget = targetMonth.replace(/\s+/g, ' ').trim().toLowerCase();
    return salaryPayments.some(p => 
      p && p.userId === userId && 
      p.month && p.month.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedTarget
    );
  };

  const handleProcessSalary = (user: User) => {
    if (!user || !user.id) return;

    // Explicitly treat baseSalary as a number and validate
    const salaryAmount = Number(user.baseSalary) || 0;
    
    if (salaryAmount <= 0) {
      alert(`Cannot process payment: ${user.fullName} has no defined base salary or it is zero. Please update their profile first.`);
      return;
    }

    if (isPaidForMonth(user.id, selectedMonth)) {
      alert(`Payroll for ${user.fullName} has already been recorded for ${selectedMonth}.`);
      return;
    }

    const confirmMsg = `CONFIRM PAYROLL DISBURSEMENT\n\nEmployee: ${user.fullName}\nPeriod: ${selectedMonth}\nAmount: ৳${salaryAmount.toLocaleString()}\n\nAuthorize this transaction?`;

    if (window.confirm(confirmMsg)) {
      try {
        const targetShowroomId = user.assignedShowroomId || (showrooms.length > 0 ? showrooms[0].id : 'wh');

        const payment: SalaryPayment = {
          id: `SAL-${Date.now().toString().slice(-6)}`,
          userId: user.id,
          showroomId: targetShowroomId,
          amount: salaryAmount,
          month: selectedMonth,
          datePaid: new Date().toISOString()
        };

        // 1. Log the Business Expense first (Critical for financial integrity)
        onAddSalaryExpense({
          showroomId: targetShowroomId,
          category: 'Salary',
          description: `Payroll Disbursed: ${user.fullName} for ${selectedMonth}`,
          amount: salaryAmount,
          date: new Date().toISOString()
        });

        // 2. Update the system payroll records state
        setSalaryPayments(prev => {
          const current = Array.isArray(prev) ? prev : [];
          return [...current, payment];
        });

        // 3. Trigger receipt display for verification
        setSelectedReceipt({ payment, user });
        setShowReceipt(true);
      } catch (err) {
        console.error("Critical Payroll Process Error:", err);
        alert("The system failed to finalize the payment due to an internal error.");
      }
    }
  };

  const handleViewHistoricalReceipt = (user: User) => {
    if (!Array.isArray(salaryPayments)) return;
    const normalizedSelected = selectedMonth.replace(/\s+/g, ' ').trim().toLowerCase();
    const payment = salaryPayments.find(p => 
      p && p.userId === user.id && 
      p.month && p.month.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedSelected
    );
    if (payment) {
      setSelectedReceipt({ payment, user });
      setShowReceipt(true);
    }
  };

  const handleSavePDF = () => {
    if (!selectedReceipt) return;
    const element = document.getElementById('salary-voucher-content');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `Salary_Slip_${selectedReceipt.user.fullName.replace(/\s+/g, '_')}_${selectedReceipt.payment.month.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const deleteStaff = (id: string) => {
    if (id === currentUser.id) return alert("Protection: You cannot delete your own account.");
    if (window.confirm("Permanently remove this employee's access?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">HR & Payroll System</h1>
          <p className="text-sm text-gray-500 font-medium">Manage human resources and monthly salary disbursements.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded border border-gray-200 shadow-sm w-fit">
           <button 
            type="button"
            onClick={() => setActiveTab('directory')} 
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'directory' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Staff Directory
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('payroll')} 
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'payroll' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Payroll Processing
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search staff members..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button 
              type="button"
              onClick={handleOpenAdd} 
              className="bg-gray-900 text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer active:scale-95 shadow-md w-full sm:w-auto"
            >
              <Plus size={16} /> Register New Employee
            </button>
          </div>

          <div className="wp-card rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                    <th className="px-6 py-4">Employee Info</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 font-black">Monthly Salary</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 group transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 shrink-0" alt="" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{u.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">@{u.username} • {u.phoneNumber || 'No Phone'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{staffRoles.find(r => r.id === u.roleId)?.name || (u.role === 'ADMIN' ? 'System Admin' : 'Staff')}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{u.role} Access</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-tight">
                          {showrooms.find(s => s.id === u.assignedShowroomId)?.name || 'Admin HQ'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">৳{u.baseSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => handleOpenEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"><Edit size={14} /></button>
                          <button type="button" onClick={() => deleteStaff(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="bg-green-50 border border-green-100 p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-green-900 uppercase tracking-tight">Payroll Disbursement Period</h3>
                <p className="text-xs text-green-700 font-bold">{selectedMonth}</p>
              </div>
            </div>
            <select 
              className="bg-white border border-green-200 text-xs font-bold p-2.5 rounded shadow-sm cursor-pointer hover:border-green-400 transition-colors focus:ring-2 focus:ring-green-500/20 w-full sm:w-auto" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {Array.from({length: 12}).map((_, i) => {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                const val = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.filter(u => u.status === 'ACTIVE').map(user => {
              const isPaid = isPaidForMonth(user.id, selectedMonth);
              return (
                <div key={user.id} className={`wp-card p-6 rounded-lg border-l-4 transition-all duration-200 ${isPaid ? 'border-green-500 bg-green-50/10' : 'border-gray-200 hover:border-blue-500 hover:shadow-lg'}`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10" alt="" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{user.fullName}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">{staffRoles.find(r => r.id === user.roleId)?.name || (user.role === 'ADMIN' ? 'System Admin' : 'Staff')}</p>
                      </div>
                    </div>
                    {isPaid && <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-tighter bg-green-100 px-2 py-1 rounded shrink-0"><BadgeCheck size={14} /> Paid</span>}
                  </div>
                  <div className="space-y-3 mb-6 bg-gray-50/50 p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Base Salary</span>
                      <span className="font-black text-gray-900">৳{user.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Branch</span>
                      <span className="font-bold text-gray-600 truncate ml-2 text-right">{showrooms.find(s => s.id === user.assignedShowroomId)?.name || 'Admin HQ'}</span>
                    </div>
                  </div>
                  {!isPaid ? (
                    <button 
                      type="button"
                      onClick={() => handleProcessSalary(user)} 
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <DollarSign size={14} /> Process Payment
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleViewHistoricalReceipt(user)}
                      className="w-full py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest rounded border border-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <FileText size={14} /> View Receipt
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Salary Receipt Modal */}
      {showReceipt && selectedReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print:shadow-none print:w-full print:m-0" id="salary-voucher">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2 text-green-600 font-bold">
                <CheckCircle size={20} /> Disbursement Voucher
              </div>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto print:overflow-visible" id="salary-voucher-content">
              <div className="p-8 space-y-8 print:p-8">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">SALARY DISBURSEMENT RECEIPT</h1>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Official Business Document</p>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-dashed border-gray-200 py-6 text-xs print:text-sm">
                  <div className="space-y-3">
                    <p className="font-black text-gray-400 uppercase text-[9px]">Employee Details</p>
                    <div>
                      <p className="text-gray-900 font-black">{selectedReceipt.user.fullName}</p>
                      <p className="text-gray-500 font-bold uppercase text-[10px]">{staffRoles.find(r => r.id === selectedReceipt.user.roleId)?.name || 'Staff'}</p>
                      <p className="text-gray-400 mt-1">ID: {selectedReceipt.user.id}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-right">
                    <p className="font-black text-gray-400 uppercase text-[9px]">Voucher Info</p>
                    <div>
                      <p className="text-gray-900 font-black">Ref: {selectedReceipt.payment.id}</p>
                      <p className="text-gray-500 font-bold uppercase text-[10px]">Issued: {new Date(selectedReceipt.payment.datePaid).toLocaleDateString()}</p>
                      <p className="text-gray-400 mt-1">{showrooms.find(s => s.id === selectedReceipt.payment.showroomId)?.name || 'Main HQ'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest border-b pb-2">Payment Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold uppercase text-[11px]">Salary Period</span>
                      <span className="font-black text-gray-900">{selectedReceipt.payment.month}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold uppercase text-[11px]">Basic Pay Amount</span>
                      <span className="font-black text-gray-900">৳{selectedReceipt.payment.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-center">
                    <span className="text-gray-900 font-black uppercase text-base">Net Paid</span>
                    <span className="text-2xl font-black text-blue-600">৳{selectedReceipt.payment.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-16 pb-6 flex justify-between gap-12 print:pt-24">
                  <div className="flex-1 text-center space-y-2">
                    <div className="border-t border-gray-300 pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Employee Signature</p>
                    </div>
                  </div>
                  <div className="flex-1 text-center space-y-2">
                    <div className="border-t border-gray-300 pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Authorized By</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-2 print:hidden shrink-0">
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-3 bg-gray-900 text-white rounded font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg cursor-pointer"
              >
                <Printer size={16} /> Print
              </button>
              <button 
                onClick={handleSavePDF} 
                className="flex-1 py-3 bg-blue-600 text-white rounded font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg cursor-pointer"
              >
                <Download size={16} /> Save PDF
              </button>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base">Register New Employee</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="cursor-pointer text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleAddStaff} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Full Name</label><input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 text-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Username</label><input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 text-sm" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Phone Number</label><input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 text-sm" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Select Job Role</label><select className="w-full border p-2 rounded text-sm" value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}><option value="">-- Choose Role --</option>{staffRoles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.accessLevel})</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Branch</label><select className="w-full border p-2 rounded text-sm" value={formData.assignedShowroomId} onChange={e => setFormData({...formData, assignedShowroomId: e.target.value})}>{showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Monthly Salary (৳)</label><input type="number" required className="w-full border p-2 rounded font-black text-blue-600 text-sm" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Joining Date</label><input type="date" required className="w-full border p-2 rounded text-sm" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} /></div>
                <div className="sm:col-span-2 pt-4 border-t flex flex-col sm:flex-row justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer order-2 sm:order-1">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-black rounded uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 cursor-pointer order-1 sm:order-2">Register Staff</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center shrink-0">
              <h2 className="font-black text-blue-900 uppercase tracking-tight flex items-center gap-2 text-sm sm:text-base">
                <Edit size={18} /> Edit Employee Profile
              </h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-blue-400 hover:text-blue-600 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdateStaff} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                  <input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 font-bold text-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">System Username</label>
                  <div className="flex items-center gap-2 bg-gray-50 border p-2 rounded text-gray-400 text-sm font-mono cursor-not-allowed">
                    <ShieldCheck size={14} />
                    {formData.username}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Phone Number</label>
                  <input required className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 text-sm" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Employment Status</label>
                  <select className="w-full border p-2 rounded font-bold text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Job Role / Designation</label>
                  <select className="w-full border p-2 rounded text-sm" value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}>
                    {staffRoles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.accessLevel})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Assigned Branch</label>
                  <select className="w-full border p-2 rounded text-sm" value={formData.assignedShowroomId} onChange={e => setFormData({...formData, assignedShowroomId: e.target.value})}>
                    {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Monthly Salary (৳)</label>
                  <input type="number" required className="w-full border p-2 rounded font-black text-blue-600 text-sm" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Joining Date</label>
                  <input type="date" required className="w-full border p-2 rounded text-sm" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
                </div>
                <div className="sm:col-span-2 pt-4 border-t flex flex-col sm:flex-row justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer order-2 sm:order-1">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-black rounded uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer order-1 sm:order-2">Update Profile</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          #salary-voucher {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          body > *:not(#salary-voucher) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StaffManagement;