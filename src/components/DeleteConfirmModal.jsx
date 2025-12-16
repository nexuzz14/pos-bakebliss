import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function DeleteConfirmModal({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-sm">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-red-500 flex items-center gap-2">
            <AlertCircle size={20} />
            Konfirmasi Hapus
          </h2>
        </div>
        
        <div className="p-4">
          <p className="text-gray-300 mb-4">
            Apakah Anda yakin ingin menonaktifkan produk:
          </p>
          <div className="bg-gray-700 p-3 rounded-lg mb-4">
            <div className="font-bold">{product.name}</div>
            <div className="text-sm text-gray-400">{formatCurrency(product.price)}</div>
          </div>
          <p className="text-xs text-gray-400">
            Produk akan dinonaktifkan dan tidak tampil di kasir
          </p>
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg font-medium"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 p-3 rounded-lg font-medium"
            disabled={loading}
          >
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}