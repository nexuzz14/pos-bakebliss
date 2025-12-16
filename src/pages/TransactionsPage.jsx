import React, { useState, useEffect } from 'react';
import { Receipt, ChevronRight, Calendar, DollarSign, Truck, Package, X, Printer } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { BluetoothPrinterService } from '../services/bluetoothPrinterService';
import { handleError } from '../utils/errorHandler';

export function TransactionsPage({ printerService, printerConnected, onShowToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [printing, setPrinting] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error) {
      handleError(error, 'Gagal memuat transaksi', onShowToast);
    }
    setLoading(false);
  };

    useEffect(() => {
        (async () => {
            await loadTransactions();
        })();
    }, []);

  const filterTransactions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(t => {
      const transDate = new Date(t.created_at);
      if (filter === 'today') return transDate >= today;
      if (filter === 'week') return transDate >= weekAgo;
      if (filter === 'month') return transDate >= monthAgo;
      return true;
    });
  };

  const calculateStats = () => {
    const filtered = filterTransactions();
    return {
      count: filtered.length,
      total: filtered.reduce((sum, t) => sum + t.grand_total, 0),
      avg: filtered.length > 0 ? filtered.reduce((sum, t) => sum + t.grand_total, 0) / filtered.length : 0
    };
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
        try {
          await printerService.print(printData);
          printed = true;
          onShowToast('Nota berhasil dicetak ulang', 'success');
        } catch (error) {
          console.error('Bluetooth print failed:', error);
        }
      }

      if (!printed) {
        printFallback(printData);
        onShowToast('Nota dibuka di window baru', 'info');
      }
    } catch (error) {
      handleError(error, 'Gagal cetak ulang nota', onShowToast);
    }
    setPrinting(false);
  };

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
      <html>
        <head>
          <title>Nota - ${data.transactionNo}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 20px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">TOKO KUE MANIS</div>
          <div class="center">Jl. Manis No. 123</div>
          <div class="center">Telp: 0812-3456-7890</div>
          <div class="line"></div>
          <div>No: ${data.transactionNo}</div>
          <div>${new Date().toLocaleString('id-ID')}</div>
          <div class="line"></div>
          <table>${itemsHtml}</table>
          <div class="line"></div>
          <table>
            <tr>
              <td>Subtotal:</td>
              <td align="right">${formatCurrency(data.subtotal)}</td>
            </tr>
            ${data.shippingCost > 0 ? `
            <tr>
              <td>Ongkir:</td>
              <td align="right">${formatCurrency(data.shippingCost)}</td>
            </tr>
            ` : ''}
            <tr class="bold">
              <td>TOTAL:</td>
              <td align="right">${formatCurrency(data.grandTotal)}</td>
            </tr>
            <tr>
              <td>BAYAR:</td>
              <td align="right">${formatCurrency(data.paid)}</td>
            </tr>
            <tr>
              <td>KEMBALI:</td>
              <td align="right">${formatCurrency(data.change)}</td>
            </tr>
          </table>
          <div class="line"></div>
          <div class="center">Terima kasih</div>
          <div class="center">Selamat menikmati 🍰</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = filterTransactions();
  const stats = calculateStats();

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="
          bg-white text-gray-900
          dark:bg-gray-800 dark:text-white
          rounded-lg p-4
        ">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Receipt size={24} />
          Riwayat Transaksi
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <div className="
            bg-gray-100 dark:bg-gray-700
            p-3 rounded-lg text-center
          ">
            <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{stats.count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Transaksi</div>
          </div>
          <div className="
            bg-gray-100 dark:bg-gray-700
            p-3 rounded-lg text-center
          ">
            <div className="text-lg font-bold text-green-500 dark:text-green-400">{formatCurrency(stats.total)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="
            bg-gray-100 dark:bg-gray-700
            p-3 rounded-lg text-center
          ">
            <div className="text-lg font-bold text-yellow-500 dark:text-yellow-400">{formatCurrency(stats.avg)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
        >
          7 Hari
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
        >
          30 Hari
        </button>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <Receipt size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Memuat transaksi...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Receipt size={48} className="mx-auto mb-4 opacity-50" />
          <p>Belum ada transaksi</p>
          <p className="text-sm text-gray-500 mt-2">
            {filter !== 'all' ? 'Coba filter lain' : 'Transaksi akan muncul di sini'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map(transaction => (
            <div
              key={transaction.transaction_no}
              onClick={() => setSelectedTransaction(transaction)}
              className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-mono text-sm text-blue-500 dark:text-blue-400 mb-1">
                    {transaction.transaction_no}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar size={12} />
                    <span>{formatDate(transaction.created_at)}</span>
                    <span>•</span>
                    <span>{formatTime(transaction.created_at)}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-500" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Package size={14} className="text-gray-500 dark:text-gray-400" />
                    <span>{transaction.items?.length || 0} item</span>
                  </div>
                  {transaction.shipping_cost > 0 && (
                    <div className="flex items-center gap-1">
                      <Truck size={14} className="text-gray-500 dark:text-gray-400" />
                      <span>{formatCurrency(transaction.shipping_cost)}</span>
                    </div>
                  )}
                </div>
                <div className="text-lg font-bold text-green-400">
                  {formatCurrency(transaction.grand_total)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-lg font-bold">Detail Transaksi</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Transaction Info */}
              <div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white p-3 rounded-lg">
                <div className="font-mono text-sm text-blue-400 mb-2">
                  {selectedTransaction.transaction_no}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{formatDate(selectedTransaction.created_at)}</span>
                  <span>•</span>
                  <span>{formatTime(selectedTransaction.created_at)}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Package size={16} className="text-gray-600 dark:text-gray-300" />
                    Item ({selectedTransaction.items?.length || 0})
                  </h3>

                  <div className="space-y-2">
                    {selectedTransaction.items?.map((item, index) => (
                      <div
                        key={index}
                        className="
                          p-3 rounded-lg
                          bg-gray-100
                          dark:bg-gray-700
                        "
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900 dark:text-white">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(item.price)} x {item.qty}
                            </div>
                          </div>

                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(item.price * item.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


              {/* Summary */}
              <div
                className="
                  p-3 rounded-lg space-y-2
                  bg-gray-100
                  dark:bg-gray-700
                "
              >
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(selectedTransaction.total)}
                  </span>
                </div>

                {/* Ongkir */}
                {selectedTransaction.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Truck size={14} />
                      Ongkir:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedTransaction.shipping_cost)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div
                  className="
                    border-t pt-2 flex justify-between font-bold
                    border-gray-300
                    dark:border-gray-600
                  "
                >
                  <span className="text-gray-900 dark:text-white">TOTAL:</span>
                  <span className="text-green-600 dark:text-green-400 text-lg">
                    {formatCurrency(selectedTransaction.grand_total)}
                  </span>
                </div>

                {/* Bayar */}
                <div
                  className="
                    flex justify-between text-sm border-t pt-2
                    border-gray-300
                    dark:border-gray-600
                  "
                >
                  <span className="text-gray-600 dark:text-gray-400">Bayar:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(selectedTransaction.paid)}
                  </span>
                </div>

                {/* Kembali */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Kembali:</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {formatCurrency(selectedTransaction.change)}
                  </span>
                </div>
              </div>


              {/* Reprint Button */}
              <button
                onClick={() => handleReprint(selectedTransaction)}
                disabled={printing}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:text-black disabled:bg-gray-600 p-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                {printing ? 'Mencetak...' : 'Cetak Ulang Nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}