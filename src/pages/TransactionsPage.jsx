import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Calendar,
  Truck,
  Package,
  X,
  Printer,
  Search,
  TrendingUp,
  ShoppingBag,
  BarChart2,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

const FILTERS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: '7 Hari Terakhir' },
  { key: 'month', label: '30 Hari Terakhir' },
  { key: 'all', label: 'Semua Riwayat' },
  { key: 'custom', label: '📅 Pilih Tanggal' },
];

export function TransactionsPage({ printerService, printerConnected, onShowToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [printing, setPrinting] = useState(false);
  const [showMoney, setShowMoney] = useState(false);

  // Custom Date Picker State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

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
      let matchDate = true;
      if (filter === 'today') matchDate = transDate >= today;
      else if (filter === 'week') matchDate = transDate >= weekAgo;
      else if (filter === 'month') matchDate = transDate >= monthAgo;
      else if (filter === 'custom') {
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;
        if (start && transDate < start) matchDate = false;
        if (end && transDate > end) matchDate = false;
      }
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
        try { await printerService.printReceipt(printData); printed = true; onShowToast('Struk berhasil dicetak ulang!', 'success'); } catch { /* fallback */ }
      }
      if (!printed) { printFallback(printData); onShowToast('Struk dibuka di jendela printer browser', 'info'); }
    } catch (error) {
      handleError(error, 'Gagal cetak ulang nota', onShowToast);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500 text-white shadow-sm">
              Arsip Transaksi
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Riwayat Kasir & Struk Penjualan
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            Riwayat Penjualan Patisserie
          </h2>
        </div>

        <button
          onClick={() => setShowMoney(!showMoney)}
          className="self-start sm:self-center px-4 py-2.5 bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-extrabold text-stone-600 dark:text-stone-300 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm flex items-center gap-2"
        >
          {showMoney ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{showMoney ? 'Sembunyikan Nominal' : 'Tampilkan Nominal'}</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Transaksi</p>
            <p className="text-2xl font-extrabold font-display text-stone-800 dark:text-stone-100 mt-1">
              {filteredTransactions.length} <span className="text-xs font-medium text-stone-400">order</span>
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <Receipt size={22} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Omset Filtered</p>
            <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400 mt-1">
              {displayMoney(stats.total)}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Rata-rata / Order</p>
            <p className="text-2xl font-extrabold font-display text-rose-500 dark:text-rose-400 mt-1">
              {displayMoney(stats.avg)}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 dark:text-rose-400">
            <ShoppingBag size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 sm:px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all ${
                filter === f.key
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-sm shadow-rose-500/25'
                  : 'bg-stone-100 dark:bg-[#14131a] text-stone-600 dark:text-stone-400 hover:bg-rose-500/15 hover:text-rose-400 border border-transparent dark:border-stone-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            placeholder="Cari nomor nota (misal: TRX-001)..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-100/80 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {filter === 'custom' && (
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-rose-500/40 dark:border-rose-500/40 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-stone-100 dark:bg-[#14131a] p-2 sm:px-3 rounded-2xl border border-stone-200 dark:border-stone-800 flex-1">
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar size={16} className="text-rose-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">Dari:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer max-w-[145px] sm:max-w-none"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-stone-100 dark:bg-[#14131a] p-2 sm:px-3 rounded-2xl border border-stone-200 dark:border-stone-800 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 shrink-0">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer max-w-[145px] sm:max-w-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-3 text-xs font-extrabold text-stone-600 dark:text-stone-300">
            <span className="w-full text-center sm:w-auto px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              📊 Ditemukan: {filteredTransactions.length} Transaksi
            </span>
          </div>
        </div>
      )}

      {/* Transactions List View */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-3xl">
              🧾
            </div>
            <p className="text-base font-bold text-stone-700 dark:text-stone-300">Belum Ada Transaksi</p>
            <p className="text-xs text-stone-400 mt-1">
              {search ? 'Nomor transaksi tidak ditemukan' : 'Belum ada transaksi di periode waktu ini'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {filteredTransactions.map(trx => (
              <div
                key={trx.id}
                onClick={() => setSelectedTransaction(trx)}
                className="p-4 sm:p-5 hover:bg-rose-500/5 dark:hover:bg-rose-500/5 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/15 to-indigo-500/10 dark:from-rose-500/20 dark:to-indigo-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 font-extrabold shrink-0">
                    <Receipt size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-extrabold text-stone-800 dark:text-stone-100">
                        {trx.transaction_no}
                      </span>
                      {trx.shipping_cost > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-500 dark:text-rose-400 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                          <Truck size={10} /> Ongkir
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
                      <Clock size={12} />
                      <span>{formatDate(trx.created_at)} · {formatTime(trx.created_at)}</span>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="flex items-center gap-1 font-bold text-stone-600 dark:text-stone-300">
                        <Package size={12} /> {trx.items?.length || 0} item
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0 border-stone-100 dark:border-stone-800">
                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 sm:hidden block">Total Pembayaran</span>
                    <p className="font-extrabold font-display text-emerald-600 dark:text-emerald-400 text-base">
                      {displayMoney(trx.grand_total)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center text-stone-400 group-hover:text-rose-500">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Receipt Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#181620] rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-rose-500/20 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-transparent">
              <div>
                <h3 className="text-base font-extrabold font-display text-stone-800 dark:text-stone-100 flex items-center gap-2">
                  <Receipt size={18} className="text-rose-500" />
                  <span>Detail Transaksi & Struk</span>
                </h3>
                <p className="text-xs font-mono font-bold text-rose-500 dark:text-rose-400 mt-0.5">
                  {selectedTransaction.transaction_no}
                </p>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Date & Time Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#131219] border border-stone-200/60 dark:border-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar size={14} className="text-rose-500" />
                  <span>Waktu Pembayaran</span>
                </div>
                <span className="font-bold text-stone-800 dark:text-stone-200 text-left sm:text-right">
                  {formatDate(selectedTransaction.created_at)} · {formatTime(selectedTransaction.created_at)}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400">Rincian Menu</span>
                <div className="space-y-2">
                  {selectedTransaction.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-stone-50 dark:bg-[#131219] rounded-2xl border border-stone-200/50 dark:border-stone-800/60"
                    >
                      <div>
                        <p className="font-bold text-sm text-stone-800 dark:text-stone-100">
                          {item.product_name || item.name}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {formatCurrency(item.price)} × <span className="font-extrabold text-rose-500">{item.qty}</span>
                        </p>
                      </div>
                      <p className="font-extrabold font-display text-sm text-rose-500 dark:text-rose-400">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="bg-stone-50 dark:bg-[#131219] rounded-2xl p-4 border border-stone-200/60 dark:border-stone-800 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Subtotal Menu</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{formatCurrency(selectedTransaction.total)}</span>
                </div>
                {selectedTransaction.shipping_cost > 0 && (
                  <div className="flex justify-between text-stone-500 font-medium">
                    <span className="flex items-center gap-1"><Truck size={12} /> Ongkir / Tambahan</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{formatCurrency(selectedTransaction.shipping_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-extrabold text-base pt-2.5 border-t border-stone-200 dark:border-stone-800">
                  <span className="font-display">Total Tagihan</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-display text-lg">
                    {formatCurrency(selectedTransaction.grand_total)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500 pt-1">
                  <span>Dibayar (Tunai)</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{formatCurrency(selectedTransaction.paid)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Kembalian</span>
                  <span className="font-extrabold text-rose-500 dark:text-rose-400">{formatCurrency(selectedTransaction.change)}</span>
                </div>
              </div>

              {/* Reprint Thermal Receipt Action */}
              <button
                onClick={() => handleReprint(selectedTransaction)}
                disabled={printing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all active:scale-95"
              >
                <Printer size={18} />
                <span>{printing ? 'Mencetak Ulang...' : 'Cetak Ulang Struk Thermal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}