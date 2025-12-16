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
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="space-y-3 mb-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal:</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>

        {/* Ongkir */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <label className="flex items-center gap-2 text-sm mb-2">
            <Truck size={16} className="text-blue-400" />
            <span className="font-medium">Ongkos Kirim:</span>
          </label>
          <input
            type="number"
            value={shippingCost}
            onChange={(e) => onShippingCostChange(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-600 border border-gray-500 rounded p-2 text-sm font-medium"
            placeholder="0"
            min="0"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onShippingCostChange(5000)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 p-1.5 rounded text-xs"
            >
              5K
            </button>
            <button
              onClick={() => onShippingCostChange(10000)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 p-1.5 rounded text-xs"
            >
              10K
            </button>
            <button
              onClick={() => onShippingCostChange(15000)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 p-1.5 rounded text-xs"
            >
              15K
            </button>
            <button
              onClick={() => onShippingCostChange(20000)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 p-1.5 rounded text-xs"
            >
              20K
            </button>
          </div>
        </div>
        
        {/* Grand Total */}
        <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-3">
          <span>TOTAL:</span>
          <span className="text-blue-400">{formatCurrency(grandTotal)}</span>
        </div>
        
        {/* Uang Bayar */}
        <div>
          <label className="block text-sm mb-1">Uang Bayar:</label>
          <input
            type="number"
            value={paid}
            onChange={(e) => onPaidChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-lg font-bold"
            placeholder="0"
            autoFocus
          />
        </div>

        {/* Kembalian */}
        {parseInt(paid) >= grandTotal && (
          <div className="flex justify-between text-lg font-bold text-green-400">
            <span>KEMBALI:</span>
            <span>{formatCurrency(change)}</span>
          </div>
        )}
      </div>

      {/* Button Bayar */}
      <button
        onClick={onPayment}
        disabled={parseInt(paid) < grandTotal || loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
      >
        <DollarSign size={24} />
        {loading ? 'Memproses...' : 'Bayar & Cetak Nota'}
      </button>
    </div>
  );
}