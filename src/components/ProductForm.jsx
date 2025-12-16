import React, { useState } from 'react';
import { X } from 'lucide-react';

export function ProductForm({ product, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    active: product?.active !== undefined ? product.active : true
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama produk wajib diisi';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Harga harus lebih dari 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        name: formData.name.trim(),
        price: parseInt(formData.price),
        active: formData.active
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-lg font-bold">
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-gray-700 border ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              } rounded-lg p-3 focus:outline-none focus:border-blue-500`}
              placeholder="Contoh: Brownies Coklat"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={`w-full bg-gray-700 border ${
                errors.price ? 'border-red-500' : 'border-gray-600'
              } rounded-lg p-3 focus:outline-none focus:border-blue-500`}
              placeholder="25000"
              min="0"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          <div className="flex items-center gap-3 bg-gray-700 p-4 rounded-lg">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600"
            />
            <label htmlFor="active" className="flex-1 cursor-pointer">
              <div className="font-medium">Produk Aktif</div>
              <div className="text-xs text-gray-400">
                Produk aktif akan tampil di halaman kasir
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg font-medium"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-3 rounded-lg font-medium"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : (product ? 'Update' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}