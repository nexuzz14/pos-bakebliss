import React from 'react';
import { DollarSign, Truck } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function PaymentSection({ 
  subtotal, 
  shippingCost, 
  onShippingCostChange,
  grandTotal, 
  paid, 
  onPaidChange, 
  change, 
  onPayment, 
  loading 
}) {
  return (
    <div className="
      rounded-lg p-4
      bg-white text-gray-900
      dark:bg-gray-800 dark:text-white
    ">
      <div className="space-y-3 mb-4">

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>

        {/* Ongkir */}
        <div className="
          p-3 rounded-lg
          bg-gray-100 dark:bg-gray-700
        ">
          <label className="flex items-center gap-2 text-sm mb-2">
            <Truck size={16} className="text-blue-500 dark:text-blue-400" />
            <span className="font-medium">Ongkos Kirim:</span>
          </label>

          <input
            type="number"
            value={shippingCost}
            onChange={(e) =>
              onShippingCostChange(parseInt(e.target.value) || 0)
            }
            className="
              w-full rounded p-2 text-sm font-medium
              bg-white border border-gray-300
              dark:bg-gray-600 dark:border-gray-500
            "
            placeholder="0"
            min="0"
          />

          <div className="flex gap-2 mt-2">
            {[5000, 10000, 15000, 20000].map(value => (
              <button
                key={value}
                onClick={() => onShippingCostChange(value)}
                className="
                  flex-1 p-1.5 rounded text-xs font-medium
                  bg-gray-200 hover:bg-gray-300
                  dark:bg-gray-600 dark:hover:bg-gray-500
                "
              >
                {value / 1000}K
              </button>
            ))}
          </div>
        </div>

        {/* Grand Total */}
        <div className="
          flex justify-between text-lg font-bold pt-3
          border-t border-gray-200
          dark:border-gray-700
        ">
          <span>TOTAL:</span>
          <span className="text-blue-600 dark:text-blue-400">
            {formatCurrency(grandTotal)}
          </span>
        </div>

        {/* Uang Bayar */}
        <div>
          <label className="block text-sm mb-1">
            Uang Bayar:
          </label>
          <input
            type="number"
            value={paid}
            onChange={(e) => onPaidChange(e.target.value)}
            className="
              w-full rounded p-3 text-lg font-bold
              bg-white border border-gray-300
              dark:bg-gray-700 dark:border-gray-600
            "
            placeholder="0"
            autoFocus
          />
        </div>

        {/* Kembalian */}
        {parseInt(paid) >= grandTotal && (
          <div className="flex justify-between text-lg font-bold text-green-600 dark:text-green-400">
            <span>KEMBALI:</span>
            <span>{formatCurrency(change)}</span>
          </div>
        )}
      </div>

      {/* Button Bayar */}
      <button
        onClick={onPayment}
        disabled={parseInt(paid) < grandTotal || loading}
        className="
          w-full p-4 rounded-lg font-bold text-lg
          flex items-center justify-center gap-2
          bg-green-600 hover:bg-green-700
          text-white
          disabled:bg-gray-400 dark:disabled:bg-gray-600
          disabled:cursor-not-allowed
        "
      >
        <DollarSign size={24} />
        {loading ? 'Memproses...' : 'Bayar & Cetak Nota'}
      </button>
    </div>
  );
}
