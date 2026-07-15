import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  LogOut,
  Sun,
  Moon,
  Printer,
  Wallet,
  FlaskConical,
  UserCog,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from './Toast';
import { AccountSettingsModal } from './AccountSettingsModal';

export function Layout({ printerService, printerConnected, connectPrinter, loading, toast, setToast }) {
  const { role, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // APPLY THEME KE HTML
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
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
    {
      id: '/',
      label: 'Ringkasan',
      sublabel: 'Analytics & Insight',
      icon: <LayoutDashboard size={20} />,
      roles: ['admin', 'manager'],
      badge: 'PRO'
    },
    {
      id: '/cashier',
      label: 'Kasir POS',
      sublabel: 'Terminal Kasir',
      icon: <ShoppingCart size={20} />,
      roles: ['admin', 'manager', 'cashier'],
      badge: 'LIVE'
    },
    {
      id: '/menu',
      label: 'Katalog Menu',
      sublabel: 'Produk & Harga',
      icon: <Package size={20} />,
      roles: ['admin', 'manager']
    },
    {
      id: '/transactions',
      label: 'Riwayat Transaksi',
      sublabel: 'Nota & Laporan',
      icon: <Receipt size={20} />,
      roles: ['admin', 'manager', 'cashier']
    },
    {
      id: '/cashflow',
      label: 'Arus Kas',
      sublabel: 'Masuk & Keluar',
      icon: <Wallet size={20} />,
      roles: ['admin', 'manager']
    },
    {
      id: '/ingredients',
      label: 'Bahan Baku',
      sublabel: 'Resep & Inventori',
      icon: <FlaskConical size={20} />,
      roles: ['admin', 'manager']
    },
    {
      id: '/users',
      label: 'Pengguna',
      sublabel: 'Akses & Staf',
      icon: <UserCog size={20} />,
      roles: ['admin']
    },
  ].filter(item => item.roles.includes(role || 'cashier'));

  // Helper title mapping
  const getPageTitle = (path) => {
    const item = navItems.find(i => i.id === path);
    return item ? { title: item.label, sub: item.sublabel } : { title: 'POS BakeBliss', sub: 'Artisan Bakery' };
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#f8f6f3] dark:bg-[#0f0e13] text-[#2c221e] dark:text-[#f1ece6] flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-white/90 dark:bg-[#18161f]/90 backdrop-blur-xl border-r border-stone-200/80 dark:border-stone-800/80 h-screen sticky top-0 z-40 select-none shadow-sm">
        
        {/* Brand & Role Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-xl shadow-md text-white font-display font-bold">
                🥐
              </div>
              <div>
                <p className="font-extrabold font-display text-base tracking-tight text-stone-800 dark:text-stone-100">
                  BakeBliss <span className="text-rose-500">POS</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Sistem Aktif</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-rose-500 text-white shadow-sm">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Menu Utama
          </div>
          {navItems.map(item => {
            const active = location.pathname === item.id;
            return (
              <Link
                key={item.id}
                to={item.id}
                className={`group relative flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 text-white shadow-lg shadow-rose-500/25 font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 hover:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">{item.label}</div>
                    <div className={`text-[11px] leading-tight ${active ? 'text-rose-100' : 'text-stone-400 dark:text-stone-500'}`}>
                      {item.sublabel}
                    </div>
                  </div>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    active
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area (Theme Toggle + Account Settings + Logout) */}
        <div className="p-3.5 border-t border-rose-500/10 dark:border-rose-500/10 space-y-2 bg-stone-50/50 dark:bg-[#131218]/50">
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1b1a23] text-stone-700 dark:text-stone-300 hover:border-rose-500/40 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                <UserCog size={16} />
              </div>
              <span className="text-xs font-bold">Pengaturan Akun</span>
            </div>
            <ChevronRight size={14} className="opacity-60" />
          </button>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1b1a23] text-stone-700 dark:text-stone-300 hover:border-rose-500/40 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:rotate-12 transition-transform">
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <span className="text-xs font-bold">
                {theme === 'light' ? 'Mode Malam (Dark)' : 'Mode Siang (Light)'}
              </span>
            </div>
            <div className="w-7 h-4 rounded-full bg-stone-200 dark:bg-rose-500/30 p-0.5 flex items-center">
              <div className={`w-3 h-3 rounded-full bg-rose-500 transition-transform ${theme === 'dark' ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all font-bold text-xs"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={16} />
              <span>Keluar Sesi (Logout)</span>
            </div>
            <ChevronRight size={14} className="opacity-60" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white/90 dark:bg-[#18161f]/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-rose-500/10 dark:border-rose-500/10 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-lg shadow-md text-white">
              🥐
            </div>
            <div>
              <h1 className="text-base font-extrabold font-display leading-none">BakeBliss</h1>
              <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase">{pageInfo.title}</p>
            </div>
          </div>
          
          <div className="flex gap-1.5 items-center">
            {(location.pathname === '/cashier' || location.pathname === '/transactions') && (
              <button
                onClick={connectPrinter}
                className={`p-2 rounded-xl transition-all ${
                  printerConnected
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                }`}
                disabled={loading}
              >
                <Printer size={18} />
              </button>
            )}

            <button
              onClick={() => setShowAccountModal(true)}
              className="p-2 rounded-xl bg-indigo-500/15 text-indigo-500 hover:bg-indigo-500/25 transition-colors"
              title="Pengaturan Akun"
            >
              <UserCog size={18} />
            </button>

            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <button onClick={handleLogout} className="p-2 text-rose-600 rounded-xl hover:bg-rose-500/10">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-16 bg-white/70 dark:bg-[#15131a]/70 backdrop-blur-xl px-6 items-center justify-between border-b border-rose-500/10 dark:border-rose-500/10 sticky top-0 z-30">
          {/* Left: Dynamic Breadcrumb / Page Title */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-display text-stone-800 dark:text-stone-100">
                  {pageInfo.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                  {pageInfo.sub}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Indicators */}
          <div className="flex items-center gap-4">
            {/* Live Clock Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-[#1f1c28] border border-stone-200/60 dark:border-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300">
              <Clock size={14} className="text-rose-500" />
              <span>
                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="font-mono text-rose-500 dark:text-rose-400 font-bold">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Printer Connection Status Button */}
            {(location.pathname === '/cashier' || location.pathname === '/transactions') && (
              <div className="flex items-center">
                {!printerConnected ? (
                  <button
                    onClick={connectPrinter}
                    disabled={loading}
                    className="group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    <Printer size={16} className={loading ? 'animate-bounce' : ''} />
                    <span>{loading ? 'Menghubungkan...' : 'Hubungkan Printer'}</span>
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Printer Thermal Siap</span>
                  </div>
                )}
              </div>
            )}

            {/* Store / Profile Badge */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center gap-2.5 pl-3 border-l border-stone-200 dark:border-stone-800 hover:opacity-80 transition-opacity text-left"
              title="Klik untuk Pengaturan Akun & Profil"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                BB
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-bold leading-none text-stone-800 dark:text-stone-200">Magelang Store</p>
                <p className="text-[10px] text-stone-400 font-medium">BakeBliss HQ</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-6 pb-40 md:pb-6 overflow-auto">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#18161f]/95 backdrop-blur-xl border-t border-rose-500/10 dark:border-rose-500/10 flex items-center justify-around z-40 px-1 py-1 shadow-lg">
          {navItems.map(item => {
            const active = location.pathname === item.id;
            return (
              <Link
                key={item.id}
                to={item.id}
                className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
                  active
                    ? 'text-rose-500 dark:text-rose-400 font-bold scale-105'
                    : 'text-stone-500 dark:text-stone-400 hover:text-rose-500'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${active ? 'bg-rose-500/15' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-semibold truncate max-w-[60px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
}
