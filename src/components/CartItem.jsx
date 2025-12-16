import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function CartItem({ item, onUpdateQty, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-gray-700 p-3 rounded text-white">
      <div className="flex-1">
        <div className="font-semibold text-sm">{item.name}</div>
        <div className="text-xs text-blue-400">{formatCurrency(item.price)}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQty(item.id, -1)}
          className="w-8 h-8 bg-red-600 rounded flex items-center justify-center hover:bg-red-700"
        >
          <Minus size={16} color="white" />
        </button>
        <span className="w-8 text-center font-bold">{item.qty}</span>
        <button
          onClick={() => onUpdateQty(item.id, 1)}
          className="w-8 h-8 bg-green-600 rounded flex items-center justify-center hover:bg-green-700"
        >
          <Plus size={16} color="white" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-500 ml-2"
        >
          <Trash2 size={16} color="white" />
        </button>
      </div>
    </div>
  );
}