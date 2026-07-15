import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles, Plus, Check, Loader2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';

const DEFAULT_CATEGORIES = [
  { name: 'Pastry & Roti', icon: '🥐' },
  { name: 'Cake & Tart', icon: '🍰' },
  { name: 'Minuman', icon: '☕' },
  { name: 'Cookies & Snack', icon: '🍪' },
  { name: 'Bakery', icon: '🧁' }
];

export function ProductForm({ product, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    category: product?.category || 'Pastry & Roti',
    active: product?.active !== undefined ? product.active : true
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Inline Category Creator State
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🥐');
  const [creatingCat, setCreatingCat] = useState(false);

  const emojiOptions = ['🥐', '🍰', '☕', '🍪', '🧁', '🍞', '🍩', '🥤', '🍕', '🎂'];

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoryService.getActive();
        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const handleCreateNewCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      await categoryService.create({
        name: newCatName.trim(),
        icon: newCatIcon,
        active: true
      });
      const data = await categoryService.getActive();
      if (data && data.length > 0) {
        setCategories(data);
      }
      setFormData(prev => ({ ...prev, category: newCatName.trim() }));
      setNewCatName('');
      setShowNewCategory(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menambah kategori di Supabase (mungkin nama sudah ada).');
    } finally {
      setCreatingCat(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!formData.price || formData.price <= 0)
      newErrors.price = 'Harga harus lebih dari 0';
    if (!formData.category)
      newErrors.category = 'Pilih kategori produk';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        name: formData.name.trim(),
        price: parseInt(formData.price),
        category: formData.category,
        active: formData.active
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#181620] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between sticky top-0 border-b border-stone-100 dark:border-stone-800/80 bg-white/95 dark:bg-[#181620]/95 backdrop-blur-xl z-10 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles size={16} />
            </div>
            <h2 className="text-base font-extrabold font-display truncate">
              {product ? 'Edit Produk Patisserie' : 'Tambah Produk Baru'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full rounded-2xl px-4 py-3 bg-stone-50 dark:bg-[#131219] border ${
                errors.name
                  ? 'border-rose-500'
                  : 'border-stone-300 dark:border-stone-700'
              } focus:outline-none focus:border-rose-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-sm font-medium transition-colors`}
              placeholder="Contoh: Butter Croissant Premium"
              autoFocus
            />
            {errors.name && (
              <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.name}</p>
            )}
          </div>

          {/* Kategori Produk */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                Kategori Produk <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-xs font-extrabold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Plus size={13} />
                <span>{showNewCategory ? 'Tutup Input Kategori' : 'Buat Kategori Baru'}</span>
              </button>
            </div>

            {/* Inline Add Category Form */}
            {showNewCategory && (
              <div className="mb-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2.5 animate-fade-in">
                <p className="text-xs font-bold text-stone-700 dark:text-stone-200">
                  Tambah Kategori ke Database Supabase:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {emojiOptions.map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setNewCatIcon(emo)}
                      className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center transition-all ${
                        newCatIcon === emo
                          ? 'bg-rose-500 text-white shadow-sm scale-110'
                          : 'bg-white dark:bg-[#14131a] border border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nama Kategori (cth: Donat & Churros)"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    disabled={creatingCat || !newCatName.trim()}
                    onClick={handleCreateNewCategory}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                  >
                    {creatingCat ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Simpan Kategori</span>
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full rounded-2xl px-4 py-3 bg-stone-50 dark:bg-[#131219] border ${
                  errors.category
                    ? 'border-rose-500'
                    : 'border-stone-300 dark:border-stone-700'
                } focus:outline-none focus:border-rose-500 text-stone-900 dark:text-stone-100 text-sm font-bold transition-colors appearance-none pr-10`}
              >
                {categories.map((cat) => {
                  const catName = typeof cat === 'object' ? cat.name : cat;
                  const catIcon = typeof cat === 'object' && cat.icon ? cat.icon : '🏷️';
                  return (
                    <option key={catName} value={catName}>
                      {catIcon} {catName}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
                <Tag size={16} />
              </div>
            </div>
            {errors.category && (
              <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.category}</p>
            )}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Harga Satuan (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className={`w-full rounded-2xl px-4 py-3 bg-stone-50 dark:bg-[#131219] border ${
                errors.price
                  ? 'border-rose-500'
                  : 'border-stone-300 dark:border-stone-700'
              } focus:outline-none focus:border-rose-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-sm font-extrabold transition-colors`}
              placeholder="25000"
              min="0"
            />
            {errors.price && (
              <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.price}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-[#131219] border border-stone-200 dark:border-stone-800">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="w-5 h-5 rounded accent-rose-500 cursor-pointer"
            />
            <label htmlFor="active" className="flex-1 cursor-pointer select-none">
              <div className="font-bold text-sm text-stone-800 dark:text-stone-100">Status Produk Aktif</div>
              <div className="text-xs text-stone-400">
                Tampilkan langsung di terminal kasir cabang
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl font-bold text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg shadow-rose-500/25 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
