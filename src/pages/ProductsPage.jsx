import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  Box,
  Archive,
  Activity,
  Sparkles,
  Tag,
  Coffee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { productService } from '../services/productService';
import { ProductForm } from '../components/ProductForm';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

function getProductBadge(product) {
  const name = (product.name || '').toLowerCase();
  if (name.includes('kopi') || name.includes('coffee') || name.includes('latte') || name.includes('tea') || name.includes('teh') || name.includes('matcha')) {
    return { icon: '☕', label: 'Minuman', color: 'from-indigo-600 to-purple-700', pill: 'bg-indigo-950/20 text-indigo-400' };
  }
  if (name.includes('croissant') || name.includes('roti') || name.includes('bread') || name.includes('pastry') || name.includes('puff')) {
    return { icon: '🥐', label: 'Pastry & Roti', color: 'from-rose-500 to-pink-600', pill: 'bg-rose-500/15 text-rose-400' };
  }
  if (name.includes('cake') || name.includes('kue') || name.includes('bolu') || name.includes('brownies') || name.includes('tart') || name.includes('lapis')) {
    return { icon: '🍰', label: 'Cake & Tart', color: 'from-pink-500 to-rose-500', pill: 'bg-pink-500/15 text-pink-400' };
  }
  if (name.includes('cookies') || name.includes('nastar') || name.includes('kastengel') || name.includes('salju') || name.includes('pie')) {
    return { icon: '🍪', label: 'Cookies & Snack', color: 'from-purple-500 to-indigo-600', pill: 'bg-purple-500/15 text-purple-400' };
  }
  return { icon: '🧁', label: 'Bakery', color: 'from-rose-500 to-indigo-600', pill: 'bg-rose-500/15 text-rose-400' };
}

export function ProductsPage({ onShowToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (error) {
      handleError(error, 'Gagal memuat produk', onShowToast);
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSaveProduct = async (data) => {
    setLoading(true);
    try {
      if (editProduct) {
        await productService.update(editProduct.id, data);
        onShowToast('Produk berhasil diupdate', 'success');
      } else {
        await productService.create(data);
        onShowToast('Produk berhasil ditambahkan', 'success');
      }

      await loadProducts();
      setShowForm(false);
      setEditProduct(null);
    } catch (error) {
      handleError(error, 'Gagal menyimpan produk', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      await productService.softDelete(deleteProduct.id);
      onShowToast('Produk berhasil dinonaktifkan', 'success');
      await loadProducts();
      setDeleteProduct(null);
    } catch (error) {
      handleError(error, 'Gagal menghapus produk', onShowToast);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateProduct = async (product) => {
    try {
      await productService.update(product.id, { active: true });
      onShowToast('Produk berhasil diaktifkan', 'success');
      await loadProducts();
    } catch (error) {
      handleError(error, 'Gagal mengaktifkan produk', onShowToast);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? p.active : !p.active;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.active).length,
    inactive: products.filter(p => !p.active).length
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500 text-white shadow-sm">
              Menu & Katalog
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Manajemen Harga & Item</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            Katalog Produk Bakery
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-white/90 dark:bg-[#1b1a23]/90 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800/80 px-5 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Tag size={18} className="text-rose-500" />
            <span>Kelola Kategori Menu</span>
          </button>

          <button
            onClick={() => { setEditProduct(null); setShowForm(true); }}
            className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Semua Produk</span>
            <p className="text-2xl font-extrabold font-display text-stone-800 dark:text-stone-100">{stats.total}</p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <Box size={24} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Menu Aktif Ditampilkan</span>
            <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">{stats.active}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Diarsip / Nonaktif</span>
            <p className="text-2xl font-extrabold font-display text-stone-400">{stats.inactive}</p>
          </div>
          <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-500">
            <Archive size={24} />
          </div>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Semua Item' },
            { id: 'active', label: 'Aktif' },
            { id: 'inactive', label: 'Arsip / Nonaktif' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                filter === f.id
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-stone-100 dark:bg-[#14131a] text-stone-600 dark:text-stone-400 hover:bg-rose-500/15 hover:text-rose-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk bakery..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-100/80 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Modern Product Catalog Cards Grid */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden p-6 shadow-sm">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-3xl">
              🥐
            </div>
            <p className="text-base font-bold text-stone-700 dark:text-stone-300">Tidak Ada Produk Ditemukan</p>
            <p className="text-xs text-stone-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
            {!search && filter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-5 px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                + Tambah Produk Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => {
              const badge = getProductBadge(product);
              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    product.active
                      ? 'bg-stone-50/70 dark:bg-[#14131a]/80 border-stone-200/70 dark:border-stone-800 hover:border-rose-500/40 hover:shadow-md'
                      : 'bg-stone-100/50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-13 h-13 shrink-0 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl shadow-md`}>
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${badge.pill}`}>
                          {product.category || badge.label}
                        </span>
                        {!product.active && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-stone-200 dark:bg-stone-800 text-stone-500">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">
                        {product.name}
                      </h3>
                      <p className="text-rose-500 dark:text-rose-400 font-extrabold font-display text-sm mt-0.5">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!product.active && (
                      <button
                        onClick={() => handleActivateProduct(product)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-colors"
                        title="Aktifkan Kembali"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditProduct(product); setShowForm(true); }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/15 hover:bg-rose-500 text-rose-500 dark:text-rose-400 hover:text-white transition-colors"
                      title="Edit Produk"
                    >
                      <Edit2 size={16} />
                    </button>
                    {product.active && (
                      <button
                        onClick={() => setDeleteProduct(product)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white transition-colors"
                        title="Nonaktifkan / Arsipkan"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm product={editProduct} onSave={handleSaveProduct} onCancel={() => { setShowForm(false); setEditProduct(null); }} loading={loading} />
      )}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onShowToast={onShowToast}
        onCategoriesUpdated={loadProducts}
      />
      {deleteProduct && (
        <DeleteConfirmModal product={deleteProduct} onConfirm={handleDeleteProduct} onCancel={() => setDeleteProduct(null)} loading={loading} />
      )}
    </div>
  );
}