import React, { useState, useMemo } from 'react';
import { Product, StockItem, Showroom, Sale, SaleItem } from '../types';
import { Search, ShoppingCart, Trash2, CreditCard, Tag, Percent, Image as ImageIcon, User, Phone, X, Printer, CheckCircle, MapPin, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';

declare var html2pdf: any;

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

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = () => {
    if (!lastSale) return;
    const element = document.getElementById('pos-invoice-content');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `Invoice_${lastSale.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
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
                <p className="text-[9px] text-blue-600 font-bold uppercase truncate">{p.brand} • {p.category}</p>
                <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{p.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-black text-gray-900">৳{p.sellingPrice}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-gray-500 font-bold uppercase">Size: {p.size}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded font-black ${p.currentStock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.currentStock} QTY
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className={`
        fixed inset-x-0 bottom-0 bg-white border-t z-30 transition-all duration-300 lg:static lg:w-80 xl:w-96 lg:border-t-0 lg:flex lg:flex-col gap-4 print:hidden shadow-2xl lg:shadow-none
        ${isCartExpanded ? 'h-[80vh]' : 'h-16 lg:h-full'}
      `}>
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
              <input type="text" placeholder="Address" className="w-full px-2 py-1.5 border rounded text-xs" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
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

      {/* Invoice Modal */}
      {showInvoice && lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-300 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:w-full print:m-0" id="pos-invoice">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <CheckCircle size={18} /> Sale Success
              </div>
              <button onClick={() => setShowInvoice(false)} className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto print:overflow-visible" id="pos-invoice-content">
              <div className="p-6 sm:p-10 space-y-8 print:p-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-white rounded mx-auto flex items-center justify-center text-gray-900 font-black text-2xl mb-4 border border-gray-100">
                    {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" alt="logo" /> : appName.charAt(0)}
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">{appName}</h1>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium Shoe Store</p>
                  <div className="text-[9px] text-gray-400 font-bold uppercase space-y-0.5">
                    <p>Phone: 01775672645</p>
                    <p>House-49, Road No. 4, Dhaka 1230, Bangladesh</p>
                  </div>
                </div>

                <div className="border-y border-dashed border-gray-200 py-4 grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-black text-gray-400 uppercase text-[9px]">Customer</p>
                    <p className="font-black text-gray-900 truncate">{lastSale.customerName || 'Walk-in Customer'}</p>
                    {lastSale.customerPhone && <p className="text-gray-500">{lastSale.customerPhone}</p>}
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="font-black text-gray-400 uppercase text-[9px]">Invoice Details</p>
                    <p className="font-black text-gray-900">#{lastSale.id}</p>
                    <p className="text-gray-500">{new Date(lastSale.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 font-black text-gray-400 uppercase text-[9px]">
                        <th className="pb-2">Item Description</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lastSale.items.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId);
                        return (
                          <tr key={idx} className="text-gray-900 font-medium">
                            <td className="py-3">
                              <p className="font-bold">{prod?.name || 'Unknown Item'}</p>
                              <p className="text-[9px] text-gray-400 uppercase">{prod?.brand} • {prod?.category} • Size: {prod?.size}</p>
                            </td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right">৳{item.unitPrice.toLocaleString()}</td>
                            <td className="py-3 text-right font-bold">৳{(item.unitPrice * item.quantity).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                    <span>Subtotal</span>
                    <span>৳{lastSale.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                    <span>VAT ({vatRate}%)</span>
                    <span>৳{lastSale.vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                    <span>Discount</span>
                    <span className="text-red-600">-৳{lastSale.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-gray-900 border-t-2 border-gray-900 pt-2">
                    <span>Net Payable</span>
                    <span className="text-blue-600">৳{lastSale.finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center pt-8 pb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Thank you for shopping with us!</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex flex-col xs:flex-row gap-2 print:hidden shrink-0">
              <button 
                onClick={handlePrint} 
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
                onClick={() => setShowInvoice(false)} 
                className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body > *:not(#pos-invoice) {
            display: none !important;
          }
          #pos-invoice {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999 !important;
          }
          #pos-invoice-content {
            overflow: visible !important;
            height: auto !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default POS;