import React, { useState, useMemo } from 'react';
import { User, UserRole, Showroom, SalaryPayment, Expense, StaffRole } from '../types';
import { Users, Plus, Edit, Trash2, Wallet, Calendar, Search, MapPin, X, CheckCircle, DollarSign, BadgeCheck, Briefcase, UserCheck, UserX, Printer, FileText, Download, ShieldCheck, History, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll' | 'sheet'>('directory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [selectedUserForPay, setSelectedUserForPay] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{payment: SalaryPayment, user: User} | null>(null);

  // Pay Modal State
  const [payFormData, setPayFormData] = useState({
    bonus: 0,
    deduction: 0,
    note: ''
  });

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

  const isPaidForMonth = (userId: string, targetMonth: string) => {
    if (!Array.isArray(salaryPayments)) return false;
    const normalizedTarget = targetMonth.trim().toLowerCase();
    return salaryPayments.some(p => 
      p && p.userId === userId && 
      p.month && p.month.trim().toLowerCase() === normalizedTarget
    );
  };

  const handleOpenPayModal = (user: User) => {
    if (isPaidForMonth(user.id, selectedMonth)) {
      alert(`Salary already paid for this month: ${user.fullName} has already received payment for ${selectedMonth}.`);
      return;
    }
    setSelectedUserForPay(user);
    setPayFormData({ bonus: 0, deduction: 0, note: '' });
    setShowPayModal(true);
  };

  const handleProcessSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPay) return;

    // Duplication Check (Re-verify inside transaction)
    if (isPaidForMonth(selectedUserForPay.id, selectedMonth)) {
      alert("Salary already paid for this month.");
      setShowPayModal(false);
      return;
    }

    const basicSalary = Number(selectedUserForPay.baseSalary) || 0;
    const bonus = Number(payFormData.bonus) || 0;
    const deduction = Number(payFormData.deduction) || 0;
    const netSalary = basicSalary + bonus - deduction;

    try {
      const targetShowroomId = selectedUserForPay.assignedShowroomId || (showrooms.length > 0 ? showrooms[0].id : 'wh');

      const payment: SalaryPayment = {
        id: `SAL-${Date.now().toString().slice(-6)}`,
        userId: selectedUserForPay.id,
        showroomId: targetShowroomId,
        basicSalary: basicSalary,
        bonus: bonus,
        deduction: deduction,
        amount: netSalary,
        month: selectedMonth,
        datePaid: new Date().toISOString(),
        note: payFormData.note,
        status: 'Paid'
      };

      // 1. Log Business Expense
      onAddSalaryExpense({
        showroomId: targetShowroomId,
        category: 'Salary',
        description: `Payroll: ${selectedUserForPay.fullName} (${selectedMonth}) [Basic: ৳${basicSalary} + Bonus: ৳${bonus} - Ded: ৳${deduction}]`,
        amount: netSalary,
        date: new Date().toISOString()
      });

      // 2. Save Payment Record
      setSalaryPayments(prev => [...prev, payment]);

      // 3. UI Response
      setShowPayModal(false);
      setSelectedReceipt({ payment, user: selectedUserForPay });
      setShowReceipt(true);
      
      // Success Notification
      alert(`Payment Successful: ৳${netSalary.toLocaleString()} disbursed to ${selectedUserForPay.fullName} for ${selectedMonth}.`);
    } catch (err) {
      alert("Critical Error: The payroll process failed to finalize.");
    }
  };

  const handleViewHistoricalReceipt = (user: User) => {
    if (!Array.isArray(salaryPayments)) return;
    const normalizedSelected = selectedMonth.trim().toLowerCase();
    const payment = salaryPayments.find(p => 
      p && p.userId === user.id && 
      p.month && p.month.trim().toLowerCase() === normalizedSelected
    );
    if (payment) {
      setSelectedReceipt({ payment, user });
      setShowReceipt(true);
    }
  };

  const handleSavePDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `${filename}.pdf`,
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

  const salarySheetData = useMemo(() => {
    return salaryPayments.map(p => {
      const user = users.find(u => u.id === p.userId);
      return { ...p, user };
    }).sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
  }, [salaryPayments, users]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Staff & Salary Management</h1>
          <p className="text-sm text-gray-500 font-medium">Enterprise workforce hub for multi-branch payroll processing.</p>
        </div>
        <div className="flex gap-1 bg-white p-1 rounded border border-gray-200 shadow-sm w-fit">
           <button onClick={() => setActiveTab('directory')} className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Staff Directory</button>
           <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Pay Salary</button>
           <button onClick={() => setActiveTab('sheet')} className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sheet' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Salary Sheet</button>
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search staff members..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleOpenAdd} className="bg-gray-900 text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md w-full sm:w-auto">
              <Plus size={16} /> Register Staff
            </button>
          </div>

          <div className="wp-card rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4 text-center">Assigned Branch</th>
                    <th className="px-6 py-4">Base Salary</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-9 h-9 rounded-full border" alt="" />
                        <div><p className="font-bold text-gray-900">{u.fullName}</p><p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">ID: {u.id}</p></div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{staffRoles.find(r => r.id === u.roleId)?.name || 'Staff'}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">
                          {showrooms.find(s => s.id === u.assignedShowroomId)?.name || 'Admin Center'}
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">৳{u.baseSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                          <button onClick={() => handleOpenEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14} /></button>
                          <button onClick={() => deleteStaff(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="bg-green-50 border border-green-100 p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-green-900 uppercase tracking-tight">Active Payroll Month</h3>
                <p className="text-xs text-green-700 font-bold">{selectedMonth}</p>
              </div>
            </div>
            <select className="bg-white border border-green-200 text-xs font-bold p-2.5 rounded shadow-sm focus:ring-2 focus:ring-green-500/20" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
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
                <div key={user.id} className={`wp-card p-6 rounded-lg border-l-4 ${isPaid ? 'border-green-500 bg-green-50/10 shadow-sm' : 'border-gray-200 hover:border-blue-500 transition-all'}`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-full border shadow-sm" alt="" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{user.fullName}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{staffRoles.find(r => r.id === user.roleId)?.name || 'Staff'}</p>
                      </div>
                    </div>
                    {isPaid && <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-tighter bg-green-100 px-2 py-1 rounded shrink-0"><BadgeCheck size={14} /> Salary Paid</span>}
                  </div>
                  <div className="space-y-3 mb-6 bg-gray-50/50 p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Base Rate</span><span className="font-black text-gray-900">৳{user.baseSalary.toLocaleString()}</span></div>
                  </div>
                  {!isPaid ? (
                    <button onClick={() => handleOpenPayModal(user)} className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <DollarSign size={14} /> Pay Salary
                    </button>
                  ) : (
                    <button onClick={() => handleViewHistoricalReceipt(user)} className="w-full py-2.5 bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded border flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <FileText size={14} /> View Disbursement Slip
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sheet' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight flex items-center gap-2"><History size={20} className="text-purple-600" /> Unified Salary Sheet</h3>
            <button onClick={() => handleSavePDF('salary-sheet-table', `Full_Salary_Sheet_${Date.now()}`)} className="bg-gray-800 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
              <Download size={14} /> Export XLS/PDF
            </button>
          </div>
          <div className="wp-card rounded-md overflow-hidden shadow-sm" id="salary-sheet-table">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Salary Month</th>
                    <th className="px-6 py-4">Basic Salary</th>
                    <th className="px-6 py-4">Bonus</th>
                    <th className="px-6 py-4">Deduction</th>
                    <th className="px-6 py-4">Net Paid Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salarySheetData.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{p.user?.fullName || 'Terminated User'}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-tighter">{p.userId}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">{p.month}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-800">৳{p.basicSalary?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-green-600">+৳{p.bonus?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-xs font-bold text-red-600">-৳{p.deduction?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-sm font-black text-blue-600 bg-blue-50/30">৳{p.amount.toLocaleString()}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase">Paid</span></td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">{new Date(p.datePaid).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {salarySheetData.length === 0 && (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic font-medium">No archived salary records found in database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pay Salary Calculation Modal */}
      {showPayModal && selectedUserForPay && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center shrink-0">
              <h2 className="font-black text-blue-900 uppercase tracking-tight flex items-center gap-2"><Calculator size={20} /> Salary Calculation</h2>
              <button onClick={() => setShowPayModal(false)} className="text-blue-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleProcessSalary} className="p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserForPay.username}`} className="w-12 h-12 rounded-full border bg-white" alt="" />
                <div>
                    <p className="font-black text-gray-900">{selectedUserForPay.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {selectedUserForPay.id} • {selectedMonth}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Monthly Salary</label>
                    <div className="w-full bg-gray-50 border border-gray-200 p-3 rounded text-sm font-black text-gray-600">৳{selectedUserForPay.baseSalary.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Payment Status</label>
                    <div className="w-full bg-blue-50 border border-blue-100 p-3 rounded text-[10px] font-black text-blue-600 uppercase text-center flex items-center justify-center gap-1.5"><BadgeCheck size={14} /> Ready</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1"><ArrowUpRight size={10} className="text-green-500" /> Bonus (Optional)</label>
                    <input type="number" min="0" className="w-full border p-2.5 rounded focus:ring-1 focus:ring-blue-500 font-black text-green-600" value={payFormData.bonus} onChange={e => setPayFormData({...payFormData, bonus: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1"><ArrowDownRight size={10} className="text-red-500" /> Deduction</label>
                    <input type="number" min="0" className="w-full border p-2.5 rounded focus:ring-1 focus:ring-blue-500 font-black text-red-600" value={payFormData.deduction} onChange={e => setPayFormData({...payFormData, deduction: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Processing Note</label>
                  <input type="text" placeholder="e.g. Sales Commission, Late arrival deduction..." className="w-full border p-2.5 rounded text-sm font-medium" value={payFormData.note} onChange={e => setPayFormData({...payFormData, note: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 border-t-2 border-dashed border-gray-100">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Formula applied</span>
                    <span className="text-[10px] font-bold text-gray-400 italic">Net = Basic + Bonus - Ded</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-black text-gray-900 uppercase text-xs">Net Paid Amount</span>
                    <span className="text-2xl font-black text-blue-600">৳{(selectedUserForPay.baseSalary + payFormData.bonus - payFormData.deduction).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-500 hover:bg-gray-100 transition-all rounded cursor-pointer tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all rounded cursor-pointer">Authorize & Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Receipt / Voucher Modal */}
      {showReceipt && selectedReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print:shadow-none print:w-full print:m-0" id="salary-voucher">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2 text-green-600 font-black uppercase tracking-widest text-[10px]"><CheckCircle size={18} /> Automated Salary Voucher Generated</div>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto print:overflow-visible" id="salary-voucher-content">
              <div className="p-10 space-y-10 print:p-8">
                <div className="text-center space-y-3">
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">PAYROLL DISBURSEMENT SLIP</h1>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Official Enterprise Ledger</p>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-dashed border-gray-200 py-6 text-xs print:text-sm">
                  <div className="space-y-4">
                    <div>
                        <p className="font-black text-gray-400 uppercase text-[9px] mb-1">Employee Recipient</p>
                        <p className="text-gray-900 font-black text-base">{selectedReceipt.user.fullName}</p>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-tight">{staffRoles.find(r => r.id === selectedReceipt.user.roleId)?.name || 'Designated Staff'}</p>
                        <p className="text-gray-400 font-black mt-1 text-[10px]">E-ID: {selectedReceipt.user.id}</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <div>
                        <p className="font-black text-gray-400 uppercase text-[9px] mb-1">Transaction Identity</p>
                        <p className="text-gray-900 font-black">Voucher: {selectedReceipt.payment.id}</p>
                        <p className="text-gray-500 font-bold uppercase text-[10px]">Period: {selectedReceipt.payment.month}</p>
                        <p className="text-gray-400 font-black mt-1 text-[10px]">Date: {new Date(selectedReceipt.payment.datePaid).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest border-b border-gray-900 pb-2">Financial Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-500 uppercase text-[11px] font-black tracking-tight">Base Monthly Salary</span>
                        <span className="font-black text-gray-900">৳{selectedReceipt.payment.basicSalary?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-500 uppercase text-[11px] font-black tracking-tight">Performance Bonus (+)</span>
                        <span className="font-black text-green-600">৳{selectedReceipt.payment.bonus?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-500 uppercase text-[11px] font-black tracking-tight">Institutional Deductions (-)</span>
                        <span className="font-black text-red-600">৳{selectedReceipt.payment.deduction?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t-2 border-gray-900 flex justify-between items-center">
                    <span className="text-gray-900 font-black uppercase text-base tracking-widest">Total Net Disbursement</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">৳{selectedReceipt.payment.amount.toLocaleString()}</span>
                  </div>
                  {selectedReceipt.payment.note && (
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded text-[10px] font-medium text-gray-500 italic">
                        Note: {selectedReceipt.payment.note}
                      </div>
                  )}
                </div>

                <div className="pt-20 flex justify-between gap-16 print:pt-24">
                  <div className="flex-1 text-center space-y-2 border-t border-gray-300 pt-3"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Employee Acknowledgment</p></div>
                  <div className="flex-1 text-center space-y-2 border-t border-gray-300 pt-3"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorized Disbursement</p></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 print:hidden shrink-0">
              <button onClick={() => window.print()} className="flex-1 py-3.5 bg-gray-900 text-white rounded font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg cursor-pointer"><Printer size={16} /> Print Voucher</button>
              <button onClick={() => handleSavePDF('salary-voucher-content', `Salary_Slip_${selectedReceipt.payment.id}`)} className="flex-1 py-3.5 bg-blue-600 text-white rounded font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg cursor-pointer"><Download size={16} /> Save PDF</button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-600 rounded font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-gray-50 cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modals remain consistent with previous versions but refined for UX */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base">Employee Registration Hub</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleAddStaff} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Legal Name</label><input required className="w-full border p-2.5 rounded focus:ring-1 focus:ring-blue-500 font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Username</label><input required className="w-full border p-2.5 rounded focus:ring-1 focus:ring-blue-500" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Number</label><input required className="w-full border p-2.5 rounded focus:ring-1 focus:ring-blue-500" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Job Title</label><select className="w-full border p-2.5 rounded font-bold" value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}><option value="">-- Choose Role --</option>{staffRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Base Showroom</label><select className="w-full border p-2.5 rounded font-bold" value={formData.assignedShowroomId} onChange={e => setFormData({...formData, assignedShowroomId: e.target.value})}>{showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Starting Salary (৳)</label><input type="number" required className="w-full border p-2.5 rounded font-black text-blue-600" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Joining Date</label><input type="date" required className="w-full border p-2.5 rounded font-bold" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} /></div>
                <div className="sm:col-span-2 pt-6 border-t flex flex-col sm:flex-row justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-[10px] font-black text-gray-500 uppercase cursor-pointer order-2 sm:order-1 tracking-widest hover:bg-gray-50">Discard</button>
                  <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-black rounded uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all order-1 sm:order-2 cursor-pointer">Authorize Hire</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center shrink-0">
              <h2 className="font-black text-blue-900 uppercase tracking-tight flex items-center gap-2 text-sm sm:text-base"><Edit size={18} /> Modify Staff Data</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-blue-400 hover:text-blue-600 p-1 rounded-full cursor-pointer"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdateStaff} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</label><input required className="w-full border p-2.5 rounded font-black" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Status</label><select className="w-full border p-2.5 rounded font-black" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Official Designation</label><select className="w-full border p-2.5 rounded font-bold" value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}>{staffRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Base Salary (৳)</label><input type="number" required className="w-full border p-2.5 rounded font-black text-blue-600" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} /></div>
                <div className="sm:col-span-2 pt-6 border-t flex flex-col sm:flex-row justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-black rounded uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer">Update Profile</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          #salary-voucher { display: block !important; width: 100% !important; max-width: none !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          body > *:not(#salary-voucher) { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default StaffManagement;