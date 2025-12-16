import React, { useState, useEffect } from 'react';
import { ShoppingCart, Printer, Package, Receipt } from 'lucide-react';
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
    
    if (connected) {
      showToast('Printer berhasil terhubung!', 'success');
    } else {
      showToast('Gagal menghubungkan printer', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-xl font-bold">🍰 Kasir BakeBliss</h1>
        <div className="flex gap-2">
          {!printerConnected ? (
            <button
              onClick={connectPrinter}
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              disabled={loading}
              title="Connect Printer"
            >
              <Printer size={20} />
            </button>
          ) : (
            <div className="p-2 bg-green-600 rounded-lg" title="Printer Connected">
              <Printer size={20} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex z-30">
        <button
          onClick={() => setScreen('cashier')}
          className={`flex-1 p-4 flex flex-col items-center gap-1 ${
            screen === 'cashier' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
        >
          <ShoppingCart size={24} />
          <span className="text-xs">Kasir</span>
        </button>
        <button
          onClick={() => setScreen('products')}
          className={`flex-1 p-4 flex flex-col items-center gap-1 ${
            screen === 'products' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
        >
          <Package size={24} />
          <span className="text-xs">Produk</span>
        </button>
        <button
          onClick={() => setScreen('transactions')}
          className={`flex-1 p-4 flex flex-col items-center gap-1 ${
            screen === 'transactions' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
        >
          <Receipt size={24} />
          <span className="text-xs">Transaksi</span>
        </button>
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
        {screen === 'products' && (
          <ProductsPage onShowToast={showToast} />
        )}
        {screen === 'transactions' && <TransactionsPage />}
      </div>
    </div>
  );
}