import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  Wallet,
  Activity,
  Award
} from 'lucide-react';

const COLORS = ['#f59e0b', '#ea580c', '#d97706', '#fbbf24', '#b45309'];
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

      const [todayRes, monthRes, prevMonthRes, itemsRes, cashRes] = await Promise.all([
        isCurrentMonth ? supabase.from('transactions').select('grand_total').gte('created_at', todayStart) : Promise.resolve({ data: [] }),
        supabase.from('transactions').select('grand_total, created_at').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('transactions').select('grand_total').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
        supabase.from('transaction_items').select('product_name, qty, subtotal').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('cash_flow').select('type, amount').gte('date', dateStartStr).lte('date', dateEndStr)
      ]);

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

      const chartDataArr = [];
      for (let i = 1; i <= daysInMonth; i++) {
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

      const totalIn = cashRes.data?.filter(c => c.type === 'in').reduce((s, c) => s + Number(c.amount), 0) || 0;
      const totalOut = cashRes.data?.filter(c => c.type === 'out').reduce((s, c) => s + Number(c.amount), 0) || 0;
      setCashSummary({ totalIn, totalOut });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const growthPct = stats.prevMonthSales > 0
    ? ((stats.monthlySales - stats.prevMonthSales) / stats.prevMonthSales * 100).toFixed(1)
    : null;
  const isGrowthPositive = Number(growthPct) >= 0;
  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-[#1b1a23]/95 backdrop-blur-md border border-rose-500/20 rounded-2xl px-4 py-2.5 shadow-xl text-xs">
          <p className="text-stone-400 font-semibold mb-1">{label}</p>
          <p className="font-extrabold font-display text-rose-500 dark:text-rose-400 text-sm">
            {displayMoney(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 relative">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500 text-white shadow-sm">
              Live Insight
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              BakeBliss Patisserie Performance
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            Analisis Eksekutif & Bisnis
          </h2>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowMoney(!showMoney)}
            className="p-2.5 bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-600 dark:text-stone-300 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-sm"
            title={showMoney ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showMoney ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          <div className="flex items-center gap-2 bg-white dark:bg-[#1b1a23] p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-0 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i} className="bg-white dark:bg-stone-900">{m}</option>
              ))}
            </select>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-0 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 outline-none cursor-pointer"
            >
              {YEARS.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-stone-900">{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Penjualan Hari Ini / Rata-rata */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <DollarSign size={20} />
            </div>
            <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-white/25 backdrop-blur-md">
              {isCurrentMonth ? 'Hari Ini' : 'Rata Harian'}
            </span>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold font-display tracking-tight">
            {displayMoney(isCurrentMonth ? stats.todaySales : stats.dailyAvg)}
          </p>
          <p className="text-rose-100 text-xs mt-1.5 font-medium flex items-center gap-1.5">
            <Activity size={13} />
            <span>{isCurrentMonth ? `${stats.todayTrx} transaksi hari ini` : 'Estimasi rata-rata per hari'}</span>
          </p>
        </div>

        {/* Card 2: Penjualan Bulan Ini */}
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800/80 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            {growthPct !== null && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                isGrowthPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {isGrowthPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(growthPct)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            {displayMoney(stats.monthlySales)}
          </p>
          <p className="text-stone-400 text-xs mt-1.5 font-medium">
            Total omset {MONTHS[selectedMonth]} • {stats.monthlyTrx} nota
          </p>
        </div>

        {/* Card 3: Kas Masuk */}
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800/80 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Pemasukan
            </span>
          </div>
          <p className="text-2xl font-extrabold font-display tracking-tight text-emerald-600 dark:text-emerald-400">
            {displayMoney(cashSummary.totalIn)}
          </p>
          <p className="text-stone-400 text-xs mt-1.5 font-medium">
            Arus kas masuk bulan {MONTHS[selectedMonth]}
          </p>
        </div>

        {/* Card 4: Kas Keluar */}
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800/80 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/10 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <ArrowDownRight size={20} />
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
              Pengeluaran
            </span>
          </div>
          <p className="text-2xl font-extrabold font-display tracking-tight text-rose-600 dark:text-rose-400">
            {displayMoney(cashSummary.totalOut)}
          </p>
          <p className="text-stone-400 text-xs mt-1.5 font-medium">
            Operasional & bahan bulan {MONTHS[selectedMonth]}
          </p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-extrabold font-display text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <span>Tren Penjualan Harian</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-400">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Grafik pergerakan omset harian patisserie
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-stone-400 text-sm font-medium">
            Belum ada data penjualan pada periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.15} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#f59e0b"
                strokeWidth={3}
                fill="url(#salesGrad)"
                dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#ea580c' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom 2-Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Best-Selling Products Card */}
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-extrabold font-display text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Award size={18} className="text-rose-500" />
                <span>5 Menu Terlaris (Best-Sellers)</span>
              </h3>
            </div>
            <p className="text-xs text-stone-400 mb-5">Penyumbang omset terbesar bulan ini</p>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">Belum ada data produk terlaris</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                  width={130}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => l} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={20}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cash Flow Summary Card */}
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold font-display text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <Wallet size={18} className="text-emerald-500" />
              <span>Komposisi Arus Kas</span>
            </h3>
            <p className="text-xs text-stone-400 mb-6">Neraca masuk & keluar selama {MONTHS[selectedMonth]}</p>
          </div>

          <div className="space-y-5">
            {/* Pemasukan Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-stone-500 dark:text-stone-400">Total Kas Masuk (In)</span>
                <span className="text-emerald-600 dark:text-emerald-400">{displayMoney(cashSummary.totalIn)}</span>
              </div>
              <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{
                    width: cashSummary.totalIn + cashSummary.totalOut > 0
                      ? `${(cashSummary.totalIn / (cashSummary.totalIn + cashSummary.totalOut)) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>

            {/* Pengeluaran Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-stone-500 dark:text-stone-400">Total Kas Keluar (Out)</span>
                <span className="text-rose-500 dark:text-rose-400">{displayMoney(cashSummary.totalOut)}</span>
              </div>
              <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{
                    width: cashSummary.totalIn + cashSummary.totalOut > 0
                      ? `${(cashSummary.totalOut / (cashSummary.totalIn + cashSummary.totalOut)) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>

            {/* Saldo Bersih Box */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-sm text-stone-700 dark:text-stone-300">Net Cash Balance</span>
                <p className="text-[11px] text-stone-400">Selisih pemasukan - pengeluaran</p>
              </div>
              <span className={`text-xl font-extrabold font-display ${
                cashSummary.totalIn - cashSummary.totalOut >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500'
              }`}>
                {displayMoney(cashSummary.totalIn - cashSummary.totalOut)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
