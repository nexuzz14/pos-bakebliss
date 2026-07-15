import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Receipt,
  Printer,
  Sparkles,
  Coffee,
  Cake,
  Croissant,
  Cookie,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  X
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

// Helper to assign a fitting bakery emoji/category icon based on product name
function getProductBadge(product) {
  const name = (product.name || '').toLowerCase();
  if (name.includes('kopi') || name.includes('coffee') || name.includes('latte') || name.includes('tea') || name.includes('teh') || name.includes('matcha')) {
    return { icon: '☕', label: 'Minuman', color: 'from-indigo-600 to-purple-700', pill: 'bg-indigo-950/20 text-indigo-400' };
  }
  if (name.includes('croissant') || name.includes('roti') || name.includes('bread') || name.includes('pastry') || name.includes('puff')) {
    return { icon: '🥐', label: 'Pastry & Roti', color: 'from-rose-500 to-pink-600', pill: 'bg-rose-500/15 text-rose-400' };
  }
  if (name.includes('cake') || name.includes('kue') || name.includes('bolu') || name.includes('brownies') || name.includes('tart') || name.includes('lapis')) {
    return { icon: '🍰', label: 'Cake & Tart', color: 'from-pink-500 to-rose-500', pill: 'bg-pink-500/15 text-pink-400' };
  }
  if (name.includes('cookies') || name.includes('nastar') || name.includes('kastengel') || name.includes('salju') || name.includes('pie')) {
    return { icon: '🍪', label: 'Cookies & Snack', color: 'from-purple-500 to-indigo-600', pill: 'bg-purple-500/15 text-purple-400' };
  }
  return { icon: '🧁', label: 'Bakery', color: 'from-rose-500 to-indigo-600', pill: 'bg-rose-500/15 text-rose-400' };
}

