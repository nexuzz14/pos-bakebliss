import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function DeleteConfirmModal({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/50 dark:bg-black/80
    ">
      <div className="
        w-full max-w-sm rounded-lg
        bg-white text-gray-900
        dark:bg-gray-800 dark:text-white
      ">
        {/* Header */}
        <div className="
          p-4 border-b
          border-gray-200 dark:border-gray-700
        ">
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={20} />
            Konfirmasi Hapus
          </h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Apakah Anda yakin ingin menonaktifkan produk:
          </p>

          <div className="
            p-3 rounded-lg mb-4
            bg-gray-100 dark:bg-gray-700
          ">
            <div className="font-bold">{product.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(product.price)}
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            Produk akan dinonaktifkan dan tidak tampil di kasir
          </p>
        </div>

        {/* Actions */}
        <div className="
          p-4 border-t flex gap-3
          border-gray-200 dark:border-gray-700
        ">
          <button
            onClick={onCancel}
            disabled={loading}
            className="
              flex-1 p-3 rounded-lg font-medium
              bg-gray-200 hover:bg-gray-300
              dark:bg-gray-700 dark:hover:bg-gray-600
              disabled:opacity-50
            "
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="
              flex-1 p-3 rounded-lg font-medium
              bg-red-600 hover:bg-red-700
              text-white
              disabled:bg-gray-400 dark:disabled:bg-gray-600
            "
          >
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
