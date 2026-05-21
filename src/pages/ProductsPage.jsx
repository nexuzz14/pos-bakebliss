import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit2, Trash2, Check, Search, Box, Archive, Activity } from 'lucide-react';
import { productService } from '../services/productService';
import { ProductForm } from '../components/ProductForm';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatCurrency } from '../utils/formatCurrency';
import { handleError } from '../utils/errorHandler';

export function ProductsPage({ onShowToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Kelola Menu</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Daftar produk dan harga</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Box size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Produk</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Aktif</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
              <Archive size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Nonaktif</span>
          </div>
          <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}
            >
              {f === 'all' ? 'Semua' : f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30 animate-pulse" />
            <p>Memuat produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Tidak ada produk ditemukan</p>
            <p className="text-sm mt-1">Coba sesuaikan pencarian atau filter Anda.</p>
            {!search && filter === 'all' && (
              <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl font-bold text-sm">
                Tambah Produk Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredProducts.map(product => (
              <div key={product.id} className={`p-4 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!product.active ? 'opacity-60 bg-gray-50/50 dark:bg-gray-800/50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${product.active ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gray-200 dark:bg-gray-700 grayscale'}`}>
                    🍰
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {product.name}
                      {!product.active && <span className="text-[10px] uppercase tracking-wider bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-600 dark:text-gray-300">Nonaktif</span>}
                    </h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mt-0.5">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!product.active && (
                    <button onClick={() => handleActivateProduct(product)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors" title="Aktifkan">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => { setEditProduct(product); setShowForm(true); }} className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  {product.active && (
                    <button onClick={() => setDeleteProduct(product)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors" title="Nonaktifkan">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm product={editProduct} onSave={handleSaveProduct} onCancel={() => { setShowForm(false); setEditProduct(null); }} loading={loading} />
      )}
      {deleteProduct && (
        <DeleteConfirmModal product={deleteProduct} onConfirm={handleDeleteProduct} onCancel={() => setDeleteProduct(null)} loading={loading} />
      )}
    </div>
  );
}