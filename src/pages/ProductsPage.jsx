import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Check } from 'lucide-react';
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

  
  const loadProducts = async () => {
      setLoading(true);
      try {
          const data = await productService.getAll();
          setProducts(data);
        } catch (error) {
            handleError(error, 'Gagal memuat produk', onShowToast);
        }
        setLoading(false);
    };
    
    useEffect(() => {
    (async () => {
        await loadProducts();
    })();
    }, []);


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
    }
    setLoading(false);
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
    }
    setLoading(false);
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
    if (filter === 'active') return p.active;
    if (filter === 'inactive') return !p.active;
    return true;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.active).length,
    inactive: products.filter(p => !p.active).length
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package size={24} />
            Kelola Produk
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Tambah
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <div className="text-xs text-gray-400">Aktif</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
            <div className="text-xs text-gray-400">Nonaktif</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'all' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          Semua ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'active' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          Aktif ({stats.active})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            filter === 'inactive' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          Nonaktif ({stats.inactive})
        </button>
      </div>

      {/* Product List */}
      {loading && filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Memuat produk...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Tidak ada produk</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium"
          >
            Tambah Produk Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className={`bg-gray-800 rounded-lg p-4 ${
                !product.active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{product.name}</h3>
                    {product.active ? (
                      <span className="px-2 py-0.5 bg-green-600 text-xs rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-600 text-xs rounded-full">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div className="text-blue-400 font-semibold">
                    {formatCurrency(product.price)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!product.active && (
                    <button
                      onClick={() => handleActivateProduct(product)}
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"
                      title="Aktifkan"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditProduct(product);
                      setShowForm(true);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  {product.active && (
                    <button
                      onClick={() => setDeleteProduct(product)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      title="Nonaktifkan"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ProductForm
          product={editProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false);
            setEditProduct(null);
          }}
          loading={loading}
        />
      )}

      {deleteProduct && (
        <DeleteConfirmModal
          product={deleteProduct}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeleteProduct(null)}
          loading={loading}
        />
      )}
    </div>
  );
}