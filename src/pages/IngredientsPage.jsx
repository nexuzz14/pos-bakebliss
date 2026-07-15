import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToExcel } from '../utils/exportExcel';
import {
  PlusCircle,
  FlaskConical,
  Download,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  PackageCheck,
  Boxes,
  FileSpreadsheet
} from 'lucide-react';

const UNITS = ['kg', 'gram', 'liter', 'ml', 'pcs', 'lusin', 'pak', 'sachet', 'botol', 'kaleng'];

const initialForm = {
  name: '',
  unit: 'kg',
  stock: '',
  min_stock: '',
  price_per_unit: '',
};

function getIngredientIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('tepung') || n.includes('flour') || n.includes('gandum')) return '🌾';
  if (n.includes('mentega') || n.includes('butter') || n.includes('margarin') || n.includes('oil')) return '🧈';
  if (n.includes('susu') || n.includes('milk') || n.includes('cream') || n.includes('keju') || n.includes('cheese')) return '🥛';
  if (n.includes('cokelat') || n.includes('choc') || n.includes('cacao') || n.includes('kakao')) return '🍫';
  if (n.includes('gula') || n.includes('sugar') || n.includes('madu') || n.includes('syrup')) return '🍯';
  if (n.includes('telur') || n.includes('egg')) return '🥚';
  if (n.includes('ragi') || n.includes('yeast') || n.includes('baking')) return '🧪';
  return '📦';
}

export function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showMoney, setShowMoney] = useState(false);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

  const filtered = ingredients.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchLow = !showLowStockOnly || (Number(i.stock) <= Number(i.min_stock) && Number(i.min_stock) > 0);
    return matchSearch && matchLow;
  });

  const lowStockCount = ingredients.filter(i =>
    Number(i.stock) <= Number(i.min_stock) && Number(i.min_stock) > 0
  ).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parseDecimal = (val) => Number(String(val).replace(',', '.')) || 0;

      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        stock: parseDecimal(form.stock),
        min_stock: parseDecimal(form.min_stock),
        price_per_unit: parseDecimal(form.price_per_unit),
      };

      if (editId) {
        const { error } = await supabase.from('ingredients').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ingredients').insert(payload);
        if (error) throw error;
      }

      setForm(initialForm);
      setEditId(null);
      setShowForm(false);
      fetchIngredients();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      unit: item.unit,
      stock: String(item.stock),
      min_stock: String(item.min_stock),
      price_per_unit: String(item.price_per_unit),
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', deleteId);
      if (error) throw error;
      setDeleteId(null);
      fetchIngredients();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleExport = () => {
    const exportData = ingredients.map(i => ({
      'Nama Bahan': i.name,
      Satuan: i.unit,
      Stok: Number(i.stock),
      'Stok Min': Number(i.min_stock),
      'Harga/Satuan (Rp)': Number(i.price_per_unit),
      Status: Number(i.stock) <= Number(i.min_stock) ? 'Stok Menipis' : 'Aman',
    }));
    exportToExcel(exportData, 'Bahan-Baku-BakeBliss', 'Bahan Baku');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500 text-white shadow-sm">
              Inventaris Bakery
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Monitoring Stok & Harga Bahan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            Stok Bahan Baku
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
            <span>Tambah Bahan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Item Bahan</span>
            <p className="text-2xl font-extrabold font-display text-stone-800 dark:text-stone-100">
              {ingredients.length} <span className="text-xs font-normal text-stone-400">Macam</span>
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <Boxes size={24} />
          </div>
        </div>

        <div
          onClick={() => setShowLowStockOnly(prev => !prev)}
          className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            lowStockCount > 0
              ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500'
              : 'bg-white/90 dark:bg-[#1b1a23]/90 border-stone-200/80 dark:border-stone-800/80'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Peringatan Stok Menipis</span>
            <p className={`text-2xl font-extrabold font-display ${lowStockCount > 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {lowStockCount} <span className="text-xs font-normal text-stone-400">Bahan</span>
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${lowStockCount > 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
            {lowStockCount > 0 ? <AlertTriangle size={24} /> : <PackageCheck size={24} />}
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Filter Cepat</span>
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                showLowStockOnly
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-rose-500/20'
              }`}
            >
              {showLowStockOnly ? 'Tampilkan Semua Bahan' : 'Filter Stok Menipis Saja'}
            </button>
          </div>
          <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-500">
            <FlaskConical size={24} />
          </div>
        </div>
      </div>

      {/* Form Add / Edit Ingredient MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181620] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold font-display text-lg text-stone-800 dark:text-stone-100">
                {editId ? 'Edit Stok & Harga Bahan' : 'Tambah Bahan Baku Baru'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Nama Bahan Baku</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Contoh: Tepung Terigu Protein Tinggi"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Satuan Ukur</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Stok Saat Ini</label>
                  <input
                    type="number"
                    step="any"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    placeholder="0"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Stok Minimum</label>
                  <input
                    type="number"
                    step="any"
                    value={form.min_stock}
                    onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                    placeholder="5"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.price_per_unit}
                    onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                    placeholder="15000"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-bold"
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
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama bahan baku bakery..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-100/80 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Ingredients Grid / Table */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-stone-600 dark:text-stone-300">Tidak Ada Bahan Baku Ditemukan</p>
            <p className="text-xs text-stone-400 mt-0.5">Silahkan tambah bahan baku baru atau sesuaikan filter Anda.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {filtered.map(item => {
              const icon = getIngredientIcon(item.name);
              const isLow = Number(item.stock) <= Number(item.min_stock) && Number(item.min_stock) > 0;
              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                    isLow
                      ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-4 border-rose-500'
                      : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">
                          {item.name}
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-500 border border-rose-500/20">
                            Stok Menipis
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400">
                        Harga: <span className="font-semibold text-rose-500 dark:text-rose-400">{displayMoney(item.price_per_unit)}</span> / {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Stok Tersedia</span>
                      <p className={`font-extrabold font-display text-base ${isLow ? 'text-rose-500' : 'text-stone-800 dark:text-stone-100'}`}>
                        {Number(item.stock)} <span className="text-xs font-bold text-stone-400">{item.unit}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-rose-500 transition-colors"
                        title="Edit Bahan"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-2 rounded-xl hover:bg-rose-500/15 text-stone-400 hover:text-rose-500 transition-colors"
                        title="Hapus Bahan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181620] rounded-3xl p-6 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div>
              <h4 className="font-extrabold font-display text-base text-stone-800 dark:text-stone-100">Hapus Bahan Baku Ini?</h4>
              <p className="text-xs text-stone-400 mt-1">Data bahan yang dihapus tidak akan muncul lagi di inventaris.</p>
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
