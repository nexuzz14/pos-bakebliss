import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Package, Eye, EyeOff } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YEARS = [2024, 2025, 2026, 2027, 2028];

export function DashboardPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [showMoney, setShowMoney] = useState(false);
  
  const [stats, setStats] = useState({ todaySales: 0, todayTrx: 0, monthlySales: 0, monthlyTrx: 0, prevMonthSales: 0, dailyAvg: 0 });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [cashSummary, setCashSummary] = useState({ totalIn: 0, totalOut: 0 });
  const [loading, setLoading] = useState(true);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
      
      const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString();
      
      const monthStartObj = new Date(selectedYear, selectedMonth, 1);
      const monthEndObj = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      
      const prevMonthStartObj = new Date(selectedYear, selectedMonth - 1, 1);
      const prevMonthEndObj = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

      const monthStart = monthStartObj.toISOString();
      const monthEnd = monthEndObj.toISOString();
      const prevMonthStart = prevMonthStartObj.toISOString();
      const prevMonthEnd = prevMonthEndObj.toISOString();

      const dateStartStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const dateEndStr = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      // Fetch semua parallel
      const [todayRes, monthRes, prevMonthRes, itemsRes, cashRes] = await Promise.all([
        isCurrentMonth ? supabase.from('transactions').select('grand_total').gte('created_at', todayStart) : Promise.resolve({ data: [] }),
        supabase.from('transactions').select('grand_total, created_at').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('transactions').select('grand_total').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
        supabase.from('transaction_items').select('product_name, qty, subtotal').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('cash_flow').select('type, amount').gte('date', dateStartStr).lte('date', dateEndStr)
      ]);

      // Stats
      const todaySales = isCurrentMonth ? (todayRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0) : 0;
      const monthlySales = monthRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      const prevMonthSales = prevMonthRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      
      const daysInMonth = monthEndObj.getDate();
      const dailyAvg = monthlySales / (isCurrentMonth ? currentDate.getDate() : daysInMonth);

      setStats({
        todaySales, 
        todayTrx: isCurrentMonth ? (todayRes.data?.length || 0) : 0,
        monthlySales, 
        monthlyTrx: monthRes.data?.length || 0,
        prevMonthSales,
        dailyAvg
      });

      // Chart data — trend harian satu bulan penuh
      const chartDataArr = [];
      for (let i = 1; i <= daysInMonth; i++) {
        // Jika bulan ini, jangan tampilkan data hari esok
        if (isCurrentMonth && i > currentDate.getDate()) break;

        const d = new Date(selectedYear, selectedMonth, i);
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const dayStartStr = new Date(selectedYear, selectedMonth, i).toISOString();
        const dayEndStr = new Date(selectedYear, selectedMonth, i, 23, 59, 59, 999).toISOString();
        
        const dayTotal = monthRes.data?.filter(t => t.created_at >= dayStartStr && t.created_at <= dayEndStr)
          .reduce((s, t) => s + Number(t.grand_total), 0) || 0;
          
        chartDataArr.push({ label, total: dayTotal });
      }
      setChartData(chartDataArr);

      // Top produk bulan ini
      const productMap = {};
      itemsRes.data?.forEach(item => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
        productMap[item.product_name].qty += item.qty;
        productMap[item.product_name].revenue += Number(item.subtotal);
      });
      const sorted = Object.entries(productMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(sorted);

      // Cash summary bulan ini
      const totalIn = cashRes.data?.filter(c => c.type === 'in').reduce((s, c) => s + Number(c.amount), 0) || 0;
      const totalOut = cashRes.data?.filter(c => c.type === 'out').reduce((s, c) => s + Number(c.amount), 0) || 0;
      setCashSummary({ totalIn, totalOut });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]); // Dependency ditambah agar refresh saat filter ganti

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const growthPct = stats.prevMonthSales > 0
    ? ((stats.monthlySales - stats.prevMonthSales) / stats.prevMonthSales * 100).toFixed(1)
    : null;
  const isGrowthPositive = Number(growthPct) >= 0;
  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-sm">
          <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="font-bold text-indigo-600 dark:text-indigo-400">{displayMoney(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading && chartData.length === 0) { // Hanya full loading jika belum ada data sama sekali
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Loading overlay for filter transitions */}
      {loading && chartData.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 rounded-3xl flex items-center justify-center">
          <div className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium text-sm animate-pulse shadow-lg">
            Memuat data...
          </div>
        </div>
      )}

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Ringkasan performa bisnis
            </p>
          </div>
          <button 
            onClick={() => setShowMoney(!showMoney)}
            className="p-2 ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-sm"
            title={showMoney ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showMoney ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        
        {/* FILTER */}
        <div className="flex items-center gap-2">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Penjualan Hari Ini / Rata-rata */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white col-span-2 lg:col-span-1 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign size={18} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
              {isCurrentMonth ? 'Hari Ini' : 'Rata-rata Harian'}
            </span>
          </div>
          <p className="text-2xl font-bold truncate">
            {displayMoney(isCurrentMonth ? stats.todaySales : stats.dailyAvg)}
          </p>
          <p className="text-indigo-200 text-xs mt-1 font-medium">
            {isCurrentMonth ? `${stats.todayTrx} transaksi hari ini` : 'Estimasi per hari'}
          </p>
        </div>

        {/* Penjualan Bulan Ini */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
            </div>
            {growthPct !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-bold ${isGrowthPositive ? 'text-green-600' : 'text-red-500'}`}>
                {isGrowthPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(growthPct)}%
              </span>
            )}
          </div>
          <p className="text-lg font-bold truncate">{displayMoney(stats.monthlySales)}</p>
          <p className="text-gray-400 text-xs mt-1">Total {MONTHS[selectedMonth]} • {stats.monthlyTrx} trx</p>
        </div>

        {/* Kas Masuk */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <ArrowUpRight size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-lg font-bold truncate text-emerald-600 dark:text-emerald-400">{displayMoney(cashSummary.totalIn)}</p>
          <p className="text-gray-400 text-xs mt-1">Kas masuk {MONTHS[selectedMonth]}</p>
        </div>

        {/* Kas Keluar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <ArrowDownRight size={18} className="text-red-500 dark:text-red-400" />
            </div>
          </div>
          <p className="text-lg font-bold truncate text-red-500 dark:text-red-400">{displayMoney(cashSummary.totalOut)}</p>
          <p className="text-gray-400 text-xs mt-1">Kas keluar {MONTHS[selectedMonth]}</p>
        </div>
      </div>

      {/* Chart Tren Harian */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-bold mb-1">Tren Penjualan Harian</h3>
        <p className="text-xs text-gray-400 mb-5">Performa selama bulan {MONTHS[selectedMonth]} {selectedYear}</p>
        {chartData.length === 0 ? (
           <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Belum ada data penjualan</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#salesGrad)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold mb-1 flex items-center gap-2">
            <ShoppingBag size={18} className="text-indigo-500" />
            Produk Terlaris
          </h3>
          <p className="text-xs text-gray-400 mb-5">Berdasarkan revenue bulan ini</p>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={110} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => l} cursor={{fill: 'transparent'}} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cash Flow Bulan Ini */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold mb-1 flex items-center gap-2">
            <Package size={18} className="text-emerald-500" />
            Arus Kas
          </h3>
          <p className="text-xs text-gray-400 mb-5">Ringkasan kas bulan {MONTHS[selectedMonth]}</p>
          <div className="space-y-4">
            {/* Masuk */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Masuk</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{displayMoney(cashSummary.totalIn)}</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: cashSummary.totalIn + cashSummary.totalOut > 0
                    ? `${(cashSummary.totalIn / (cashSummary.totalIn + cashSummary.totalOut)) * 100}%` : '0%' }} />
              </div>
            </div>
            {/* Keluar */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Keluar</span>
                <span className="font-semibold text-red-500 dark:text-red-400">{displayMoney(cashSummary.totalOut)}</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-700"
                  style={{ width: cashSummary.totalIn + cashSummary.totalOut > 0
                    ? `${(cashSummary.totalOut / (cashSummary.totalIn + cashSummary.totalOut)) * 100}%` : '0%' }} />
              </div>
            </div>
            {/* Saldo */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="font-semibold text-sm">Saldo Bersih</span>
              <span className={`text-lg font-bold ${cashSummary.totalIn - cashSummary.totalOut >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {displayMoney(cashSummary.totalIn - cashSummary.totalOut)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
