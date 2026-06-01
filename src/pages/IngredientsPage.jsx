import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToExcel } from '../utils/exportExcel';
import {
  PlusCircle, FlaskConical, Download, X, Pencil,
  Trash2, AlertTriangle, ChevronDown, Search, Eye, EyeOff
} from 'lucide-react';

const UNITS = ['kg', 'gram', 'liter', 'ml', 'pcs', 'lusin', 'pak', 'sachet', 'botol', 'kaleng'];

const initialForm = {
  name: '',
  unit: 'kg',
  stock: '',
  min_stock: '',
  price_per_unit: '',
};

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
      'Satuan': i.unit,
      'Stok': Number(i.stock),
      'Min. Stok': Number(i.min_stock),
      'Status': Number(i.stock) <= Number(i.min_stock) && Number(i.min_stock) > 0 ? 'Stok Rendah' : 'Aman',
      'Harga/Unit (Rp)': Number(i.price_per_unit),
      'Total Nilai (Rp)': Number(i.stock) * Number(i.price_per_unit),
    }));
    exportToExcel(exportData, `Bahan-BakeBliss-${new Date().toISOString().split('T')[0]}`, 'Bahan');
  };

  const isLowStock = (item) =>
    Number(item.min_stock) > 0 && Number(item.stock) <= Number(item.min_stock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">🥣 Bahan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen stok bahan baku</p>
          </div>
          <button 
            onClick={() => setShowMoney(!showMoney)}
            className="p-2 ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-sm"
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

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
            ⚠️ <strong>{lowStockCount} bahan</strong> memiliki stok di bawah batas minimum!
            <button onClick={() => setShowLowStockOnly(true)} className="ml-2 underline">
              Lihat
            </button>
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{editId ? 'Edit Bahan' : 'Tambah Bahan'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Nama Bahan</label>
                <input type="text" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="cth: Tepung Terigu"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Satuan */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Satuan</label>
                <div className="relative">
                  <select value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Harga/Unit */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Harga per Unit (Rp)</label>
                <input type="text" inputMode="decimal" value={form.price_per_unit} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stok */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Stok Saat Ini</label>
                <input type="text" inputMode="decimal" value={form.stock} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Min Stok */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Min. Stok (alert)</label>
                <input type="text" inputMode="decimal" value={form.min_stock} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setShowForm(false); setEditId(null); setForm(initialForm); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : editId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} placeholder="Cari bahan..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button onClick={() => setShowLowStockOnly(v => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
            showLowStockOnly
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}>
          <AlertTriangle size={16} />
          Stok Rendah {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Jenis</p>
          <p className="text-2xl font-bold mt-1">{ingredients.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Stok Rendah</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>
            {lowStockCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Nilai Stok</p>
          <p className="text-lg font-bold mt-1">
            {displayMoney(ingredients.reduce((s, i) => s + Number(i.stock) * Number(i.price_per_unit), 0))}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FlaskConical size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500">{search ? 'Bahan tidak ditemukan' : 'Belum ada bahan'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">
                Tambah Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Nama Bahan</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Stok</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Min. Stok</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Harga/Unit</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                    isLowStock(item) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''
                  }`}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${isLowStock(item) ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                        {Number(item.stock).toLocaleString('id-ID')}
                      </span>
                      <span className="text-gray-400 ml-1 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {Number(item.min_stock).toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {displayMoney(item.price_per_unit)}/{item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLowStock(item) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          <AlertTriangle size={10} /> Rendah
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)}
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

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Hapus Bahan?</h3>
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
