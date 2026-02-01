import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  RotateCcw, 
  Store, 
  TrendingUp, 
  LogOut,
  Settings as SettingsIcon,
  Plus,
  Wallet,
  ShieldAlert,
  ShieldX,
  Users as StaffIcon,
  Briefcase,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Product, Showroom, StockItem, Sale, Category, Expense, User, SalaryPayment, StaffRole } from './types';
import { INITIAL_PRODUCTS, INITIAL_STOCK, SHOWROOMS, MOCK_SALES, INITIAL_CATEGORIES, MOCK_USERS } from './constants';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Returns from './components/Returns';
import ShowroomsList from './components/ShowroomsList';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Expenses from './components/Expenses';
import Login from './components/Login';
import StaffManagement from './components/StaffManagement';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('soleerp_sidebar_collapsed') === 'true';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('soleerp_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('soleerp_user_obj');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Helper to safely load array data from localStorage
  const loadArray = <T,>(key: string, defaultValue: T[]): T[] => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [users, setUsers] = useState<User[]>(() => loadArray('soleerp_users', MOCK_USERS));
  
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>(() => loadArray('soleerp_staff_roles', [
    { id: 'r1', name: 'Store Manager', accessLevel: 'MANAGER' },
    { id: 'r2', name: 'Sales Executive', accessLevel: 'SELLER' },
    { id: 'r3', name: 'System Admin', accessLevel: 'ADMIN' },
  ]));

  const [products, setProducts] = useState<Product[]>(() => loadArray('soleerp_products', INITIAL_PRODUCTS));
  const [stock, setStock] = useState<StockItem[]>(() => loadArray('soleerp_stock', INITIAL_STOCK));
  const [sales, setSales] = useState<Sale[]>(() => loadArray('soleerp_sales', MOCK_SALES));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadArray('soleerp_expenses', []));
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(() => loadArray('soleerp_salaries', []));
  const [showrooms, setShowrooms] = useState<Showroom[]>(() => loadArray('soleerp_showrooms', SHOWROOMS));
  const [categories, setCategories] = useState<Category[]>(() => loadArray('soleerp_categories', INITIAL_CATEGORIES));

  const [vatRate, setVatRate] = useState<number>(() => {
    const saved = localStorage.getItem('soleerp_vat_rate');
    return saved ? Number(JSON.parse(saved)) : 5;
  });
  const [appName, setAppName] = useState<string>(() => {
    return localStorage.getItem('soleerp_app_name') || 'SoleERP';
  });
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('soleerp_logo_url') || '';
  });

  const [selectedShowroomId, setSelectedShowroomId] = useState<string>(() => {
    const saved = localStorage.getItem('soleerp_selected_showroom');
    return saved && showrooms.some(s => s.id === saved) ? saved : (showrooms[0]?.id || '');
  });

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && currentUser.assignedShowroomId) {
      setSelectedShowroomId(currentUser.assignedShowroomId);
    }
  }, [currentUser]);

  useEffect(() => localStorage.setItem('soleerp_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('soleerp_staff_roles', JSON.stringify(staffRoles)), [staffRoles]);
  useEffect(() => localStorage.setItem('soleerp_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('soleerp_stock', JSON.stringify(stock)), [stock]);
  useEffect(() => localStorage.setItem('soleerp_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('soleerp_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('soleerp_salaries', JSON.stringify(salaryPayments)), [salaryPayments]);
  useEffect(() => localStorage.setItem('soleerp_showrooms', JSON.stringify(showrooms)), [showrooms]);
  useEffect(() => localStorage.setItem('soleerp_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('soleerp_vat_rate', JSON.stringify(vatRate)), [vatRate]);
  useEffect(() => localStorage.setItem('soleerp_app_name', appName), [appName]);
  useEffect(() => localStorage.setItem('soleerp_logo_url', logoUrl), [logoUrl]);
  useEffect(() => localStorage.setItem('soleerp_selected_showroom', selectedShowroomId), [selectedShowroomId]);
  useEffect(() => localStorage.setItem('soleerp_sidebar_collapsed', isSidebarCollapsed.toString()), [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('soleerp_auth', isAuthenticated.toString());
    if (currentUser) {
      localStorage.setItem('soleerp_user_obj', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('soleerp_user_obj');
    }
  }, [isAuthenticated, currentUser]);

  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (user.role !== 'ADMIN' && user.assignedShowroomId) {
      setSelectedShowroomId(user.assignedShowroomId);
    }
  };

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const confirmLogout = window.confirm("Are you sure you want to log out of the system?");
    if (confirmLogout) {
      localStorage.setItem('soleerp_auth', 'false');
      localStorage.removeItem('soleerp_user_obj');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const currentShowroom = useMemo(() => 
    showrooms.find(s => s.id === selectedShowroomId) || showrooms[0] || { id: '', name: 'N/A', location: '' }, 
  [selectedShowroomId, showrooms]);

  const handleCompleteSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    setStock(prev => {
      const next = [...prev];
      sale.items.forEach(item => {
        const stockIndex = next.findIndex(s => s.productId === item.productId && s.showroomId === sale.showroomId);
        if (stockIndex > -1) {
          next[stockIndex] = { ...next[stockIndex], quantity: next[stockIndex].quantity - item.quantity };
        } else {
          next.push({ id: `st-${Date.now()}-${item.productId}`, productId: item.productId, showroomId: sale.showroomId, quantity: -item.quantity });
        }
      });
      return next;
    });
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Delete this expense record?")) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddStock = (productId: string, showroomId: string, quantity: number) => {
    setStock(prev => {
      const next = [...prev];
      const stockIndex = next.findIndex(s => s.productId === productId && s.showroomId === showroomId);
      if (stockIndex > -1) {
        next[stockIndex] = { ...next[stockIndex], quantity: next[stockIndex].quantity + quantity };
      } else {
        next.push({ id: `st-${Date.now()}-${productId}`, productId, showroomId, quantity });
      }
      return next;
    });
  };

  const handleTransferStock = (productId: string, fromId: string, toId: string, quantity: number) => {
    setStock(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(s => s.productId === productId && s.showroomId === fromId);
      const toIdx = next.findIndex(s => s.productId === productId && s.showroomId === toId);

      if (fromIdx > -1 && next[fromIdx].quantity >= quantity) {
        next[fromIdx] = { ...next[fromIdx], quantity: next[fromIdx].quantity - quantity };
        if (toIdx > -1) {
          next[toIdx] = { ...next[toIdx], quantity: next[toIdx].quantity + quantity };
        } else {
          next.push({ id: `st-${Date.now()}`, productId, showroomId: toId, quantity });
        }
      }
      return next;
    });
  };

  const handleProcessReturn = (saleId: string) => {
    const saleToReturn = sales.find(s => s.id === saleId);
    if (!saleToReturn || saleToReturn.isReturned) return;
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, isReturned: true } : s).concat({
      ...saleToReturn,
      id: `RET-${saleToReturn.id.replace('INV-', '')}-${Date.now().toString().slice(-4)}`,
      type: 'RETURN',
      date: new Date().toISOString(),
      finalAmount: -saleToReturn.finalAmount
    }));
    setStock(prev => {
      const next = [...prev];
      saleToReturn.items.forEach(item => {
        const stockIndex = next.findIndex(s => s.productId === item.productId && s.showroomId === saleToReturn.showroomId);
        if (stockIndex > -1) next[stockIndex] = { ...next[stockIndex], quantity: next[stockIndex].quantity + item.quantity };
      });
      return next;
    });
  };

  const handleDeleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;
    if (window.confirm("Are you sure you want to delete this transaction? Stock will be adjusted accordingly.")) {
      setStock(prev => {
        const next = [...prev];
        saleToDelete.items.forEach(item => {
          const stockIndex = next.findIndex(s => s.productId === item.productId && s.showroomId === saleToDelete.showroomId);
          if (stockIndex > -1) {
            const adjustment = saleToDelete.type === 'SALE' ? item.quantity : -item.quantity;
            next[stockIndex] = { ...next[stockIndex], quantity: next[stockIndex].quantity + adjustment };
          }
        });
        return next;
      });
      setSales(prev => prev.filter(s => s.id !== saleId));
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} appName={appName} logoUrl={logoUrl} users={users} />;
  }

  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const isSeller = currentUser.role === 'SELLER';

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <div className="flex h-screen w-full overflow-hidden bg-gray-100 relative">
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed inset-y-0 left-0 wp-sidebar flex flex-col text-gray-300 border-r border-gray-800 h-full z-50 
          transform transition-all duration-300 lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}>
          <div className="p-4 border-b border-gray-700 bg-black flex items-center justify-between shrink-0 overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : appName.charAt(0).toUpperCase()}
              </div>
              <span className={`text-xl font-bold text-white truncate transition-opacity duration-300 ${isSidebarCollapsed ? 'lg:opacity-0' : 'opacity-100'}`}>{appName}</span>
            </div>
            
            <div className="flex items-center">
              {/* Mobile Close Button */}
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              
              {/* Desktop Toggle Button */}
              <button 
                onClick={toggleDesktopSidebar} 
                className="hidden lg:flex p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>
          
          <div className="px-4 py-2 bg-gray-900/50 flex items-center gap-2 shrink-0 overflow-hidden">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isAdmin ? 'bg-red-500' : isManager ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">{currentUser.role} PANEL</span>
              )}
          </div>

          <nav className="flex-1 overflow-y-auto py-4 scrollbar-none lg:scrollbar-thin scrollbar-thumb-gray-700">
            {(!isSeller) && <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />}
            <SidebarItem to="/inventory" icon={<Package size={18} />} label="Inventory / Stock" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/pos" icon={<ShoppingCart size={18} />} label="Sell (POS)" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />
            {(!isSeller) && <SidebarItem to="/expenses" icon={<Wallet size={18} />} label="Expenses" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />}
            <SidebarItem to="/returns" icon={<RotateCcw size={18} />} label="Returns" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />
            {isAdmin && <SidebarItem to="/staff" icon={<StaffIcon size={18} />} label="Staff & Payroll" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />}
            {isAdmin && <SidebarItem to="/showrooms" icon={<Store size={18} />} label="Branches" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />}
            {(!isSeller) && <SidebarItem to="/reports" icon={<TrendingUp size={18} />} label="Financials" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />}
            {isAdmin && <SidebarItem to="/settings" icon={<SettingsIcon size={18} />} label="Admin Settings" isCollapsed={isSidebarCollapsed} onClick={() => setIsSidebarOpen(false)} />}
          </nav>

          <div className="p-4 border-t border-gray-700 bg-black/40 shrink-0 mt-auto">
            <button 
              type="button" 
              onClick={(e) => handleLogout(e)} 
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-gray-400 hover:text-white hover:bg-red-600/20 transition-all w-full text-sm font-bold cursor-pointer text-left group border border-transparent hover:border-red-600/30 active:scale-95 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut size={18} className="group-hover:text-red-500 transition-colors shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Log Out System</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
          <header className="h-14 bg-white border-b border-[#ccd0d4] flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <Store size={14} />
                {isAdmin ? (
                  <select className="bg-transparent font-medium focus:outline-none cursor-pointer border-b border-transparent hover:border-gray-300 transition-all" value={selectedShowroomId} onChange={(e) => setSelectedShowroomId(e.target.value)}>
                    {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <span className="font-bold text-gray-900">{currentShowroom.name}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200">
                <div className="text-right hidden xs:block">
                    <p className="text-[10px] sm:text-xs font-black text-gray-900 leading-none truncate max-w-[100px]">{currentUser.fullName}</p>
                    <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{currentUser.role}</p>
                </div>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white shadow-sm bg-white shrink-0" alt="avatar" />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#f0f2f5]">
            <Routes>
              <Route path="/" element={isSeller ? <Navigate to="/pos" /> : <Dashboard sales={sales} stock={stock} products={products} showrooms={showrooms} expenses={expenses} userRole={currentUser.role} assignedBranchId={currentUser.assignedShowroomId} />} />
              <Route path="/inventory" element={<Inventory products={products} stock={stock} setProducts={setProducts} setStock={setStock} onAddStock={handleAddStock} onTransferStock={handleTransferStock} showrooms={showrooms} categories={categories} userRole={currentUser.role} assignedBranchId={currentUser.assignedShowroomId} />} />
              <Route path="/pos" element={<POS products={products} stock={stock} currentShowroom={currentShowroom} onCompleteSale={handleCompleteSale} vatRate={vatRate} appName={appName} logoUrl={logoUrl} />} />
              <Route path="/expenses" element={isSeller ? <AccessDenied /> : <Expenses showrooms={showrooms} expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} userRole={currentUser.role} assignedBranchId={currentUser.assignedShowroomId} />} />
              <Route path="/returns" element={<Returns sales={sales} showrooms={showrooms} onReturn={handleProcessReturn} userRole={currentUser.role} assignedBranchId={currentUser.assignedShowroomId} />} />
              <Route path="/staff" element={isAdmin ? <StaffManagement users={users} setUsers={setUsers} showrooms={showrooms} onAddSalaryExpense={handleAddExpense} salaryPayments={salaryPayments} setSalaryPayments={setSalaryPayments} currentUser={currentUser} staffRoles={staffRoles} /> : <AccessDenied />} />
              <Route path="/showrooms" element={isAdmin ? <ShowroomsList showrooms={showrooms} setSelectedShowroomId={setSelectedShowroomId} /> : <AccessDenied />} />
              <Route path="/reports" element={isSeller ? <AccessDenied /> : <Reports sales={sales} products={products} showrooms={showrooms} onDeleteSale={handleDeleteSale} expenses={expenses} userRole={currentUser.role} assignedBranchId={currentUser.assignedShowroomId} />} />
              <Route path="/settings" element={isAdmin ? <Settings users={users} setUsers={setUsers} currentUser={currentUser} showrooms={showrooms} setShowrooms={setShowrooms} categories={categories} setCategories={setCategories} vatRate={vatRate} setVatRate={setVatRate} appName={appName} setAppName={setAppName} logoUrl={logoUrl} setLogoUrl={setLogoUrl} staffRoles={staffRoles} setStaffRoles={setStaffRoles} onCategoryRenamed={(old, newN) => setProducts(p => p.map(prod => prod.category === old ? { ...prod, category: newN } : prod))} /> : <AccessDenied />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

const AccessDenied: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <ShieldX size={32} />
        </div>
        <div>
            <h2 className="text-xl font-black text-gray-900 uppercase">Access Denied</h2>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">You do not have the necessary permissions to view this module. Please contact your administrator.</p>
        </div>
        <Link to="/pos" className="mt-6 px-6 py-2 bg-gray-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">Return to Home</Link>
    </div>
);

const SidebarItem: React.FC<{ to: string, icon: React.ReactNode, label: string, isCollapsed?: boolean, onClick?: () => void }> = ({ to, icon, label, isCollapsed, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 border-l-4 overflow-hidden ${isActive ? 'bg-blue-600/10 border-blue-600 text-white font-bold' : 'border-transparent hover:bg-gray-800 hover:text-white text-gray-400 font-medium'} ${isCollapsed ? 'justify-center lg:px-0 lg:border-l-0 lg:border-r-4' : ''}`}
      title={isCollapsed ? label : ""}
    >
      <span className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>{icon}</span>
      <span className={`transition-opacity duration-300 truncate ${isCollapsed ? 'lg:hidden opacity-0 w-0' : 'opacity-100 w-auto'}`}>{label}</span>
    </Link>
  );
};

export default App;