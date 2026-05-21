import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Receipt, Printer } from 'lucide-react';
import { supabase } from '../services/supabase';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

export function CashierPage({ printerService, printerConnected, onShowToast }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [quickAmounts] = useState([50000, 100000, 200000]);

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
    } catch (error) {
      handleError(error, 'Gagal memuat produk', onShowToast);
    } finally {
      setProductLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

      let printed = false;
      if (printerConnected) {
        try { await printerService.print(printData); printed = true; } catch { /* fallback */ }
      }
      if (!printed) printFallback(printData);

      clearCart();
      onShowToast(`✅ Berhasil! Kembalian: ${formatCurrency(change)}`, 'success');
    } catch (error) {
      handleError(error, 'Gagal memproses transaksi', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT — Products */}
      <div className="flex-1 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} placeholder="Cari produk..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Products Grid */}
        {productLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingCart size={40} className="mb-3 opacity-40" />
            <p>{search ? 'Produk tidak ditemukan' : 'Belum ada produk aktif'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`relative p-4 rounded-2xl text-left transition-all duration-150 active:scale-95 border-2 ${
                    inCart
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500'
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-3">
                    <span className="text-xl">🍰</span>
                  </div>
                  <p className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{formatCurrency(product.price)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — Cart + Payment */}
      <div className="lg:w-80 xl:w-96 flex flex-col gap-4">
        {/* Cart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart size={18} className="text-indigo-500" />
              Keranjang
              {cartCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>
              )}
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 font-medium">Hapus semua</button>
            )}
          </div>

          <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p>Belum ada item</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(item.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                    <Plus size={12} />
                  </button>
                  <button onClick={() => removeItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        {cart.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Receipt size={18} className="text-indigo-500" />
              Pembayaran
            </h3>

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Ongkir</span>
                <input
                  type="number" value={shippingCost || ''} min={0} placeholder="0"
                  onChange={e => setShippingCost(Number(e.target.value) || 0)}
                  className="w-28 text-right px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-700">
                <span>Total</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Bayar input */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Uang Bayar (Rp)</label>
              <input
                type="number" value={paid} placeholder="0" min={0}
                onChange={e => setPaid(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 outline-none focus:border-indigo-500 text-lg font-bold text-right"
              />
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2">
                {quickAmounts.map(a => (
                  <button key={a} onClick={() => setPaid(String(a))}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 transition-colors">
                    {formatCurrency(a).replace('Rp', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Kembalian */}
            {paidAmount >= grandTotal && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Kembalian</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(change)}</span>
              </div>
            )}
            {paidAmount > 0 && paidAmount < grandTotal && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-red-600">Kurang</span>
                <span className="text-xl font-bold text-red-500">{formatCurrency(grandTotal - paidAmount)}</span>
              </div>
            )}

            {/* Bayar Button */}
            <button
              onClick={processPayment}
              disabled={loading || paidAmount < grandTotal || cart.length === 0}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <Printer size={18} />
                  Bayar & Cetak Nota
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}