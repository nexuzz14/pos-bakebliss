import React, { useState, useEffect } from 'react';
import { ShoppingCart, Printer, Package, Receipt, Sun, Moon } from 'lucide-react';
import { CashierPage } from './pages/CashierPage';
import { ProductsPage } from './pages/ProductsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { Toast } from './components/Toast';
import { BluetoothPrinterService } from './services/bluetoothPrinterService';

export default function App() {
  const [screen, setScreen] = useState('cashier');
  const [printerService] = useState(new BluetoothPrinterService());
  const [printerConnected, setPrinterConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // 🌗 THEME STATE
  const [theme, setTheme] = useState('light');

  // APPLY THEME KE HTML
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const autoConnectPrinter = async () => {
    if (printerService.isSupported()) {
      const connected = await printerService.autoConnect();
      setPrinterConnected(connected);
    }
  };

  useEffect(() => {
      (async () => {
          await autoConnectPrinter();
      })();
  }, []);

  const connectPrinter = async () => {
    setLoading(true);
    const connected = await printerService.connect();
    setPrinterConnected(connected);
    setLoading(false);

    showToast(
      connected ? 'Printer berhasil terhubung!' : 'Gagal menghubungkan printer',
      connected ? 'success' : 'error'
    );
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">🍰 Kasir BakeBliss</h1>

        <div className="flex gap-2 items-center">
          {/* THEME TOGGLE */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* PRINTER */}
          {!printerConnected ? (
            <button
              onClick={connectPrinter}
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              <Printer size={20} />
            </button>
          ) : (
            <div className="p-2 bg-green-600 rounded-lg">
              <Printer size={20} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex z-30">
        {[
          { id: 'cashier', label: 'Kasir', icon: <ShoppingCart size={24} /> },
          { id: 'products', label: 'Produk', icon: <Package size={24} /> },
          { id: 'transactions', label: 'Transaksi', icon: <Receipt size={24} /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex-1 p-4 flex flex-col items-center gap-1 ${
              screen === item.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="pb-20 p-4">
        {screen === 'cashier' && (
          <CashierPage
            printerService={printerService}
            printerConnected={printerConnected}
            onShowToast={showToast}
          />
        )}
        {screen === 'products' && <ProductsPage onShowToast={showToast} />}
        {screen === 'transactions' && <TransactionsPage />}
      </div>
    </div>
  );
}
