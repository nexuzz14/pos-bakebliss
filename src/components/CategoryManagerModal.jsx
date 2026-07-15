import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Tag, Sparkles, AlertCircle } from 'lucide-react';
import { categoryService } from '../services/categoryService';

export function CategoryManagerModal({ isOpen, onClose, onShowToast, onCategoriesUpdated }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🥐');

  const iconsList = ['🥐', '🍰', '☕', '🍪', '🧁', '🍞', '🥤', '🍕', '🥯'];

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal memuat daftar kategori', 'error');
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  if (!isOpen) return null;

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAdding(true);
    try {
      await categoryService.create({
        name: newCatName.trim(),
        icon: newCatIcon,
        active: true
      });
      onShowToast?.('Kategori berhasil ditambahkan', 'success');
      setNewCatName('');
      await loadCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal menambah kategori (Mungkin nama sudah ada)', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryService.delete(id);
      onShowToast?.('Kategori berhasil dihapus', 'success');
      await loadCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal menghapus kategori', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[88vh] overflow-hidden rounded-3xl bg-white dark:bg-[#181620] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-white/95 dark:bg-[#181620]/95 backdrop-blur-xl shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Tag size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold font-display text-base truncate">
                Kelola Kategori Menu
              </h3>
              <p className="text-xs text-stone-400 truncate">
                Atur pengelompokan produk di kasir dan katalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add new category form */}
        <form onSubmit={handleAddCategory} className="p-4 sm:p-5 bg-stone-50/80 dark:bg-[#131219]/80 border-b border-stone-200/60 dark:border-stone-800 space-y-3 shrink-0">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-400">
            Tambah Kategori Baru
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 rounded-2xl px-2.5 py-2 sm:py-0 h-full shrink-0">
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="bg-transparent text-lg font-bold outline-none cursor-pointer pr-1"
                >
                  {iconsList.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama Kategori (cth: Bingsoo & Dessert)"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newCatName.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              <Plus size={16} />
              <span>Tambah</span>
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center text-stone-400">
              <p className="text-sm font-bold">Belum ada kategori tersimpan</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-stone-50 dark:bg-[#131219] border border-stone-200/60 dark:border-stone-800 group hover:border-rose-500/30 transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1b1a23] border border-stone-200 dark:border-stone-800 flex items-center justify-center text-lg shadow-sm shrink-0">
                    {cat.icon || '🧁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">
                      {cat.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-medium block truncate">
                      Aktif di Terminal POS
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 rounded-xl text-stone-400 hover:bg-rose-500/15 hover:text-rose-500 transition-colors shrink-0"
                  title="Hapus Kategori"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50/80 dark:bg-[#131219]/80 border-t border-stone-200/60 dark:border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