export function CashierPage({ printerService, printerConnected, onShowToast }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [categories, setCategories] = useState(['Semua', 'Pastry & Roti', 'Cake & Tart', 'Minuman', 'Cookies & Snack', 'Bakery']);
  const [quickAmounts] = useState([50000, 100000, 200000]);
  const [showMobileCart, setShowMobileCart] = useState(false);

  const loadProducts = useCallback(async () => {
    setProductLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setProducts(data || []);

      try {
        const catData = await categoryService.getActive();
        if (catData && catData.length > 0) {
          setCategories(['Semua', ...catData.map(c => c.name)]);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    } catch (error) {
      handleError(error, 'Gagal memuat produk', onShowToast);
    } finally {
      setProductLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'Semua') return true;
    if (p.category) {
      return p.category === selectedCategory;
    }
    const badge = getProductBadge(p);
    return badge.label === selectedCategory;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(item => item.id === id ? { ...item, qty: item.qty + delta } : item)
      .filter(item => item.qty > 0)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => { setCart([]); setPaid(''); setShippingCost(0); };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = subtotal + (Number(shippingCost) || 0);
  const paidAmount = parseInt(paid) || 0;
  const change = paidAmount >= grandTotal ? paidAmount - grandTotal : 0;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const printFallback = (data) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    const itemsHtml = data.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td align="right">${item.qty}x</td>
        <td align="right">${formatCurrency(item.price * item.qty)}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Nota - ${data.transactionNo}</title>
      <style>body{font-family:monospace;font-size:12px;margin:20px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:10px 0}table{width:100%}</style>
      </head><body>
      <div class="center bold" style="font-size:16px">BAKE BLISS</div>
      <div class="center">Jl. Ahmad Yani No. 24A</div><div class="center">Magelang</div>
      <div class="line"></div><div>No: ${data.transactionNo}</div>
      <div>${new Date().toLocaleString('id-ID')}</div><div class="line"></div>
      <table>${itemsHtml}</table><div class="line"></div>
      <table>
        <tr><td>Subtotal:</td><td align="right">${formatCurrency(data.subtotal)}</td></tr>
        ${data.shippingCost > 0 ? `<tr><td>Ongkir:</td><td align="right">${formatCurrency(data.shippingCost)}</td></tr>` : ''}
        <tr class="bold"><td>TOTAL:</td><td align="right">${formatCurrency(data.grandTotal)}</td></tr>
        <tr><td>BAYAR:</td><td align="right">${formatCurrency(data.paid)}</td></tr>
        <tr><td>KEMBALI:</td><td align="right">${formatCurrency(data.change)}</td></tr>
      </table>
      <div class="line"></div><div class="center">0881-0124-64949</div>
      <div class="center">We love to hear your feedback (the sweet and the bitter one😋)</div>
      <br><div class="center bold">Thank you!</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const processPayment = async () => {
    if (cart.length === 0) { onShowToast('Keranjang masih kosong!', 'error'); return; }
    if (paidAmount < grandTotal) { onShowToast('Uang bayar kurang!', 'error'); return; }

    setLoading(true);
    try {
      const trx = await transactionService.create({
        total: subtotal,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
        paid: paidAmount,
        change,
        items: cart
      });

      const printData = {
        transactionNo: trx.transaction_no,
        items: cart,
        subtotal,
        shippingCost,
        grandTotal,
        paid: paidAmount,
        change
      };

      if (printerConnected) {
        try {
          await printerService.printReceipt(printData);
          onShowToast('Transaksi sukses & struk tercetak thermal!', 'success');
        } catch (err) {
          console.error(err);
          onShowToast('Printer gagal cetak, beralih ke print browser...', 'error');
          printFallback(printData);
        }
      } else {
        printFallback(printData);
        onShowToast('Transaksi berhasil dicatat!', 'success');
      }

      clearCart();
      setShowMobileCart(false);
    } catch (error) {
      handleError(error, 'Gagal memproses transaksi', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* LEFT — Products & Categories */}
      <div className="flex-1 flex flex-col space-y-5 min-w-0">
        
        {/* Search & Category Header Card */}
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 md:p-5 rounded-3xl border border-rose-500/10 dark:border-rose-500/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between flex-1">
              <div className="relative flex-1 min-w-0">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  placeholder="Cari menu, kopi, cake..."
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-100/80 dark:bg-[#14131a] border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-sm font-medium transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 px-2 py-1 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Mobile Quick Cart Trigger Button */}
              <button
                type="button"
                onClick={() => setShowMobileCart(true)}
                className="lg:hidden relative flex items-center justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs gap-2 shrink-0 active:scale-95 shadow-md shadow-rose-500/20 transition-all"
              >
                <ShoppingCart size={18} />
                <span>Pesanan Kasir</span>
                {cartCount > 0 && (
                  <span className="bg-white text-rose-600 text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Products Counter Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 shrink-0">
              <Tag size={14} />
              <span>{filteredProducts.length} Produk Tersedia</span>
            </div>
          </div>

          {/* Category Filter Pills (COMPACT WRAPPED SO NO HORIZONTAL SLIDING) */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {categories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-150 flex items-center gap-1 ${
                    active
                      ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-[#14131a] text-stone-600 dark:text-stone-400 hover:bg-rose-500/15 hover:text-rose-400'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid — Compact & Sleek */}
        <div className="flex-1">
          {productLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-36 bg-white/60 dark:bg-[#1b1a23]/60 rounded-2xl animate-pulse border border-stone-200/50 dark:border-stone-800" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white/60 dark:bg-[#1b1a23]/60 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-2xl mb-3">
                🥐
              </div>
              <h3 className="text-sm font-bold font-display text-stone-700 dark:text-stone-300">
                Produk Tidak Ditemukan
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.id === product.id);
                const badge = getProductBadge(product.name);
                return (
                  <div
                    key={product.id}
                    className={`group relative flex flex-col justify-between p-2.5 rounded-2xl text-left transition-all duration-150 border ${
                      inCart
                        ? 'bg-gradient-to-b from-rose-500/15 to-indigo-500/5 dark:from-rose-500/20 dark:to-[#1b1a23] border-rose-500 shadow-md shadow-rose-500/10'
                        : 'bg-white/90 dark:bg-[#1b1a23]/90 border-stone-200/80 dark:border-stone-800/80 hover:border-rose-500/50 hover:shadow-md'
                    }`}
                  >
                    {/* Top Section: Bakery Icon & Active Cart Badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        onClick={() => !inCart && addToCart(product)}
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-lg shadow-sm cursor-pointer group-hover:scale-105 transition-transform`}
                      >
                        {badge.icon}
                      </div>

                      {inCart && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold shadow-sm">
                          {inCart.qty}x
                        </span>
                      )}
                    </div>

                    {/* Middle Section: Name & Price */}
                    <div
                      onClick={() => !inCart && addToCart(product)}
                      className="space-y-0.5 mb-2 cursor-pointer"
                    >
                      <h4 className="font-bold text-xs leading-snug line-clamp-1 text-stone-800 dark:text-stone-100 group-hover:text-rose-400 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-rose-500 dark:text-rose-400 font-extrabold font-display text-xs">
                        {formatCurrency(product.price)}
                      </p>
                    </div>

                    {/* Bottom Section: Interactive Qty Controls OR Add Button */}
                    <div className="pt-1.5 border-t border-stone-100 dark:border-stone-800/60">
                      {inCart ? (
                        <div className="flex items-center justify-between bg-rose-500/15 dark:bg-rose-500/20 p-0.5 rounded-xl border border-rose-500/40">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(product.id, -1); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#1b1a23] text-rose-600 dark:text-rose-400 font-extrabold shadow-sm active:scale-90"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-300 px-1">
                            {inCart.qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(product.id, 1); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500 text-white font-extrabold shadow-sm active:scale-90"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="w-full py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 hover:bg-rose-500 hover:text-white text-stone-700 dark:text-stone-200 font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
                        >
                          <Plus size={13} />
                          <span>Tambah</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Terminal Kasir Cart & Payment (Desktop Only) */}
      <div className="hidden lg:block lg:w-96 xl:w-[420px] shrink-0 sticky top-4">
        <div className="bg-white/95 dark:bg-[#1b1a23]/95 backdrop-blur-xl rounded-3xl border border-rose-500/10 dark:border-rose-500/10 shadow-xl flex flex-col h-fit max-h-[calc(100vh-4.5rem)] overflow-hidden">
          
          {/* Cart Terminal Header */}
          <div className="p-5 border-b border-stone-100 dark:border-stone-800/80 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-transparent shrink-0">
            <div>
              <h3 className="font-extrabold font-display text-base flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Receipt size={18} className="text-rose-500" />
                <span>Pesanan Aktif</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                {cartCount > 0 ? `${cartCount} item dalam keranjang` : 'Keranjang masih kosong'}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Item Rows */}
          <div className="p-4 space-y-2.5 overflow-y-auto min-h-[140px] max-h-[38vh]">
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center mb-3 text-2xl opacity-60">
                  🛒
                </div>
                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">Belum Ada Pesanan</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Klik produk di sebelah kiri untuk menambahkan ke keranjang</p>
              </div>
            ) : cart.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200/50 dark:border-stone-800/60 group hover:border-rose-500/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-stone-900 dark:text-stone-100">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{formatCurrency(item.price)}</span>
                    <span className="text-stone-300 dark:text-stone-600">•</span>
                    <span className="text-xs font-extrabold text-rose-500 dark:text-rose-400">
                      {formatCurrency(item.price * item.qty)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-[#1b1a23] p-1 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-xs font-extrabold text-stone-900 dark:text-stone-100">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/15 transition-colors ml-0.5"
                    title="Hapus"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment & Summary Footer Area */}
          <div className="p-5 bg-stone-50/80 dark:bg-[#14131a]/80 border-t border-stone-200/60 dark:border-stone-800 space-y-4 shrink-0">
            
            {/* Calculation Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-300 font-medium">
                <span>Subtotal Pesanan</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 font-medium">
                <span>Ongkir / Biaya Tambahan</span>
                <div className="relative">
                  <input
                    type="number"
                    value={shippingCost || ''}
                    min={0}
                    placeholder="0"
                    onChange={e => setShippingCost(Number(e.target.value) || 0)}
                    className="w-28 text-right px-2.5 py-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1b1a23] text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-rose-500 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2.5 border-t border-stone-200 dark:border-stone-800 font-extrabold text-base">
                <span className="font-display text-stone-900 dark:text-stone-100">Total Tagihan</span>
                <span className="text-rose-500 dark:text-rose-400 font-display text-lg">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Input Nominal Pembayaran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-200">
                  Nominal Bayar (Tunai)
                </label>
                {paidAmount > 0 && (
                  <button
                    onClick={() => setPaid('')}
                    className="text-[11px] text-rose-500 dark:text-rose-400 font-bold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <input
                type="number"
                value={paid}
                placeholder="Masukkan uang bayar..."
                min={0}
                onChange={e => setPaid(e.target.value)}
                disabled={cart.length === 0}
                className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1b1a23] text-stone-900 dark:text-stone-100 outline-none focus:border-rose-500 text-lg font-extrabold text-right transition-colors"
              />

              {/* Quick Cash Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => setPaid(String(grandTotal))}
                  disabled={cart.length === 0}
                  className="py-1.5 px-2 text-xs font-bold rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                >
                  Uang Pas
                </button>
                {quickAmounts.map(a => (
                  <button
                    key={a}
                    onClick={() => setPaid(String(a))}
                    disabled={cart.length === 0}
                    className="py-1.5 px-2 text-xs font-bold rounded-xl bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 hover:border-rose-500 hover:text-rose-400 transition-colors"
                  >
                    {a >= 1000 ? `${a / 1000}k` : a}
                  </button>
                ))}
              </div>
            </div>

            {/* Kembalian / Status Pembayaran Box */}
            {paidAmount >= grandTotal && cart.length > 0 && (
              <div className="bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 flex justify-between items-center animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-extrabold">Kembalian</span>
                </div>
                <span className="text-lg font-extrabold font-display text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(change)}
                </span>
              </div>
            )}

            {paidAmount > 0 && paidAmount < grandTotal && cart.length > 0 && (
              <div className="bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={18} />
                  <span className="text-xs font-extrabold">Kurang Bayar</span>
                </div>
                <span className="text-base font-extrabold font-display text-rose-500">
                  {formatCurrency(grandTotal - paidAmount)}
                </span>
              </div>
            )}

            {/* Proses Bayar & Cetak CTA Button */}
            <button
              onClick={processPayment}
              disabled={loading || paidAmount < grandTotal || cart.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Sparkles size={18} className="animate-spin" />
                  Memproses Transaksi...
                </span>
              ) : (
                <>
                  <Printer size={18} />
                  <span>Proses Bayar & Cetak Struk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING CART CHECKOUT BAR (lg:hidden) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-3.5 right-3.5 z-40 animate-slide-up">
          <button
            type="button"
            onClick={() => setShowMobileCart(true)}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 text-white shadow-2xl shadow-rose-500/40 border border-white/30 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-base relative">
                🛒
                <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow">
                  {cartCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-extrabold text-rose-100 uppercase tracking-wider">
                  {cartCount} Menu Dipilih
                </p>
                <p className="text-lg font-extrabold font-display leading-tight">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white text-rose-600 px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide shadow-md">
              <span>BAYAR SEKARANG</span>
              <span>➔</span>
            </div>
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET DRAWER FOR CART & CHECKOUT (lg:hidden) */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-[#181620] w-full max-h-[90vh] rounded-t-3xl sm:rounded-3xl sm:max-w-md flex flex-col shadow-2xl border-t border-rose-500/20 overflow-hidden">
            
            {/* Sheet Header */}
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-transparent shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold font-display text-base text-stone-800 dark:text-stone-100">
                    Pesanan Aktif
                  </h3>
                  <p className="text-xs text-stone-400 font-medium">
                    {cartCount > 0 ? `${cartCount} item dalam keranjang` : 'Keranjang kosong'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={() => setShowMobileCart(false)}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sheet Body — Cart Items */}
            <div className="p-4 space-y-2.5 overflow-y-auto max-h-[35vh]">
              {cart.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center text-stone-400">
                  <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3 text-2xl">
                    🛒
                  </div>
                  <p className="text-sm font-bold text-stone-600 dark:text-stone-300">Belum Ada Pesanan</p>
                  <p className="text-xs text-stone-400 mt-1 mb-4">Pilih produk dari menu untuk menambahkan</p>
                  <button
                    onClick={() => setShowMobileCart(false)}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-extrabold text-xs shadow-md"
                  >
                    Pilih Produk Sekarang
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-[#131219] border border-stone-200/60 dark:border-stone-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-stone-800 dark:text-stone-100">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-stone-400">{formatCurrency(item.price)}</span>
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span className="text-xs font-extrabold text-rose-500 dark:text-rose-400">
                          {formatCurrency(item.price * item.qty)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#1b1a23] p-1 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-rose-500/20 text-stone-600 dark:text-stone-300"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-6 text-center text-sm font-extrabold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-rose-500/20 text-stone-600 dark:text-stone-300"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 active:bg-rose-500/20 ml-0.5"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sheet Footer — Payment Controls */}
            {cart.length > 0 && (
              <div className="p-4 bg-stone-50 dark:bg-[#131219] border-t border-stone-200/60 dark:border-stone-800 space-y-3.5 shrink-0">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300 font-medium">
                    <span>Subtotal Pesanan</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 font-medium">
                    <span>Ongkir / Biaya Tambahan</span>
                    <input
                      type="number"
                      value={shippingCost || ''}
                      min={0}
                      placeholder="0"
                      onChange={e => setShippingCost(Number(e.target.value) || 0)}
                      className="w-24 text-right px-2.5 py-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1b1a23] text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-rose-500 text-xs font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 dark:border-stone-800 font-extrabold text-sm">
                    <span className="text-stone-900 dark:text-stone-100">Total Tagihan</span>
                    <span className="text-rose-500 dark:text-rose-400 text-base">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-200 block">
                    Nominal Bayar (Tunai)
                  </label>
                  <input
                    type="number"
                    value={paid}
                    placeholder="Masukkan uang bayar..."
                    min={0}
                    onChange={e => setPaid(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1b1a23] text-stone-900 dark:text-stone-100 outline-none focus:border-rose-500 text-base font-extrabold text-right"
                  />
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => setPaid(String(grandTotal))}
                      className="py-1.5 px-2 text-xs font-bold rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                    >
                      Uang Pas
                    </button>
                    {quickAmounts.map(a => (
                      <button
                        key={a}
                        onClick={() => setPaid(String(a))}
                        className="py-1.5 px-2 text-xs font-bold rounded-xl bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-rose-500 hover:text-white transition-colors"
                      >
                        {a / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                {change >= 0 && paidAmount > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Kembalian</span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(change)}</span>
                  </div>
                )}

                <button
                  onClick={processPayment}
                  disabled={loading || paidAmount < grandTotal}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <Printer size={18} />
                      <span>Proses Bayar & Cetak Struk</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}