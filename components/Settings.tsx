import React, { useState, useEffect } from 'react';
import { Showroom, Category, User, UserRole, StaffRole } from '../types';
import { Store, Plus, Edit, Trash2, MapPin, X, Tag, Receipt, Layout, Image as ImageIcon, Users, Shield, User as UserIcon, Lock, CheckCircle2, Briefcase } from 'lucide-react';

interface SettingsProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  showrooms: Showroom[];
  setShowrooms: React.Dispatch<React.SetStateAction<Showroom[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  vatRate: number;
  setVatRate: React.Dispatch<React.SetStateAction<number>>;
  appName: string;
  setAppName: (name: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  staffRoles: StaffRole[];
  setStaffRoles: React.Dispatch<React.SetStateAction<StaffRole[]>>;
  onCategoryRenamed: (oldName: string, newName: string) => void;
  onCategoryDeleted?: (catName: string) => void;
  onShowroomDeleted?: (showroomId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  users,
  setUsers,
  currentUser,
  showrooms, 
  setShowrooms, 
  categories, 
  setCategories, 
  vatRate,
  setVatRate,
  appName,
  setAppName,
  logoUrl,
  setLogoUrl,
  staffRoles,
  setStaffRoles,
  onCategoryRenamed,
  onCategoryDeleted,
  onShowroomDeleted
}) => {
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
  const [branchFormData, setBranchFormData] = useState({ name: '', location: '' });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });

  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', accessLevel: 'SELLER' as UserRole });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({ 
    username: '', 
    fullName: '', 
    roleId: staffRoles[0]?.id || '',
    assignedShowroomId: '',
    password: ''
  });

  // Sync defaults
  useEffect(() => {
    if (showrooms.length > 0 && !userFormData.assignedShowroomId) {
      setUserFormData(prev => ({ ...prev, assignedShowroomId: showrooms[0].id }));
    }
  }, [showrooms]);

  // Branch Management
  const handleOpenAddBranch = () => {
    setEditingShowroom(null);
    setBranchFormData({ name: '', location: '' });
    setShowBranchModal(true);
  };

  const handleOpenEditBranch = (s: Showroom) => {
    setEditingShowroom(s);
    setBranchFormData({ name: s.name, location: s.location });
    setShowBranchModal(true);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShowroom) {
      setShowrooms(prev => prev.map(s => s.id === editingShowroom.id ? { ...branchFormData, id: s.id } : s));
    } else {
      setShowrooms(prev => [...prev, { ...branchFormData, id: `sr-${Date.now()}` }]);
    }
    setShowBranchModal(false);
  };

  const handleBranchDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this branch? Note: All stock associated with this branch will be removed.")) {
      setShowrooms(prev => prev.filter(s => s.id !== id));
      if (onShowroomDeleted) onShowroomDeleted(id);
    }
  };

  // Category Management
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryFormData({ name: c.name });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      onCategoryRenamed(editingCategory.name, categoryFormData.name);
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...categoryFormData, id: c.id } : c));
    } else {
      setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: categoryFormData.name }]);
    }
    setShowCategoryModal(false);
  };

  // Staff Role Management
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleFormData({ name: '', accessLevel: 'SELLER' });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role: StaffRole) => {
    setEditingRole(role);
    setRoleFormData({ name: role.name, accessLevel: role.accessLevel });
    setShowRoleModal(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      setStaffRoles(prev => prev.map(r => r.id === editingRole.id ? { ...roleFormData, id: r.id } : r));
    } else {
      setStaffRoles(prev => [...prev, { ...roleFormData, id: `role-${Date.now()}` }]);
    }
    setShowRoleModal(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (id: string) => {
    const isAssigned = users.some(u => u.roleId === id);
    if (isAssigned) {
      alert("Cannot delete role: Employees are currently assigned to it. Please reassign them first.");
      return;
    }
    if (window.confirm("Delete this staff role? This action cannot be undone.")) {
      setStaffRoles(prev => prev.filter(r => r.id !== id));
    }
  };

  // User Management
  const handleOpenUserModal = () => {
    setUserFormData({ 
      username: '', 
      fullName: '', 
      roleId: staffRoles[0]?.id || '',
      assignedShowroomId: showrooms[0]?.id || '',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      fullName: user.fullName,
      roleId: user.roleId || staffRoles[0]?.id || '',
      assignedShowroomId: user.assignedShowroomId || showrooms[0]?.id || '',
      password: user.password || ''
    });
    setShowEditUserModal(true);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRole = staffRoles.find(r => r.id === userFormData.roleId);
    if (!selectedRole) return;

    const exists = users.some(u => u.username === userFormData.username.toLowerCase());
    if (exists) return alert("Username already taken.");

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: userFormData.username.toLowerCase(),
      fullName: userFormData.fullName,
      roleId: selectedRole.id,
      role: selectedRole.accessLevel,
      assignedShowroomId: selectedRole.accessLevel === 'ADMIN' ? undefined : userFormData.assignedShowroomId,
      password: userFormData.password,
      baseSalary: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
    
    setUsers(prev => [...prev, newUser]);
    setShowUserModal(false);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const usernameClean = userFormData.username.trim().toLowerCase();
    const exists = users.some(u => u.username === usernameClean && u.id !== editingUser.id);
    if (exists) return alert("Username already taken.");

    const selectedRole = staffRoles.find(r => r.id === userFormData.roleId);
    if (!selectedRole) return;

    setUsers(prev => prev.map(u => u.id === editingUser.id ? {
      ...u,
      fullName: userFormData.fullName,
      username: usernameClean,
      password: userFormData.password,
      roleId: selectedRole.id,
      role: selectedRole.accessLevel,
      assignedShowroomId: selectedRole.accessLevel === 'ADMIN' ? undefined : userFormData.assignedShowroomId,
    } : u));

    setShowEditUserModal(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">System Administration</h1>
          <p className="text-sm text-gray-500 font-medium">Control branches, staff access levels, and product taxonomy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* User Management */}
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-sm tracking-widest"><Users size={20} className="text-blue-600" /> System Users</h3>
            <button onClick={handleOpenUserModal} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer">
              <Plus size={16} /> Create New User
            </button>
          </div>
          <div className="wp-card rounded-md overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Job Role</th>
                  <th className="px-6 py-4">Access Level</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-8 h-8 rounded-full border border-gray-200" alt="" />
                      <span className="font-bold text-gray-900">{u.fullName}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-600 font-black uppercase">{u.username}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
                      {staffRoles.find(r => r.id === u.roleId)?.name || 'Custom'}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'MANAGER' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditUserModal(u)} 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                        {u.id !== currentUser.id && (
                          <button 
                            onClick={() => setUsers(prev => prev.filter(usr => usr.id !== u.id))} 
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-sm tracking-widest"><Store size={20} className="text-green-600" /> Showrooms / Branches</h3>
            <button onClick={handleOpenAddBranch} className="bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer">
              <Plus size={16} /> Add Branch
            </button>
          </div>
          <div className="wp-card rounded-md divide-y divide-gray-100 overflow-hidden">
            {showrooms.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded flex items-center justify-center"><Store size={20} /></div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{s.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1">
                      <MapPin size={10} /> {s.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditBranch(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"><Edit size={16} /></button>
                  {showrooms.length > 1 && (
                    <button onClick={(e) => handleBranchDelete(e, s.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-sm tracking-widest"><Tag size={20} className="text-orange-600" /> Product Categories</h3>
            <button onClick={handleOpenAddCategory} className="bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer">
              <Plus size={16} /> New Category
            </button>
          </div>
          <div className="wp-card rounded-md divide-y divide-gray-100 overflow-hidden">
            {categories.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded flex items-center justify-center"><Tag size={20} /></div>
                  <h4 className="font-bold text-sm text-gray-800">{c.name}</h4>
                </div>
                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditCategory(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"><Edit size={16} /></button>
                  <button onClick={() => setCategories(prev => prev.filter(cat => cat.id !== c.id))} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-sm tracking-widest"><Briefcase size={20} className="text-purple-600" /> Staff Roles</h3>
            <button onClick={handleOpenAddRole} className="bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer">
              <Plus size={16} /> Define Role
            </button>
          </div>
          <div className="wp-card rounded-md divide-y divide-gray-100 overflow-hidden">
            {staffRoles.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded flex items-center justify-center"><Briefcase size={20} /></div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{r.name}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Access: {r.accessLevel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleOpenEditRole(r)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"><Edit size={16} /></button>
                   <button onClick={() => handleDeleteRole(r.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branding & Others */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-700 flex items-center gap-2 uppercase text-sm tracking-widest"><Layout size={20} className="text-gray-500" /> Branding & Financials</h3>
          </div>
          <div className="wp-card p-6 rounded-md space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">ERP App Name</label>
              <input type="text" className="w-full border p-2.5 rounded font-bold" value={appName} onChange={e => setAppName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Logo Image URL</label>
              <input type="text" className="w-full border p-2.5 rounded text-sm" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">VAT Rate (%)</label>
              <input type="number" className="w-full border p-2.5 rounded font-black text-blue-600" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-purple-50 flex justify-between">
              <h2 className="font-black text-purple-900 uppercase tracking-tight">
                {editingRole ? 'Update Staff Role' : 'Define Staff Role'}
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="cursor-pointer text-purple-400 hover:text-purple-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Role Title</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={roleFormData.name} onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Access Permission</label>
                <select className="w-full border p-2.5 rounded font-bold" value={roleFormData.accessLevel} onChange={e => setRoleFormData({...roleFormData, accessLevel: e.target.value as UserRole})}>
                  <option value="SELLER">SELLER (POS Only)</option>
                  <option value="MANAGER">MANAGER (Reports & Stock)</option>
                  <option value="ADMIN">ADMIN (Full Control)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-2 text-xs font-black uppercase text-gray-500">Cancel</button>
                <button type="submit" className="flex-[2] py-2 bg-purple-600 text-white font-black uppercase rounded tracking-widest cursor-pointer shadow-lg">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-blue-50 flex justify-between">
              <h2 className="font-black text-blue-900 uppercase tracking-tight">Register System User</h2>
              <button onClick={() => setShowUserModal(false)} className="cursor-pointer text-blue-400 hover:text-blue-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={userFormData.fullName} onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Username</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Password</label>
                <input required type="password" className="w-full border p-2.5 rounded font-bold" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Job Role</label>
                  <select className="w-full border p-2.5 rounded font-bold text-xs" value={userFormData.roleId} onChange={e => setUserFormData({...userFormData, roleId: e.target.value})}>
                    {staffRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                {staffRoles.find(r => r.id === userFormData.roleId)?.accessLevel !== 'ADMIN' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Assign Branch</label>
                    <select className="w-full border p-2.5 rounded font-bold text-xs" value={userFormData.assignedShowroomId} onChange={e => setUserFormData({...userFormData, assignedShowroomId: e.target.value})}>
                      {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-gray-500">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-black uppercase tracking-widest rounded cursor-pointer">Grant Access</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-blue-50 flex justify-between">
              <h2 className="font-black text-blue-900 uppercase tracking-tight">Update User Access</h2>
              <button onClick={() => setShowEditUserModal(false)} className="cursor-pointer text-blue-400 hover:text-blue-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={userFormData.fullName} onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Username</label>
                  <input required className="w-full border p-2.5 rounded font-bold" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Password</label>
                  <input required type="text" className="w-full border p-2.5 rounded font-bold" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Job Role</label>
                  <select className="w-full border p-2.5 rounded font-bold text-xs" value={userFormData.roleId} onChange={e => setUserFormData({...userFormData, roleId: e.target.value})}>
                    {staffRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                {staffRoles.find(r => r.id === userFormData.roleId)?.accessLevel !== 'ADMIN' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Assign Branch</label>
                    <select className="w-full border p-2.5 rounded font-bold text-xs" value={userFormData.assignedShowroomId} onChange={e => setUserFormData({...userFormData, assignedShowroomId: e.target.value})}>
                      {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditUserModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-gray-500">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-black uppercase tracking-widest rounded cursor-pointer">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-gray-50 flex justify-between">
              <h2 className="font-black text-gray-800 uppercase tracking-tight">{editingShowroom ? 'Update Branch' : 'Register New Branch'}</h2>
              <button onClick={() => setShowBranchModal(false)} className="cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleBranchSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Branch Name</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={branchFormData.name} onChange={e => setBranchFormData({...branchFormData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Location/Address</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={branchFormData.location} onChange={e => setBranchFormData({...branchFormData, location: e.target.value})} />
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-4 py-2 text-xs font-black uppercase text-gray-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-black uppercase rounded shadow-lg tracking-widest text-xs">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b bg-gray-50 flex justify-between">
              <h2 className="font-black text-gray-800 uppercase tracking-tight">{editingCategory ? 'Update Category' : 'New Category'}</h2>
              <button onClick={() => setShowCategoryModal(false)} className="cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Category Name</label>
                <input required className="w-full border p-2.5 rounded font-bold" value={categoryFormData.name} onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})} />
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-xs font-black uppercase text-gray-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white font-black uppercase rounded shadow-lg tracking-widest text-xs">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;