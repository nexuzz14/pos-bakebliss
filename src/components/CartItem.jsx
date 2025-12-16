import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function CartItem({ item, onUpdateQty, onRemove }) {
  return (
    <div className="
      flex items-center gap-2 p-3 rounded
      bg-gray-100 text-gray-900
      dark:bg-gray-700 dark:text-white
    ">
      <div className="flex-1">
        <div className="font-semibold text-sm">{item.name}</div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          {formatCurrency(item.price)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Minus */}
        <button
          onClick={() => onUpdateQty(item.id, -1)}
          className="
            w-8 h-8 rounded flex items-center justify-center
            bg-red-500 hover:bg-red-600
            text-white
          "
        >
          <Minus size={16} />
        </button>

        <span className="w-8 text-center font-bold">
          {item.qty}
        </span>

        {/* Plus */}
        <button
          onClick={() => onUpdateQty(item.id, 1)}
          className="
            w-8 h-8 rounded flex items-center justify-center
            bg-green-500 hover:bg-green-600
            text-white
          "
        >
          <Plus size={16} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onRemove(item.id)}
          className="
            w-8 h-8 rounded flex items-center justify-center ml-2
            bg-gray-400 hover:bg-gray-500
            dark:bg-gray-600 dark:hover:bg-gray-500
            text-white
          "
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
