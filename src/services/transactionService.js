import { supabase } from './supabase';

export const transactionService = {
  async create(data) {
    try {
      // Get today's date info for daily reset sequence
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // e.g. 20260523
      const todayStart = new Date(now.setHours(0,0,0,0)).toISOString();
      const todayEnd = new Date(now.setHours(23,59,59,999)).toISOString();

      // Fetch the latest transaction number for today
      const { data: latestTrx } = await supabase
        .from('transactions')
        .select('transaction_no')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .order('created_at', { ascending: false })
        .limit(1);

      let nextSequence = 1;
      if (latestTrx && latestTrx.length > 0) {
        const lastNo = latestTrx[0].transaction_no;
        // Expecting format TRX-YYYYMMDD-XXXX
        const parts = lastNo.split('-');
        if (parts.length === 3) {
          nextSequence = parseInt(parts[2], 10) + 1;
        }
      }

      // Generate sequence like TRX-20260523-0001
      const transactionNo = `TRX-${dateStr}-${String(nextSequence).padStart(4, '0')}`;

      // ✅ INSERT TRANSACTION
      const { data: trx, error } = await supabase
        .from('transactions')
        .insert([{
          transaction_no: transactionNo,
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