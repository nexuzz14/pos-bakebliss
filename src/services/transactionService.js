import { supabase } from './supabase';

export const transactionService = {
  async create(data) {
    try {
      // const transactionNo = `TRX${Date.now()}`;

      // ✅ INSERT TRANSACTION (WAJIB ARRAY)
      const { data: trx, error } = await supabase
        .from('transactions')
        .insert([{
          total: data.total,
          shipping_cost: data.shipping_cost || 0,
          grand_total: data.grand_total,
          paid: data.paid,
          change: data.change
        }])
        .select()
        .single();

      if (error) throw error;

      // ✅ INSERT ITEMS
      const items = data.items.map(item => ({
        transaction_id: trx.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty
      }));

      const { error: itemError } = await supabase
        .from('transaction_items')
        .insert(items);

      if (itemError) throw itemError;

      return trx;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  },

  async getAll() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        items:transaction_items (
          id,
          product_id,
          product_name,
          qty,
          price,
          subtotal
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};