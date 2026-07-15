import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToExcel } from '../utils/exportExcel';
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Filter,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  Eye,
  EyeOff,
  Calendar,
  Tag,
  FileSpreadsheet
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
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
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
      Tanggal: r.date,
      Tipe: r.type === 'in' ? 'Masuk' : 'Keluar',
      Kategori: r.category || '-',
      Keterangan: r.description || '-',
      'Jumlah (Rp)': Number(r.amount),
    }));
    exportToExcel(exportData, `Kas-BakeBliss-${filterMonth}`, 'Kas');
  };

  const categories = form.type === 'in' ? CATEGORIES_IN : CATEGORIES_OUT;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500 text-white shadow-sm">
              Keuangan & Kas
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Buku Kas & Pengeluaran</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            Arus Kas Operasional
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowMoney(!showMoney)}
            className="p-3 bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-600 dark:text-stone-300 hover:text-rose-500 transition-all shadow-sm"
          >
            {showMoney ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all active:scale-95"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => { setForm(initialForm); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-rose-500/25 transition-all active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Catat Arus Kas</span>
          </button>
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Kas Masuk</span>
            <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
              {displayMoney(totalIn)}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Kas Keluar</span>
            <p className="text-2xl font-extrabold font-display text-rose-500">
              {displayMoney(totalOut)}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Saldo Bersih (Net)</span>
            <p className={`text-2xl font-extrabold font-display ${balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              {displayMoney(balance)}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Form Add / Edit MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181620] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold font-display text-lg text-stone-800 dark:text-stone-100">
                {editId ? 'Edit Catatan Arus Kas' : 'Catat Arus Kas Baru'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'in', category: '' }))}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                    form.type === 'in'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-md'
                      : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500/50'
                  }`}
                >
                  + Pemasukan (In)
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'out', category: '' }))}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                    form.type === 'out'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-500 shadow-md'
                      : 'border-stone-200 dark:border-stone-800 hover:border-rose-500/50'
                  }`}
                >
                  - Pengeluaran (Out)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Kategori</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Contoh: 150000"
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Keterangan / Catatan</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Contoh: Beli tepung terigu & mentega premium"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditId(null); }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Catat Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Semua Arus' },
            { id: 'in', label: 'Masuk' },
            { id: 'out', label: 'Keluar' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all ${
                filterType === f.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-[#14131a] text-stone-600 dark:text-stone-400 hover:text-rose-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-stone-400" />
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 outline-none"
          />
        </div>
      </div>

      {/* Records Table / List */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-stone-600 dark:text-stone-300">Belum Ada Catatan Arus Kas</p>
            <p className="text-xs text-stone-400 mt-0.5">Catat pemasukan atau pengeluaran operasional bakery Anda.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {records.map(record => (
              <div
                key={record.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold shrink-0 shadow-sm ${
                    record.type === 'in'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                  }`}>
                    {record.type === 'in' ? '↑' : '↓'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-stone-800 dark:text-stone-100">
                        {record.category || 'Operasional'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800">
                        {record.date}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 truncate">
                      {record.description || 'Tanpa keterangan'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className={`font-extrabold font-display text-sm sm:text-base ${
                    record.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}>
                    {record.type === 'in' ? '+' : '-'}{displayMoney(record.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(record)}
                      className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-rose-500 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(record.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/15 text-stone-400 hover:text-rose-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181620] rounded-3xl p-6 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div>
              <h4 className="font-extrabold font-display text-base text-stone-800 dark:text-stone-100">Hapus Catatan Ini?</h4>
              <p className="text-xs text-stone-400 mt-1">Data yang dihapus tidak dapat dikembalikan lagi.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 font-bold text-xs text-stone-600 dark:text-stone-300"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
