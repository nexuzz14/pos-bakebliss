import { supabase } from './supabase';

export const transactionService = {
  async create(data) {
    try {
      // ✅ INSERT TRANSACTION (transaction_no akan digenerate otomatis oleh Database Trigger Supabase)
      const { data: trx, error } = await supabase
        .from('transactions')
        .insert([{
          transaction_no: '', // Kosongkan agar diisi otomatis oleh trigger
          total: data.total,
          shipping_cost: data.shipping_cost || 0,
          grand_total: data.grand_total,
          paid: data.paid,
          change: data.change
        }])
        .select()
        .single();

      if (error) throw error;
      
      const transactionNo = trx.transaction_no; // Ambil nomor hasil generate dari Supabase

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

      // ✅ AUTO INSERT CASH FLOW (uang masuk dari penjualan)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('cash_flow').insert({
          type: 'in',
          category: 'Penjualan',
          description: `Transaksi ${transactionNo} — ${data.items.length} item`,
          amount: data.grand_total,
          date: new Date().toISOString().split('T')[0],
          user_id: user?.id ?? null
        });
      } catch (cfErr) {
        // Jangan gagalkan transaksi hanya karena cash flow gagal
        console.warn('Auto cash flow insert failed:', cfErr);
      }

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