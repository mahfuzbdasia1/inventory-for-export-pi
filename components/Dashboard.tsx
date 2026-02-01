import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Package, AlertTriangle, DollarSign, ShoppingCart, RotateCcw, Wallet } from 'lucide-react';
import { Sale, StockItem, Product, Showroom, Expense, UserRole } from '../types';

interface DashboardProps {
  sales: Sale[];
  stock: StockItem[];
  products: Product[];
  showrooms: Showroom[];
  expenses: Expense[];
  userRole: UserRole;
  assignedBranchId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ sales, stock, products, showrooms, expenses, userRole, assignedBranchId }) => {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  const filteredSales = useMemo(() => 
    userRole === 'ADMIN' ? sales : sales.filter(s => s.showroomId === assignedBranchId),
  [sales, userRole, assignedBranchId]);

  const filteredExpenses = useMemo(() => 
    userRole === 'ADMIN' ? expenses : expenses.filter(e => e.showroomId === assignedBranchId),
  [expenses, userRole, assignedBranchId]);

  const filteredStock = useMemo(() => 
    userRole === 'ADMIN' ? stock : stock.filter(s => s.showroomId === assignedBranchId),
  [stock, userRole, assignedBranchId]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.filter(s => s.type === 'SALE').reduce((acc, s) => acc + s.finalAmount, 0) + 
                         filteredSales.filter(s => s.type === 'RETURN').reduce((acc, s) => acc + s.finalAmount, 0);
    
    const totalCOGS = filteredSales.reduce((acc, s) => {
      const saleCost = s.items.reduce((c, i) => c + (i.costPrice * i.quantity), 0);
      return acc + (s.type === 'SALE' ? saleCost : -saleCost);
    }, 0);

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = (totalRevenue - totalCOGS) - totalExpenses;
    
    const totalStockValue = filteredStock.reduce((acc, s) => {
      const prod = products.find(p => p.id === s.productId);
      return acc + (s.quantity * (prod?.costPrice || 0));
    }, 0);

    return { totalRevenue, totalExpenses, netProfit, totalStockValue };
  }, [filteredSales, filteredExpenses, filteredStock, products]);

  const lowStockItems = useMemo(() => {
    return filteredStock
      .filter(s => s.quantity < 10)
      .map(s => ({
        ...s,
        product: products.find(p => p.id === s.productId),
        showroom: showrooms.find(sr => sr.id === s.showroomId)
      }))
      .filter(item => item.product)
      .sort((a, b) => a.quantity - b.quantity);
  }, [filteredStock, products, showrooms]);

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredSales.forEach(s => {
      const date = new Date(s.date).toLocaleDateString();
      days[date] = (days[date] || 0) + s.finalAmount;
    });
    return Object.entries(days).map(([name, sales]) => ({ name, sales })).slice(-7);
  }, [filteredSales]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) cats[prod.category] = (cats[prod.category] || 0) + (item.unitPrice * item.quantity);
      });
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filteredSales, products]);

  const COLORS = ['#2271b1', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Financial Dashboard</h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Overview for {userRole === 'ADMIN' ? 'All Branches' : showrooms.find(s => s.id === assignedBranchId)?.name}</p>
        </div>
        <div className="flex bg-white border border-gray-300 rounded overflow-hidden shadow-sm w-fit">
          {(['daily', 'monthly', 'yearly'] as const).map(f => (
            <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-black uppercase transition-colors ${timeFilter === f ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Net Revenue" value={`৳${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="text-blue-600" size={18} />} />
        <MetricCard label="Net Profit" value={`৳${stats.netProfit.toLocaleString()}`} icon={<TrendingUp className="text-green-600" size={18} />} isPositive={stats.netProfit >= 0} />
        <MetricCard label="Expenses" value={`৳${stats.totalExpenses.toLocaleString()}`} icon={<Wallet className="text-red-600" size={18} />} />
        <MetricCard label="Stock Value" value={`৳${stats.totalStockValue.toLocaleString()}`} icon={<Package className="text-orange-600" size={18} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 wp-card p-4 sm:p-6 rounded-sm">
          <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-gray-400">
            <TrendingUp size={14} />
            Revenue Velocity (Last 7 Days)
          </h3>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={9} tickMargin={10} stroke="#999" />
                <YAxis fontSize={9} tickMargin={10} stroke="#999" />
                <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, "Sales"]} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccd0d4', borderRadius: '4px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="sales" stroke="#2271b1" strokeWidth={2} dot={{ r: 3, fill: '#2271b1' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="wp-card p-4 sm:p-6 rounded-sm">
          <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-gray-400">
            <Package size={14} />
            Sales Category
          </h3>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} contentStyle={{fontSize: '10px'}} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="wp-card rounded-sm overflow-hidden flex flex-col">
          <div className="bg-orange-50 p-3 sm:p-4 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-orange-800 flex items-center gap-2">
              <AlertTriangle size={14} /> Low Stock Warnings
            </h3>
            <span className="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-black bg-orange-200 text-orange-900">
              {lowStockItems.length} Products
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
            {lowStockItems.length > 0 ? lowStockItems.map((item, idx) => (
              <div key={idx} className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="min-w-0 pr-4">
                  <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">{item.product?.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-black tracking-tighter truncate">{item.product?.brand} • {item.showroom?.name}</p>
                </div>
                <div className="shrink-0">
                  <span className={`px-2 py-1 rounded text-[8px] sm:text-[9px] font-black uppercase ${item.quantity <= 2 ? 'bg-red-600 text-white' : 'bg-orange-400 text-white'}`}>
                    {item.quantity} QTY
                  </span>
                </div>
              </div>
            )) : <div className="p-12 text-center text-gray-400 italic text-sm">Stock levels healthy.</div>}
          </div>
        </div>

        <div className="wp-card rounded-sm overflow-hidden flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-800">Operational Log</h3>
          </div>
          <div className="divide-y divide-gray-100 flex-1 max-h-[350px] overflow-y-auto">
            {[...filteredSales, ...filteredExpenses.map(e => ({ ...e, type: 'EXPENSE' as any, finalAmount: -e.amount }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((item, idx) => (
                <div key={idx} className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`p-1.5 sm:p-2 rounded shrink-0 ${'items' in item ? (item.type === 'SALE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600') : 'bg-gray-50 text-gray-500'}`}>
                      {'items' in item ? (item.type === 'SALE' ? <ShoppingCart size={14} /> : <RotateCcw size={14} />) : <Wallet size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-gray-800 truncate">{'items' in item ? (item.type === 'SALE' ? 'Inventory Sale' : 'Return Processed') : (item as any).category}</p>
                      <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-bold truncate">{new Date(item.date).toLocaleDateString()} • {showrooms.find(s => s.id === item.showroomId)?.name}</p>
                    </div>
                  </div>
                  <p className={`text-[11px] sm:text-xs font-black shrink-0 ${'items' in item ? (item.type === 'SALE' ? 'text-gray-900' : 'text-red-600') : 'text-red-600'}`}>
                    {item.finalAmount > 0 ? '+' : ''}৳{Math.abs(item.finalAmount).toFixed(0)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; trend?: string; isPositive?: boolean; icon: React.ReactNode; }> = ({ label, value, isPositive = true, icon }) => (
  <div className="wp-card p-3 sm:p-5 rounded-sm flex flex-col justify-between group hover:border-blue-400 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest truncate mr-2">{label}</span>
      <div className="p-1.5 sm:p-2 bg-gray-50 rounded group-hover:bg-blue-50 transition-colors shrink-0">{icon}</div>
    </div>
    <div className="flex items-baseline justify-between">
      <span className={`text-base sm:text-xl font-black tracking-tight truncate ${!isPositive && label === 'Net Profit' ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  </div>
);

export default Dashboard;