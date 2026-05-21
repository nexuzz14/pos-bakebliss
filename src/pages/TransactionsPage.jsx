import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Calendar, Truck, Package, X, Printer, Search, TrendingUp, ShoppingBag, BarChart2, ChevronRight } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

const FILTERS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: '7 Hari' },
  { key: 'month', label: '30 Hari' },
  { key: 'all', label: 'Semua' },
];

export function TransactionsPage({ printerService, printerConnected, onShowToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [printing, setPrinting] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error) {
      handleError(error, 'Gagal memuat transaksi', onShowToast);
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const filterTransactions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(t => {
      const transDate = new Date(t.created_at);
      const matchDate =
        filter === 'today' ? transDate >= today :
        filter === 'week' ? transDate >= weekAgo :
        filter === 'month' ? transDate >= monthAgo : true;
      const matchSearch = !search || t.transaction_no?.toLowerCase().includes(search.toLowerCase());
      return matchDate && matchSearch;
    });
  };

  const filteredTransactions = filterTransactions();
  const stats = {
    count: filteredTransactions.length,
    total: filteredTransactions.reduce((s, t) => s + Number(t.grand_total), 0),
    avg: filteredTransactions.length > 0
      ? filteredTransactions.reduce((s, t) => s + Number(t.grand_total), 0) / filteredTransactions.length
      : 0
  };

  const formatDate = d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = d => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const printFallback = (data) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    const itemsHtml = (data.items || []).map(item => `
      <tr><td>${item.product_name || item.name}</td><td align="right">${item.qty}x</td><td align="right">${formatCurrency(item.price * item.qty)}</td></tr>
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
      <br><div class="center bold">Thank you!</div></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleReprint = async (transaction) => {
    setPrinting(true);
    try {
      const printData = {
        transactionNo: transaction.transaction_no,
        items: transaction.items,
        subtotal: transaction.total,
        shippingCost: transaction.shipping_cost || 0,
        grandTotal: transaction.grand_total,
        paid: transaction.paid,
        change: transaction.change
      };
      let printed = false;
      if (printerConnected) {
        try { await printerService.print(printData); printed = true; onShowToast('Nota dicetak', 'success'); } catch { /* fallback */ }
      }
      if (!printed) { printFallback(printData); onShowToast('Nota dibuka di window baru', 'info'); }
    } catch (error) {
      handleError(error, 'Gagal cetak ulang nota', onShowToast);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Semua aktivitas penjualan</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={16} className="text-indigo-500" />
            <span className="text-xs text-gray-500 font-medium">Transaksi</span>
          </div>
          <p className="text-2xl font-bold">{stats.count}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">Total</span>
          </div>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={16} className="text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Rata-rata</span>
          </div>
          <p className="text-base font-bold text-purple-600 dark:text-purple-400 truncate">{formatCurrency(stats.avg)}</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} placeholder="Cari no. transaksi..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Receipt size={48} className="mx-auto mb-3 opacity-30" />
          <p>{search ? 'Transaksi tidak ditemukan' : filter !== 'all' ? 'Belum ada transaksi di periode ini' : 'Belum ada transaksi'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map(trx => (
            <div key={trx.id}
              onClick={() => setSelectedTransaction(trx)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {trx.transaction_no}
                    </span>
                    {trx.shipping_cost > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        <Truck size={10} /> Ongkir
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={11} />
                    <span>{formatDate(trx.created_at)} · {formatTime(trx.created_at)}</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="flex items-center gap-1"><Package size={11} /> {trx.items?.length || 0} item</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(trx.grand_total)}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">Detail Transaksi</h2>
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{selectedTransaction.transaction_no}</p>
              </div>
              <button onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Waktu */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar size={14} />
                {formatDate(selectedTransaction.created_at)} · {formatTime(selectedTransaction.created_at)}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-sm mb-2 text-gray-500 uppercase tracking-wide">Items</h3>
                <div className="space-y-2">
                  {selectedTransaction.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{item.product_name || item.name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.price)} × {item.qty}</p>
                      </div>
                      <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedTransaction.total)}</span>
                </div>
                {selectedTransaction.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Truck size={12} /> Ongkir</span>
                    <span>{formatCurrency(selectedTransaction.shipping_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span>Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedTransaction.grand_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Bayar</span>
                  <span>{formatCurrency(selectedTransaction.paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Kembali</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedTransaction.change)}</span>
                </div>
              </div>

              {/* Reprint */}
              <button onClick={() => handleReprint(selectedTransaction)} disabled={printing}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                <Printer size={18} />
                {printing ? 'Mencetak...' : 'Cetak Ulang Nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}