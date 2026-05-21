import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export function DashboardPage() {
  const [stats, setStats] = useState({ todaySales: 0, todayTrx: 0, monthlySales: 0, monthlyTrx: 0, prevMonthSales: 0 });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [cashSummary, setCashSummary] = useState({ totalIn: 0, totalOut: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      // Fetch semua parallel
      const [todayRes, monthRes, prevMonthRes, itemsRes, cashRes] = await Promise.all([
        supabase.from('transactions').select('grand_total').gte('created_at', todayStart),
        supabase.from('transactions').select('grand_total, created_at').gte('created_at', monthStart),
        supabase.from('transactions').select('grand_total').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
        supabase.from('transaction_items').select('product_name, qty, subtotal').gte('created_at', monthStart),
        supabase.from('cash_flow').select('type, amount').gte('created_at', monthStart)
      ]);

      // Stats
      const todaySales = todayRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      const monthlySales = monthRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      const prevMonthSales = prevMonthRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      setStats({
        todaySales, todayTrx: todayRes.data?.length || 0,
        monthlySales, monthlyTrx: monthRes.data?.length || 0,
        prevMonthSales
      });

      // Chart data — penjualan 7 hari terakhir
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
        const dayTotal = monthRes.data?.filter(t => t.created_at >= dayStart && t.created_at <= dayEnd)
          .reduce((s, t) => s + Number(t.grand_total), 0) || 0;
        last7.push({ label, total: dayTotal });
      }
      setChartData(last7);

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
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const growthPct = stats.prevMonthSales > 0
    ? ((stats.monthlySales - stats.prevMonthSales) / stats.prevMonthSales * 100).toFixed(1)
    : null;
  const isGrowthPositive = Number(growthPct) >= 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-sm">
          <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Penjualan Hari Ini */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign size={18} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Hari Ini</span>
          </div>
          <p className="text-2xl font-bold truncate">{formatCurrency(stats.todaySales)}</p>
          <p className="text-indigo-200 text-xs mt-1">{stats.todayTrx} transaksi</p>
        </div>

        {/* Penjualan Bulan Ini */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
            </div>
            {growthPct !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${isGrowthPositive ? 'text-green-600' : 'text-red-500'}`}>
                {isGrowthPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(growthPct)}%
              </span>
            )}
          </div>
          <p className="text-lg font-bold truncate">{formatCurrency(stats.monthlySales)}</p>
          <p className="text-gray-400 text-xs mt-1">Bulan ini • {stats.monthlyTrx} trx</p>
        </div>

        {/* Kas Masuk */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <ArrowUpRight size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-lg font-bold truncate text-emerald-600 dark:text-emerald-400">{formatCurrency(cashSummary.totalIn)}</p>
          <p className="text-gray-400 text-xs mt-1">Total masuk bulan ini</p>
        </div>

        {/* Kas Keluar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <ArrowDownRight size={18} className="text-red-500 dark:text-red-400" />
            </div>
          </div>
          <p className="text-lg font-bold truncate text-red-500 dark:text-red-400">{formatCurrency(cashSummary.totalOut)}</p>
          <p className="text-gray-400 text-xs mt-1">Total keluar bulan ini</p>
        </div>
      </div>

      {/* Chart 7 Hari */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold mb-1">Penjualan 7 Hari Terakhir</h3>
        <p className="text-xs text-gray-400 mb-5">Grafik omzet harian</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
              fill="url(#salesGrad)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold mb-1 flex items-center gap-2">
            <ShoppingBag size={18} className="text-indigo-500" />
            Produk Terlaris Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 mb-5">Berdasarkan revenue</p>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={110} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => l} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cash Flow Bulan Ini */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold mb-1 flex items-center gap-2">
            <Package size={18} className="text-emerald-500" />
            Kas Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 mb-5">Ringkasan arus kas</p>
          <div className="space-y-4">
            {/* Masuk */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Masuk</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(cashSummary.totalIn)}</span>
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
                <span className="font-semibold text-red-500 dark:text-red-400">{formatCurrency(cashSummary.totalOut)}</span>
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
                {formatCurrency(cashSummary.totalIn - cashSummary.totalOut)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
