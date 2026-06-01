import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToExcel } from '../utils/exportExcel';
import {
  PlusCircle, TrendingUp, TrendingDown, Wallet,
  Download, Filter, X, Pencil, Trash2, ChevronDown, Eye, EyeOff
} from 'lucide-react';

const CATEGORIES_IN = ['Penjualan', 'Modal', 'Investasi', 'Lain-lain'];
const CATEGORIES_OUT = ['Pembelian Bahan', 'Gaji', 'Listrik & Air', 'Sewa', 'Transportasi', 'Peralatan', 'Lain-lain'];

const initialForm = {
  type: 'in',
  category: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
};

export function CashFlowPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [deleteId, setDeleteId] = useState(null);
  const [showMoney, setShowMoney] = useState(false);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_flow')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterMonth) {
        const start = `${filterMonth}-01`;
        const end = new Date(filterMonth.slice(0, 4), filterMonth.slice(5, 7), 0)
          .toISOString().split('T')[0];
        query = query.gte('date', start).lte('date', end);
      }
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching cash flow:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterMonth]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totalIn = records.filter(r => r.type === 'in').reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = records.filter(r => r.type === 'out').reduce((s, r) => s + Number(r.amount), 0);
  const balance = totalIn - totalOut;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        user_id: user?.id,
      };

      if (editId) {
        const { error } = await supabase.from('cash_flow').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cash_flow').insert(payload);
        if (error) throw error;
      }

      setForm(initialForm);
      setEditId(null);
      setShowForm(false);
      fetchRecords();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record) => {
    setForm({
      type: record.type,
      category: record.category || '',
      description: record.description || '',
      amount: String(record.amount),
      date: record.date,
    });
    setEditId(record.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('cash_flow').delete().eq('id', deleteId);
      if (error) throw error;
      setDeleteId(null);
      fetchRecords();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleExport = () => {
    const exportData = records.map(r => ({
      'Tanggal': r.date,
      'Tipe': r.type === 'in' ? 'Masuk' : 'Keluar',
      'Kategori': r.category || '-',
      'Deskripsi': r.description || '-',
      'Jumlah (Rp)': Number(r.amount),
    }));
    exportToExcel(exportData, `Kas-BakeBliss-${filterMonth}`, 'Kas');
  };

  const categories = form.type === 'in' ? CATEGORIES_IN : CATEGORIES_OUT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">💰 Kas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pencatatan uang masuk & keluar</p>
          </div>
          <button 
            onClick={() => setShowMoney(!showMoney)}
            className="p-2 ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-all shadow-sm"
            title={showMoney ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showMoney ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={() => { setForm(initialForm); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Masuk</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400 truncate">{displayMoney(totalIn)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Keluar</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 truncate">{displayMoney(totalOut)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className={`p-3 rounded-xl ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
            <Wallet size={20} className={balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Saldo</p>
            <p className={`text-sm font-bold truncate ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {displayMoney(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Form Add/Edit */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{editId ? 'Edit Catatan' : 'Tambah Catatan'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe */}
            <div className="flex gap-3">
              <button type="button"
                onClick={() => setForm(f => ({ ...f, type: 'in', category: '' }))}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-colors ${
                  form.type === 'in'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}>
                ↑ Uang Masuk
              </button>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, type: 'out', category: '' }))}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-colors ${
                  form.type === 'out'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}>
                ↓ Uang Keluar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Tanggal</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Jumlah */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Jumlah (Rp)</label>
              <input type="number" value={form.amount} placeholder="0"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Deskripsi (opsional)</label>
              <textarea value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Keterangan tambahan..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className={`flex-1 py-2.5 rounded-xl font-medium text-white transition-colors ${
                  form.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}>
                {saving ? 'Menyimpan...' : editId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {['all', 'in', 'out'].map(t => (
            <button key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === t
                  ? t === 'in' ? 'bg-green-600 text-white' : t === 'out' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {t === 'all' ? 'Semua' : t === 'in' ? '↑ Masuk' : '↓ Keluar'}
            </button>
          ))}
        </div>
        <input type="month" value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500">Belum ada catatan kas</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">
              Tambah Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Tipe</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Deskripsi</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Jumlah</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.type === 'in'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {r.type === 'in' ? '↑ Masuk' : '↓ Keluar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.category || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell max-w-[200px] truncate">
                      {r.description || '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                      r.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {r.type === 'in' ? '+' : '-'}{displayMoney(r.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(r)}
                          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(r.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Hapus Catatan?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Data yang dihapus tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Batal
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
