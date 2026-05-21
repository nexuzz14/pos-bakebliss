import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Receipt, LogOut, Sun, Moon, Printer, Wallet, FlaskConical, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from './Toast';

export function Layout({ printerService, printerConnected, connectPrinter, loading, toast, setToast }) {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  // APPLY THEME KE HTML
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={24} />, roles: ['admin', 'manager'] },
    { id: '/cashier', label: 'Kasir', icon: <ShoppingCart size={24} />, roles: ['admin', 'manager', 'cashier'] },
    { id: '/menu', label: 'Menu', icon: <Package size={24} />, roles: ['admin', 'manager'] },
    { id: '/transactions', label: 'Transaksi', icon: <Receipt size={24} />, roles: ['admin', 'manager', 'cashier'] },
    { id: '/cashflow', label: 'Kas', icon: <Wallet size={24} />, roles: ['admin', 'manager'] },
    { id: '/ingredients', label: 'Bahan', icon: <FlaskConical size={24} />, roles: ['admin', 'manager'] },
    { id: '/users', label: 'Users', icon: <UserCog size={24} />, roles: ['admin'] },
  ].filter(item => item.roles.includes(role || 'cashier')); // default cashier if no role

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col md:flex-row">
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">🍰 BakeBliss</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              role === 'admin'
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                : role === 'manager'
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            }`}>
              {role || 'Loading...'}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.id}
              to={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
          >
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            <span className="font-medium">Toggle Theme</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
          >
            <LogOut size={24} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
          <h1 className="text-xl font-bold">🍰 BakeBliss</h1>
          
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {location.pathname === '/cashier' && (
              !printerConnected ? (
                <button
                  onClick={connectPrinter}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={loading}
                >
                  <Printer size={20} />
                </button>
              ) : (
                <div className="p-2 bg-green-600 text-white rounded-lg">
                  <Printer size={20} />
                </div>
              )
            )}
            
            <button onClick={handleLogout} className="p-2 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Desktop Topbar for Printer (Only on Cashier) */}
        <header className="hidden md:flex bg-white dark:bg-gray-800 p-4 items-center justify-end border-b border-gray-200 dark:border-gray-700">
           {location.pathname === '/cashier' ? (
             <div className="flex gap-2 items-center">
                <span className="mr-2 font-medium">Printer Status:</span>
                {!printerConnected ? (
                  <button
                    onClick={connectPrinter}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={loading}
                  >
                    <Printer size={20} />
                    {loading ? 'Connecting...' : 'Connect Printer'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                    <Printer size={20} />
                    Connected
                  </div>
                )}
             </div>
           ) : (
             <div className="h-10"></div> // Spacer to keep height consistent
           )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 pb-24 md:pb-4 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex z-30 pb-safe">
          {navItems.map(item => (
            <Link
              key={item.id}
              to={item.id}
              className={`flex-1 p-3 flex flex-col items-center gap-1 ${
                location.pathname === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
