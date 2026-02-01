import React, { useState, useMemo } from 'react';
import { Product, StockItem, Showroom, Sale, SaleItem } from '../types';
import { Search, ShoppingCart, Trash2, CreditCard, Tag, Percent, Image as ImageIcon, User, Phone, X, Printer, CheckCircle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface POSProps {
  products: Product[];
  stock: StockItem[];
  currentShowroom: Showroom;
  onCompleteSale: (sale: Sale) => void;
  vatRate: number;
  appName: string;
  logoUrl: string;
}

const POS: React.FC<POSProps> = ({ products, stock, currentShowroom, onCompleteSale, vatRate, appName, logoUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  const availableProducts = useMemo(() => {
    return products.map(p => {
      const showroomStock = stock.find(s => s.productId === p.id && s.showroomId === currentShowroom.id)?.quantity || 0;
      return { ...p, currentStock: showroomStock };
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, stock, currentShowroom, searchTerm]);

  const addToCart = (product: Product) => {
    const stockAvail = stock.find(s => s.productId === product.id && s.showroomId === currentShowroom.id)?.quantity || 0;
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      if (existing.quantity < stockAvail) {
        setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
    } else {
      if (stockAvail > 0) {
        setCart([...cart, { product, quantity: 1 }]);
      }
    }
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, c) => acc + (c.product.sellingPrice * c.quantity), 0);
    const vat = subtotal * (vatRate / 100);
    const discount = subtotal * (discountPercent / 100);
    const final = subtotal + vat - discount;
    return { subtotal, vat, discount, final };
  }, [cart, discountPercent, vatRate]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const saleItems: SaleItem[] = cart.map(c => ({
      productId: c.product.id,
      quantity: c.quantity,
      unitPrice: c.product.sellingPrice,
      costPrice: c.product.costPrice
    }));
    const newSale: Sale = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      showroomId: currentShowroom.id,
      date: new Date().toISOString(),
      items: saleItems,
      totalAmount: totals.subtotal,
      vat: totals.vat,
      discount: totals.discount,
      finalAmount: totals.final,
      type: 'SALE',
      customerName,
      customerPhone,
      customerAddress
    };
    onCompleteSale(newSale);
    setLastSale(newSale);
    setShowInvoice(true);
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full relative overflow-hidden pb-20 sm:pb-0">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden print:hidden">
        <div className="wp-card p-3 sm:p-4 rounded-md shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Quick search products..." 
              className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-4 px-1">
          {availableProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.currentStock === 0}
              className={`wp-card p-3 sm:p-4 rounded-md text-left transition-all hover:border-blue-500 group relative flex flex-row xs:flex-col gap-3 items-center xs:items-stretch ${p.currentStock === 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-[0.98]'}`}
            >
              <div className="w-16 h-16 xs:w-full xs:aspect-square bg-gray-100 rounded border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {p.imageUrl ? (
                   <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-gray-300" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[9px] text-blue-600 font-bold uppercase truncate">{p.brand}</p>
                <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{p.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-black text-gray-900">৳{p.sellingPrice}</span>
                  <span className={`text-[8px] px-1 py-0.5 rounded font-black hidden xs:inline-block ${p.currentStock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.currentStock} QTY
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout - Responsive Sidebar */}
      <div className={`
        fixed inset-x-0 bottom-0 bg-white border-t z-30 transition-all duration-300 lg:static lg:w-80 xl:w-96 lg:border-t-0 lg:flex lg:flex-col gap-4 print:hidden shadow-2xl lg:shadow-none
        ${isCartExpanded ? 'h-[80vh]' : 'h-16 lg:h-full'}
      `}>
        {/* Toggle Cart for Mobile */}
        <button 
          onClick={() => setIsCartExpanded(!isCartExpanded)}
          className="lg:hidden w-full h-16 flex items-center justify-between px-4 bg-gray-900 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-blue-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Cart Total: ৳{totals.final.toFixed(0)}</span>
          </div>
          {isCartExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        <div className={`flex flex-col h-full overflow-hidden ${isCartExpanded ? 'flex' : 'hidden lg:flex'}`}>
          <div className="wp-card rounded-md overflow-hidden shrink-0 hidden lg:block">
            <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <User size={14} className="text-gray-600" />
              <h3 className="text-[10px] font-bold text-gray-800 uppercase">Customer Info</h3>
            </div>
            <div className="p-3 space-y-2">
              <input type="text" placeholder="Name" className="w-full px-2 py-1.5 border rounded text-xs" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <input type="text" placeholder="Phone" className="w-full px-2 py-1.5 border rounded text-xs" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="hidden lg:flex p-3 border-b bg-gray-50 items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} />
                <h3 className="font-bold text-xs uppercase">Items</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {cart.length > 0 ? cart.map(item => (
                <div key={item.product.id} className="flex gap-2 items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                    <ImageIcon size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-[9px] text-gray-500">৳{item.product.sellingPrice} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-red-400 p-1 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                  <ShoppingCart size={32} strokeWidth={1} className="mb-2" />
                  <p className="text-[10px]">Cart is empty</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t space-y-1.5">
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Subtotal</span>
                <span>৳{totals.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>৳{totals.final.toFixed(0)}</span>
              </div>
            </div>

            <div className="p-3">
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${
                  cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg active:scale-95'
                }`}
              >
                <CreditCard size={16} /> Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal - Responsive */}
      {showInvoice && lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-5">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <CheckCircle size={18} /> Sale Success
              </div>
              <button onClick={() => setShowInvoice(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-4 sm:p-8 space-y-6 overflow-y-auto">
              <div className="text-center">
                <h1 className="text-xl font-black uppercase">{appName}</h1>
                <p className="text-[10px] font-bold text-gray-500">{currentShowroom.name}</p>
              </div>
              {/* Detailed Invoice Content Simplified for UI */}
              <div className="border-t pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Invoice:</span>
                  <span className="font-bold">{lastSale.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Paid:</span>
                  <span className="font-black text-blue-600">৳{lastSale.finalAmount.toFixed(0)}</span>
                </div>
              </div>
              <button onClick={() => window.print()} className="w-full py-3 bg-gray-900 text-white rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;